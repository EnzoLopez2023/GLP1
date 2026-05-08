// First-launch intro for Tare. Plays once per browser session.
//
// Visual structure (tuned to a ~3.5s total runtime — roughly half what the
// design references suggest, because real apps need to get out of the way):
//
//   - Background warm radial drifts in
//   - 12 dots orbit around center, then collapse inward
//   - Capsule logomark scales in with overshoot
//   - Tare wordmark types in
//   - Tagline fades up
//   - Tap anywhere to skip
//
// Respects prefers-reduced-motion: replaces with a 200ms fade.

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ease } from './primitives'

const TAGLINE = 'Reset to baseline. Every week.'

export default function IntroAnimation({ onDone }) {
  const reduce = useReducedMotion()
  const [skipped, setSkipped] = useState(false)
  const total = reduce ? 0.25 : 3.6

  useEffect(() => {
    const t = setTimeout(() => onDone?.(), total * 1000)
    return () => clearTimeout(t)
  }, [onDone, total])

  const handleSkip = () => {
    if (skipped) return
    setSkipped(true)
    onDone?.()
  }

  if (reduce) {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.25, delay: 0.25 }}
        onClick={handleSkip}
        className="fixed inset-0 z-50 bg-wood-50 flex items-center justify-center"
      >
        <Wordmark instant />
      </motion.div>
    )
  }

  return (
    <motion.div
      onClick={handleSkip}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 overflow-hidden bg-wood-50 flex flex-col items-center justify-center cursor-pointer select-none"
    >
      {/* Background radial gradient drift */}
      <motion.div
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: ease.outCubic }}
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 45%, #fef3c7 0%, #fbf6ec 65%, #fbf6ec 100%)',
        }}
      />

      <OrbitalDots />

      {/* Logomark (capsule) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 1.1, ease: ease.outBack }}
        className="relative z-10"
      >
        <Capsule />
      </motion.div>

      <Wordmark />

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 0.75, y: 0 }}
        transition={{ duration: 0.5, delay: 2.3, ease: ease.outCubic }}
        className="relative z-10 mt-2 text-sm text-wood-700"
      >
        {TAGLINE}
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 0.4, delay: 2.8 }}
        className="absolute bottom-10 text-xs text-wood-500"
      >
        tap to skip
      </motion.p>
    </motion.div>
  )
}

// Wordmark: types in left-to-right, each char fades + rises.
function Wordmark({ instant = false }) {
  const chars = 'Tare'.split('')
  return (
    <div className="relative z-10 mt-7 flex items-end overflow-hidden h-[64px]">
      {chars.map((c, i) => (
        <motion.span
          key={i}
          initial={instant ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            delay: instant ? 0 : 1.6 + i * 0.08,
            ease: ease.outCubic,
          }}
          className="display text-5xl font-bold text-wood-900 tracking-tight"
        >
          {c}
        </motion.span>
      ))}
    </div>
  )
}

// Capsule pill — half amber, half cream. The brand mark.
function Capsule() {
  return (
    <motion.svg
      width="180"
      height="80"
      viewBox="0 0 180 80"
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ duration: 1.6, ease: ease.inOutCubic, repeat: Infinity, repeatType: 'mirror' }}
    >
      <defs>
        <linearGradient id="introCapsule" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#e6a44d" />
          <stop offset="100%" stopColor="#b86c1e" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="176" height="76" rx="38" fill="url(#introCapsule)" />
      <rect x="2" y="2" width="88" height="76" rx="38" fill="#fdf8f1" />
      <motion.line
        x1="90" y1="6" x2="90" y2="74"
        stroke="#75421d" strokeWidth="0.8" opacity="0.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, delay: 1.0, ease: ease.outCubic }}
      />
    </motion.svg>
  )
}

// Twelve dots that fade in around a center point, orbit slowly, then collapse.
function OrbitalDots() {
  const dots = Array.from({ length: 12 }, (_, i) => i)
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-[260px] h-[260px]">
        {dots.map(i => {
          const angle = (i / 12) * Math.PI * 2
          const isAccent = i % 3 === 0
          const radius = 110
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          return (
            <motion.div
              key={i}
              initial={{ x, y, opacity: 0, scale: 0.5 }}
              animate={{
                x: [x, x, 0],
                y: [y, y, 0],
                opacity: [0, 0.9, 0],
                scale:   [0.5, 1, 0.4],
              }}
              transition={{
                duration: 2.2,
                delay: 0.2 + i * 0.04,
                ease: ease.inOutCubic,
                times: [0, 0.55, 1],
              }}
              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
              style={{
                marginLeft: -4, marginTop: -4,
                background: isAccent ? '#d68a2c' : '#a98049',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
