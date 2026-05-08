// Tare motion primitives — built on framer-motion.
// Tuned to the timings/easings from design/README.md.
//
// All primitives respect prefers-reduced-motion automatically (framer-motion
// reads the OS setting and shortens transitions; the global CSS rule in
// index.css clamps any leftover CSS animations.).

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

// ── Easings (matching design/README.md) ────────────────────────────────────
// framer-motion accepts cubic-bezier arrays for `ease`. These approximations
// match the named easings the design references.
export const ease = {
  outCubic:    [0.215, 0.61, 0.355, 1],
  outQuart:    [0.165, 0.84,  0.44,  1],
  outBack:     [0.34,  1.56,  0.64,  1],   // overshoot
  inOutCubic:  [0.65,  0,     0.35,  1],
  inQuad:      [0.55,  0.085, 0.68,  0.53],
}

// ── PageTransition ─────────────────────────────────────────────────────────
// Wrap routed page content. Subsequent visits within a session use a quick
// 200ms fade — only the first visit per session uses a longer reveal.
// Pages that want a heavier custom animation (Glucose droplet, etc.) wrap
// themselves in their own PageHero — this wrapper just handles the basic
// crossfade so back/forward feels smooth.
export function PageTransition({ children }) {
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const seen = useSeenThisSession(pathname)

  const dur = reduce ? 0.001 : (seen ? 0.18 : 0.36)

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: reduce ? 0 : 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reduce ? 0 : -4 }}
        transition={{ duration: dur, ease: ease.outCubic }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Tracks "have we seen this path during this session?" so we know whether
// the entry should be the long reveal or the quick fade.
function useSeenThisSession(pathname) {
  const seenRef = useRef(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    if (seenRef.current === null) {
      // Lazily build the Set from sessionStorage so it survives soft reloads.
      try {
        const raw = sessionStorage.getItem('tare:seenPaths')
        seenRef.current = new Set(raw ? JSON.parse(raw) : [])
      } catch {
        seenRef.current = new Set()
      }
    }
    const wasSeen = seenRef.current.has(pathname)
    setSeen(wasSeen)
    if (!wasSeen) {
      seenRef.current.add(pathname)
      try {
        sessionStorage.setItem('tare:seenPaths', JSON.stringify([...seenRef.current]))
      } catch { /* noop */ }
    }
  }, [pathname])

  return seen
}

// ── Stagger container/item ─────────────────────────────────────────────────
// Use as a pair: <Stagger><StaggerItem/>...<StaggerItem/></Stagger>
// Each item enters with opacity 0 → 1, translateY +16 → 0, scale 0.94 → 1.0,
// staggered 120ms apart with `easeOutBack` (per design Dashboard Reveal spec).
const STAGGER_VARIANTS = {
  container: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
        delayChildren:   0.05,
      },
    },
  },
  item: {
    hidden:  { opacity: 0, y: 16, scale: 0.94 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { duration: 0.45, ease: ease.outBack },
    },
  },
}

export function Stagger({ children, className, ...rest }) {
  return (
    <motion.div
      variants={STAGGER_VARIANTS.container}
      initial="hidden"
      animate="visible"
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className, onClick, ...rest }) {
  return (
    <motion.div
      variants={STAGGER_VARIANTS.item}
      onClick={onClick}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

// ── FadeUp — single element, no stagger ────────────────────────────────────
export function FadeUp({ children, delay = 0, y = 8, className, ...rest }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: ease.outCubic, delay: reduce ? 0 : delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

// ── ChartReveal ────────────────────────────────────────────────────────────
// Wrap any chart container. While `loading` is true (and on initial mount
// even after resolved) shows a shimmering skeleton; then crossfades into
// the chart with a soft scale.
export function ChartReveal({ loading, children, height = 192, className }) {
  const reduce = useReducedMotion()
  // Hold skeleton briefly even after data arrives so the transition reads.
  const [showSkeleton, setShowSkeleton] = useState(true)

  useEffect(() => {
    if (loading) { setShowSkeleton(true); return }
    if (reduce) { setShowSkeleton(false); return }
    const t = setTimeout(() => setShowSkeleton(false), 320)
    return () => clearTimeout(t)
  }, [loading, reduce])

  return (
    <div className={className} style={{ minHeight: height, position: 'relative' }}>
      <AnimatePresence>
        {showSkeleton && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: ease.outCubic }}
            className="absolute inset-0 rounded-2xl skeleton"
          />
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{
          opacity: showSkeleton ? 0 : 1,
          scale:   showSkeleton ? 0.985 : 1,
        }}
        transition={{ duration: 0.5, ease: ease.outCubic, delay: reduce ? 0 : 0.05 }}
        style={{ height }}
      >
        {children}
      </motion.div>
    </div>
  )
}

// ── CountUp — animated number ticker ───────────────────────────────────────
// Spec: easeOutQuart over 1s, tabular numerals. Used for hero stats on every
// page (latest glucose, current weight, etc.).
export function CountUp({ value, duration = 1.0, decimals = 0, className }) {
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(reduce ? value : 0)

  useEffect(() => {
    if (value == null || isNaN(value)) { setDisplay(value); return }
    if (reduce) { setDisplay(value); return }
    const start = performance.now()
    const from = 0
    const to = Number(value)
    let raf
    const step = (now) => {
      const t = Math.min(1, (now - start) / (duration * 1000))
      // easeOutQuart
      const eased = 1 - Math.pow(1 - t, 4)
      setDisplay(from + (to - from) * eased)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, reduce])

  if (value == null || isNaN(value)) return <span className={className}>—</span>
  const formatted = decimals > 0 ? Number(display).toFixed(decimals) : Math.round(display).toLocaleString()
  return <span className={`tabular ${className ?? ''}`}>{formatted}</span>
}
