// Per-page hero animations.
//
//   <PageHero variant="glucose">  → blue droplet falls, ripples, gauge grows
//   <PageHero variant="meds">     → coral capsule flies in, settles, splits
//   <PageHero variant="weight">   → walnut dial slides up, needle settles
//
// Plays on every mount (every navigation in). Tap-anywhere skips to the end.
// Respects prefers-reduced-motion → fades to a 250ms reveal.
//
// Layout: the hero overlay sits absolute-positioned over the page-content
// scroll area, with a wood-tinted scrim so the underlying content is
// dimmed during the cinematic. When the timer fires (or the user taps),
// the overlay fades out and the content is fully revealed.

import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef, useMemo } from 'react'
import { ease } from './primitives'
import { api } from '../../api/client'
import { useQuery } from '../../hooks/useQuery'

// ── Per-variant total runtime (ms) ─────────────────────────────────────────
// Tuned from design/README.md beats but tightened so daily users don't grind
// teeth on the 8th visit. Tap-anywhere skips early.
const DURATIONS = {
  glucose:  5200,
  meds:     3000,
  weight:   5200,
  insights: 4200,
  reports:  3800,
  learn:    4200,
  default:  700,
}

export default function PageHero({ variant = 'default', children }) {
  const reduce = useReducedMotion()
  const skipAnim = reduce

  const [done, setDone] = useState(skipAnim)
  const skippedRef = useRef(false)

  useEffect(() => {
    if (skipAnim) return
    const dur = DURATIONS[variant] ?? DURATIONS.default
    const t = setTimeout(() => setDone(true), dur)
    return () => clearTimeout(t)
  }, [variant, skipAnim])

  const skip = () => {
    if (skippedRef.current) return
    skippedRef.current = true
    setDone(true)
  }

  // Default variant → no overlay, just render children.
  if (variant === 'default') {
    return <>{children}</>
  }

  // Mobile / reduced-motion → soft fade-in, no cinematic overlay.
  if (skipAnim) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: ease.outCubic }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className="relative">
      {/* Page content fades in slightly behind the cinematic */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: done ? 1 : 0.15 }}
        transition={{ duration: 0.5, ease: ease.outCubic }}
      >
        {children}
      </motion.div>

      {/* Cinematic overlay */}
      <AnimatePresence>
        {!done && (
          <motion.div
            key="hero-overlay"
            onClick={skip}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: ease.outCubic }}
            className="absolute inset-x-0 top-0 z-10 cursor-pointer flex items-center justify-center rounded-3xl"
            style={{
              height: 'min(60vh, 520px)',
              background: 'radial-gradient(60% 50% at 50% 40%, rgba(254,243,199,0.95) 0%, rgba(251,246,236,0.98) 70%, rgba(251,246,236,1) 100%)',
            }}
          >
            <Variant variant={variant} />
            <SkipHint />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SkipHint() {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.45 }}
      transition={{ duration: 0.4, delay: 1.2 }}
      className="absolute bottom-6 text-[11px] uppercase tracking-[0.16em] text-wood-600"
    >
      tap to skip
    </motion.p>
  )
}

// ── Variant overlays ───────────────────────────────────────────────────────
function Variant({ variant }) {
  if (variant === 'glucose')  return <GlucoseScene />
  if (variant === 'meds')     return <MedsScene />
  if (variant === 'weight')   return <WeightScene />
  if (variant === 'insights') return <InsightsScene />
  if (variant === 'reports')  return <ReportsScene />
  if (variant === 'learn')    return <LearnScene />
  return null
}

// ── GLUCOSE: droplet falls, ripples, gauge ring grows, big number counts up ──
// Beats:
//   0 – 0.9s   : droplet falls from above with squash-stretch
//   0.9 – 1.4s : ripples on impact
//   1.0 – 2.0s : gauge ring scribes around impact point
//   1.5 – 2.6s : number rises fast (60 → 150, easeOutCubic)
//   2.6 – 4.5s : number slowly settles to actual reading (easeInOutCubic)
//   4.0 – 4.5s : caption fades in
function GlucoseScene() {
  return (
    <div className="relative w-[300px] h-[300px] flex items-center justify-center">

      {/* Eyebrow */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: ease.outCubic }}
        className="absolute top-0 text-[11px] font-bold uppercase tracking-[0.18em] text-glu-deep"
        style={{ color: '#0c4a6e' }}
      >
        Glucose · Today
      </motion.p>

      {/* Falling droplet */}
      <motion.svg
        width="44" height="60" viewBox="0 0 44 60"
        initial={{ y: -200, opacity: 0, scaleY: 1.4, scaleX: 0.7 }}
        animate={{
          y:        [-200, 50, 50],
          opacity:  [0,    1,  0],
          scaleY:   [1.4,  0.6, 1.0],
          scaleX:   [0.7,  1.5, 1.0],
        }}
        transition={{ duration: 1.1, times: [0, 0.85, 1], ease: ease.inQuad }}
        className="absolute"
        style={{ filter: 'drop-shadow(0 6px 8px rgba(95, 168, 211, 0.35))' }}
      >
        <defs>
          <linearGradient id="dropg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a4cae9" />
            <stop offset="100%" stopColor="#3884c4" />
          </linearGradient>
        </defs>
        <path d="M22 4 C 8 22, 4 38, 22 56 C 40 38, 36 22, 22 4 Z" fill="url(#dropg)" />
        <ellipse cx="16" cy="22" rx="5" ry="3" fill="rgba(255,255,255,0.55)" />
      </motion.svg>

      {/* Ripples on impact */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: 4 + i * 0.5, opacity: [0, 0.6, 0] }}
          transition={{ duration: 1.1, delay: 0.95 + i * 0.18, times: [0, 0.2, 1], ease: ease.outCubic }}
          className="absolute w-16 h-16 rounded-full border-2"
          style={{ borderColor: '#5fa8d3', top: '50%', left: '50%', marginTop: -32, marginLeft: -32 }}
        />
      ))}

      {/* Gauge ring growing out of impact */}
      <motion.svg
        width="220" height="220" viewBox="0 0 220 220"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 1.1, ease: ease.outBack }}
        className="absolute"
      >
        {/* Track */}
        <path
          d="M 35 145 A 80 80 0 1 1 185 145"
          fill="none" stroke="#e8d9b6" strokeWidth="6" strokeLinecap="round"
        />
        {/* Value arc */}
        <motion.path
          d="M 35 145 A 80 80 0 1 1 185 145"
          fill="none" stroke="#5fa8d3" strokeWidth="6" strokeLinecap="round"
          strokeDasharray="377"
          initial={{ strokeDashoffset: 377 }}
          animate={{ strokeDashoffset: 100 }}
          transition={{ duration: 1.0, delay: 1.4, ease: ease.outCubic }}
        />
      </motion.svg>

      {/* Hero number — rises to 150 then settles to actual */}
      <CinematicNumber from={60} to={108} peak={150} unit="mg/dL" delayMs={1500} color="#0c4a6e" />

      {/* Caption */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 0.9, y: 0 }}
        transition={{ duration: 0.5, delay: 4.0, ease: ease.outCubic }}
        className="absolute bottom-10 text-sm text-wood-700"
      >
        Latest reading
      </motion.p>
    </div>
  )
}

// ── MEDS: capsule flies in, settles, splits ────────────────────────────────
// Beats:
//   0 – 1.2s : capsule rotates in from off-screen top-right
//   1.2 – 1.8s : capsule settles (slight wobble)
//   1.8 – 2.4s : splits — top up, bottom down
//   2.0 – 2.8s : "Next dose" caption fades in below
function MedsScene() {
  return (
    <div className="relative w-[320px] h-[280px] flex items-center justify-center">

      {/* Eyebrow */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: ease.outCubic }}
        className="absolute top-0 text-[11px] font-bold uppercase tracking-[0.18em]"
        style={{ color: '#9a3412' }}
      >
        Meds · This week
      </motion.p>

      {/* Capsule top half */}
      <motion.div
        className="absolute"
        initial={{ x: 280, y: -180, rotate: -45, opacity: 0 }}
        animate={{
          x:       [280, 0,    0,    0,    0],
          y:       [-180, 0,   2,    -10,  -10],
          rotate:  [-45,  -3,  0,    0,    0],
          opacity: [0,    1,   1,    1,    1],
        }}
        transition={{
          duration: 2.0,
          times: [0, 0.6, 0.7, 0.85, 1],
          ease: ease.outCubic,
        }}
        style={{ width: 200, height: 80 }}
      >
        <CapsuleHalf side="top" />
      </motion.div>

      {/* Capsule bottom half (mirrored) */}
      <motion.div
        className="absolute"
        initial={{ x: 280, y: -180, rotate: -45, opacity: 0 }}
        animate={{
          x:       [280, 0,    0,    0,    0],
          y:       [-180, 0,   2,    10,   10],
          rotate:  [-45,  -3,  0,    0,    0],
          opacity: [0,    1,   1,    1,    1],
        }}
        transition={{
          duration: 2.0,
          times: [0, 0.6, 0.7, 0.85, 1],
          ease: ease.outCubic,
        }}
        style={{ width: 200, height: 80 }}
      >
        <CapsuleHalf side="bottom" />
      </motion.div>

      {/* Caption "Next dose" — appears as the capsule splits */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 2.0, ease: ease.outCubic }}
        className="absolute bottom-10 text-center"
      >
        <p className="display text-2xl font-bold text-wood-900">Next dose</p>
        <p className="text-sm text-wood-700 mt-1">Sunday · 8:30 AM</p>
      </motion.div>
    </div>
  )
}

function CapsuleHalf({ side }) {
  // The capsule is 200x80, rounded ends.
  // Top half = top 40px (clipped). Bottom half = bottom 40px (clipped).
  return (
    <svg viewBox="0 0 200 80" className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="capLeft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff7ee" />
          <stop offset="100%" stopColor="#fce4d8" />
        </linearGradient>
        <linearGradient id="capRight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f59669" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <clipPath id="capTop">    <rect x="-10" y="-10" width="220" height="50" /></clipPath>
        <clipPath id="capBottom"> <rect x="-10" y="40"  width="220" height="50" /></clipPath>
      </defs>
      <g clipPath={side === 'top' ? 'url(#capTop)' : 'url(#capBottom)'}>
        <rect x="0"   y="0" width="100" height="80" rx="40" fill="url(#capLeft)" />
        <rect x="100" y="0" width="100" height="80" rx="40" fill="url(#capRight)" />
        {/* Sheen */}
        <ellipse cx="40" cy="20" rx="22" ry="6" fill="rgba(255,255,255,0.5)" />
        <ellipse cx="140" cy="20" rx="22" ry="6" fill="rgba(255,255,255,0.18)" />
      </g>
    </svg>
  )
}

// ── WEIGHT: dial slides up, needle settles with damped oscillation ─────────
// Beats:
//   0 – 0.9s   : dial slides up
//   0.6 – 2.0s : needle swings + damps to target
//   1.6 – 2.7s : number rises fast (200 → firstWeight, easeOutCubic)
//   2.7 – 4.6s : number slowly settles to lastWeight (easeInOutCubic)
//   4.0 – 4.5s : caption fades in
function WeightScene() {
  const { data: weights } = useQuery(api.getWeightLog)

  const { firstWeight, lastWeight } = useMemo(() => {
    if (!weights?.length) return { firstWeight: 280.5, lastWeight: 260.0 }
    const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date))
    return {
      firstWeight: sorted[0].weightLbs,
      lastWeight:  sorted[sorted.length - 1].weightLbs,
    }
  }, [weights])

  return (
    <div className="relative w-[320px] h-[300px] flex items-center justify-center">

      {/* Eyebrow */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: ease.outCubic }}
        className="absolute top-0 text-[11px] font-bold uppercase tracking-[0.18em]"
        style={{ color: '#4c1d95' }}
      >
        Weight · Today
      </motion.p>

      {/* Dial */}
      <motion.svg
        width="280" height="200" viewBox="0 0 280 200"
        initial={{ y: 240, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.2, ease: ease.outCubic }}
        className="absolute"
        style={{ filter: 'drop-shadow(0 8px 20px rgba(82,58,37,0.10))' }}
      >
        {/* Face */}
        <circle cx="140" cy="140" r="120" fill="#fff7ee" stroke="#e8d9b6" strokeWidth="1.5" />
        {/* Tick marks across a 240° arc (from -210° to +30°) */}
        {Array.from({ length: 21 }, (_, i) => {
          const aDeg = -210 + (i / 20) * 240
          const a = (aDeg * Math.PI) / 180
          const isMajor = i % 5 === 0
          const r1 = 105
          const r2 = isMajor ? 88 : 96
          const x1 = 140 + Math.cos(a) * r1
          const y1 = 140 + Math.sin(a) * r1
          const x2 = 140 + Math.cos(a) * r2
          const y2 = 140 + Math.sin(a) * r2
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isMajor ? '#9b7cc7' : '#cbb8e2'}
              strokeWidth={isMajor ? 2.5 : 1.5}
              strokeLinecap="round" />
          )
        })}
        {/* Needle: pivots at center, animates with damped oscillation */}
        <motion.line
          x1="140" y1="140" x2="140" y2="55"
          stroke="#523a25" strokeWidth="3.5" strokeLinecap="round"
          style={{ originX: '140px', originY: '140px' }}
          initial={{ rotate: -130 }}
          animate={{ rotate: [-130, 60, -10, 35, 22, 28, 25, 26] }}
          transition={{ duration: 1.6, delay: 0.5, ease: ease.outCubic }}
        />
        <circle cx="140" cy="140" r="9" fill="#523a25" />
        <circle cx="140" cy="140" r="4" fill="#9b7cc7" />
      </motion.svg>

      {/* Hero number — rises to first (heaviest) weight then settles to current */}
      <div className="absolute bottom-12 flex flex-col items-center">
        <CinematicNumber
          from={200} to={lastWeight} peak={firstWeight}
          unit="lb" decimals={1} delayMs={1600} color="#4c1d95"
        />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 0.9, y: 0 }}
          transition={{ duration: 0.5, delay: 4.0, ease: ease.outCubic }}
          className="text-sm text-wood-700 mt-1"
        >
          Today's weigh-in
        </motion.p>
      </div>
    </div>
  )
}

// ── INSIGHTS: sparkline draws, real journey stats appear ──────────────────
// Beats:
//   0 – 0.4s   : grid lines fade in
//   0.3 – 1.7s : sparkline draws left to right with area fill
//   1.4 – 2.0s : data points pop in
//   1.8 – 3.0s : two stat pills (days on GLP-1, lbs lost) stagger in
//   3.2 – 3.8s : caption fades in
function InsightsScene() {
  const { data: profile } = useQuery(api.getProfile)
  const { data: weights } = useQuery(api.getWeightLog)

  const { daysOnGlp1, lostLbs } = useMemo(() => {
    const start = profile?.startDate
    const days  = start
      ? Math.floor((Date.now() - new Date(start).getTime()) / 86400000)
      : null
    if (!weights?.length) return { daysOnGlp1: days, lostLbs: null }
    const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date))
    const lost = sorted.length >= 2
      ? +(sorted[0].weightLbs - sorted[sorted.length - 1].weightLbs).toFixed(1)
      : null
    return { daysOnGlp1: days, lostLbs: lost }
  }, [profile, weights])

  return (
    <div className="relative w-[300px] h-[300px] flex items-center justify-center">

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: ease.outCubic }}
        className="absolute top-0 text-[11px] font-bold uppercase tracking-[0.18em]"
        style={{ color: '#78350f' }}
      >
        Insights · Your journey
      </motion.p>

      {/* Sparkline: high-left → low-right = improving trend */}
      <svg width="260" height="130" viewBox="0 0 260 130"
        className="absolute" style={{ top: 38 }}>
        <defs>
          <linearGradient id="insg-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[32, 66, 100].map(y => (
          <line key={y} x1="0" y1={y} x2="260" y2={y} stroke="#e8d9b6" strokeWidth="1" />
        ))}
        <motion.path
          d="M 0,106 C 50,100 90,84 130,68 C 170,52 210,38 260,26"
          fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay: 0.3, ease: ease.outCubic }}
        />
        <motion.path
          d="M 0,106 C 50,100 90,84 130,68 C 170,52 210,38 260,26 L 260,128 L 0,128 Z"
          fill="url(#insg-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        />
        {[[0,106],[65,92],[130,68],[195,46],[260,26]].map(([cx,cy], i) => (
          <motion.circle key={i} cx={cx} cy={cy}
            r={i === 4 ? 5.5 : 3.5}
            fill={i === 4 ? '#d97706' : '#fcd34d'}
            stroke="#fff7ee" strokeWidth="1.5"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 + i * 0.22, ease: ease.outBack }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}
      </svg>

      {/* Stat pills with real data */}
      <div className="absolute flex gap-3" style={{ bottom: 60 }}>
        {[
          { value: daysOnGlp1 != null ? `Day ${daysOnGlp1}` : 'Tracking', sub: 'on GLP-1',   color: '#d97706' },
          { value: lostLbs    != null ? `${lostLbs} lb`     : 'Progress', sub: 'total lost', color: '#059669' },
        ].map(({ value, sub, color }, i) => (
          <motion.div
            key={sub}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.9 + i * 0.25, ease: ease.outCubic }}
            className="flex flex-col items-center px-4 py-1.5 rounded-xl"
            style={{ background: `${color}18` }}
          >
            <span className="text-base font-bold" style={{ color }}>{value}</span>
            <span className="text-[10px] font-medium" style={{ color: `${color}bb` }}>{sub}</span>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 0.9, y: 0 }}
        transition={{ duration: 0.5, delay: 3.2, ease: ease.outCubic }}
        className="absolute bottom-8 text-sm text-wood-700"
      >
        Progress at a glance
      </motion.p>
    </div>
  )
}

// ── REPORTS: document slides in, three data bars grow up ──────────────────
// Beats:
//   0 – 0.7s   : document icon slides in from top
//   0.5 – 1.6s : three bars grow staggered (glucose, injections, weight)
//   1.4 – 2.0s : bar labels fade in
//   2.0 – 2.6s : download arrow animates
//   2.4 – 3.0s : caption fades in
function ReportsScene() {
  const bars = [
    { label: 'Glucose',    h: 88,  color: '#5fa8d3', delay: 0.5 },
    { label: 'Injections', h: 62,  color: '#e07a5f', delay: 0.72 },
    { label: 'Weight',     h: 108, color: '#9b7cc7', delay: 0.94 },
  ]

  return (
    <div className="relative w-[300px] h-[300px] flex items-center justify-center">

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: ease.outCubic }}
        className="absolute top-0 text-[11px] font-bold uppercase tracking-[0.18em]"
        style={{ color: '#065f46' }}
      >
        Reports · Export & analyze
      </motion.p>

      {/* Document icon */}
      <motion.svg
        width="54" height="64" viewBox="0 0 54 64"
        className="absolute" style={{ top: 28 }}
        initial={{ y: -55, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: ease.outBack }}
      >
        <rect x="3" y="3" width="48" height="58" rx="5" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
        <path d="M 38 3 L 51 16 L 38 16 Z" fill="#d1fae5" />
        <line x1="38" y1="3" x2="38" y2="16" stroke="#10b981" strokeWidth="1.5" />
        <line x1="38" y1="16" x2="51" y2="16" stroke="#10b981" strokeWidth="1.5" />
        <rect x="12" y="26" width="18" height="3" rx="1.5" fill="#6ee7b7" />
        <rect x="12" y="34" width="14" height="3" rx="1.5" fill="#6ee7b7" />
        <rect x="12" y="42" width="16" height="3" rx="1.5" fill="#6ee7b7" />
        {/* Download arrow */}
        <motion.g
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 2.0 }}
        >
          <line x1="37" y1="32" x2="37" y2="46" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
          <polyline points="32,42 37,48 42,42" fill="none" stroke="#10b981" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
      </motion.svg>

      {/* Bar chart */}
      <svg width="220" height="148" viewBox="0 0 220 148" className="absolute" style={{ top: 106 }}>
        <line x1="8" y1="128" x2="212" y2="128" stroke="#e8d9b6" strokeWidth="1.5" />
        {bars.map(({ label, h, color, delay }, i) => {
          const x = 22 + i * 66
          return (
            <g key={label}>
              <motion.rect
                x={x} y={128 - h} width="52" height={h} rx="4"
                fill={color} opacity="0.85"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                style={{ originY: 1 }}
                transition={{ duration: 0.7, delay, ease: ease.outCubic }}
              />
              <motion.text
                x={x + 26} y={144} textAnchor="middle" fontSize="10" fill="#6b7280"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: delay + 0.55 }}
              >
                {label}
              </motion.text>
            </g>
          )
        })}
      </svg>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 0.9, y: 0 }}
        transition={{ duration: 0.5, delay: 2.6, ease: ease.outCubic }}
        className="absolute bottom-8 text-sm text-wood-700"
      >
        Your health data
      </motion.p>
    </div>
  )
}

// ── LEARN: book opens from spine, pages fill with text, chips stagger in ──
// Beats:
//   0 – 0.4s   : sparkle appears above
//   0.2 – 0.9s : left page fans open
//   0.4 – 1.1s : right page fans open
//   0.9 – 1.8s : text lines stagger across both pages
//   1.6 – 2.8s : three category chips stagger in
//   2.8 – 3.4s : caption fades in
function LearnScene() {
  const chips = [
    { label: 'GLP-1 Basics', color: '#e07a5f' },
    { label: 'Blood Sugar',  color: '#5fa8d3' },
    { label: 'Nutrition',    color: '#16a34a' },
  ]

  return (
    <div className="relative w-[300px] h-[300px] flex items-center justify-center">

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: ease.outCubic }}
        className="absolute top-0 text-[11px] font-bold uppercase tracking-[0.18em]"
        style={{ color: '#312e81' }}
      >
        Learn · Knowledge base
      </motion.p>

      {/* Sparkle */}
      <motion.svg
        width="34" height="34" viewBox="0 0 34 34"
        className="absolute" style={{ top: 30 }}
        initial={{ scale: 0, rotate: -25, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: ease.outBack }}
      >
        <line x1="17" y1="2"  x2="17" y2="32" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="2"  y1="17" x2="32" y2="17" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="6"  y1="6"  x2="28" y2="28" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="28" y1="6"  x2="6"  y2="28" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="17" cy="17" r="4" fill="#6366f1" />
      </motion.svg>

      {/* Open book */}
      <svg width="234" height="150" viewBox="0 0 234 150" className="absolute" style={{ top: 70 }}>
        <defs>
          <linearGradient id="learn-spine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a5b4fc" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#a5b4fc" />
          </linearGradient>
        </defs>
        {/* Left page */}
        <motion.rect x="5" y="5" width="100" height="124" rx="5"
          fill="#fdf8f0" stroke="#c4b08a" strokeWidth="1.5"
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          style={{ originX: 1, originY: 0.5 }}
          transition={{ duration: 0.65, delay: 0.2, ease: ease.outCubic }}
        />
        {/* Spine */}
        <rect x="105" y="0" width="24" height="150" rx="3" fill="url(#learn-spine)" />
        {/* Right page */}
        <motion.rect x="129" y="5" width="100" height="124" rx="5"
          fill="#fdf8f0" stroke="#c4b08a" strokeWidth="1.5"
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          style={{ originX: 0, originY: 0.5 }}
          transition={{ duration: 0.65, delay: 0.38, ease: ease.outCubic }}
        />
        {/* Left page lines */}
        {[26,44,62,80,98,116].map((y, i) => (
          <motion.rect key={`l${y}`}
            x="18" y={y} width={i % 2 === 0 ? 74 : 58} height="3.5" rx="1.75"
            fill="#d4c5a9"
            initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
            style={{ originX: 0, originY: 0.5 }}
            transition={{ duration: 0.3, delay: 0.88 + i * 0.09 }}
          />
        ))}
        {/* Right page lines */}
        {[26,44,62,80,98,116].map((y, i) => (
          <motion.rect key={`r${y}`}
            x="142" y={y} width={i % 2 === 0 ? 68 : 76} height="3.5" rx="1.75"
            fill="#d4c5a9"
            initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
            style={{ originX: 0, originY: 0.5 }}
            transition={{ duration: 0.3, delay: 1.06 + i * 0.09 }}
          />
        ))}
      </svg>

      {/* Category chips */}
      <div className="absolute flex gap-2" style={{ bottom: 60 }}>
        {chips.map(({ label, color }, i) => (
          <motion.span
            key={label}
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 1.7 + i * 0.22, ease: ease.outBack }}
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: `${color}1a`, color }}
          >
            {label}
          </motion.span>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 0.9, y: 0 }}
        transition={{ duration: 0.5, delay: 2.8, ease: ease.outCubic }}
        className="absolute bottom-8 text-sm text-wood-700"
      >
        Explore the science
      </motion.p>
    </div>
  )
}

// Hero counter — scales in then ticks up over ~1s.
// When `peak` is provided the animation runs in two phases:
//   phase 1 (1100ms): from → peak  using easeOutCubic  (fast rise)
//   phase 2 (1900ms): peak → to    using easeInOutCubic (slow, settling descent)
function CinematicNumber({ from, to, peak, unit, decimals = 0, delayMs = 0, color = '#352719' }) {
  const [val, setVal] = useState(from)

  useEffect(() => {
    let raf
    const startTimer = setTimeout(() => {
      const start      = performance.now()
      const phase1Dur  = 1100
      const phase2Dur  = 1900

      const step = (now) => {
        const elapsed = now - start

        if (peak != null) {
          if (elapsed < phase1Dur) {
            const t      = Math.min(1, elapsed / phase1Dur)
            const eased  = 1 - Math.pow(1 - t, 3)           // easeOutCubic
            setVal(from + (peak - from) * eased)
            raf = requestAnimationFrame(step)
          } else {
            const t      = Math.min(1, (elapsed - phase1Dur) / phase2Dur)
            const eased  = t < 0.5                            // easeInOutCubic
              ? 4 * t * t * t
              : 1 - Math.pow(-2 * t + 2, 3) / 2
            setVal(peak + (to - peak) * eased)
            if (t < 1) raf = requestAnimationFrame(step)
          }
        } else {
          const t     = Math.min(1, elapsed / 1000)
          const eased = 1 - Math.pow(1 - t, 4)               // easeOutQuart
          setVal(from + (to - from) * eased)
          if (t < 1) raf = requestAnimationFrame(step)
        }
      }
      raf = requestAnimationFrame(step)
    }, delayMs)
    return () => { clearTimeout(startTimer); if (raf) cancelAnimationFrame(raf) }
  }, [from, to, peak, delayMs])

  const formatted = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: delayMs / 1000, ease: ease.outBack }}
      className="flex items-baseline gap-1.5"
    >
      <span
        className="display text-6xl font-bold tabular tracking-tight"
        style={{ color }}
      >
        {formatted}
      </span>
      <span className="text-base font-medium" style={{ color }}>
        {unit}
      </span>
    </motion.div>
  )
}
