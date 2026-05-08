# Handoff: GLP1 App Animations (Tare Motion Library)

## Overview
A motion library for a GLP1 wellness app. Six animations covering: app intro/launch, dashboard, graph data-load, and per-page transitions for Meds, Glucose, and Weight. The goal is to add personality, hierarchy, and feedback to data loads and page transitions without slowing the user down.

## About the Design Files
The HTML/JSX files in this bundle are **design references** — interactive prototypes showing intended look, timing, and behavior. They are **not production code to copy directly**. Your task is to **recreate these animations in your existing GLP1 app codebase** using its established framework, animation library, and design tokens. If you don't yet have an animation library in place, pick what fits the platform (React Native: Reanimated 3 or Moti; Web/React: Framer Motion; SwiftUI: native `withAnimation` + matched geometry; Flutter: `AnimationController` + `Hero`).

The reference uses a hand-rolled timeline engine (`Stage` + `Sprite` + `useTime` hook) — your implementation should use idiomatic primitives for your platform.

App brand: **Tare** — "Reset to baseline. Every week."

## Fidelity
**High-fidelity.** Final colors, typography, easing curves, and timings are intentional. Match them where possible. The brand identity ("Lumen") is a placeholder name — substitute your actual app brand.

## Animations

### 1. App Intro (7s, plays once on first launch)
**Purpose:** Set tone, brand recognition, give time for app to warm up.

**Beats:**
- 0–1s: Background radial gradient drifts in (sage-soft → bg).
- 0.4–4.2s: 12 dots fade in around a center point in two passes (every 3rd is coral, others are sage). They orbit slowly, then collapse inward to a single point at ~3s.
- 2.6–7s: Capsule logo mark scales in with `easeOutBack`, idle pulse at 3.5Hz / ±4% scale. A horizontal split-line draws across the capsule.
- 3.8–7s: Wordmark types in left-to-right, one character every 80ms, each character fades + rises 14px with `easeOutCubic`.
- 4.6–7s: Tagline "Your week, your weight, your wins." fades + rises 8px.
- 5.5–7s: Phone outline (1.5px stroke, 44px radius, 320×580) fades and scales 0.94→1.0, framing the logo as if revealing the device.

**Skip:** Tap anywhere should skip to end.

### 2. Dashboard Reveal (4s, plays on first navigation to Today/Home each session)
**Purpose:** Make the home screen feel composed rather than dumped.

**Beats:**
- 0.2s: "WEDNESDAY · MAY 7" eyebrow + "Good morning, Sam" headline fade up 8–10px.
- 0.6s: Four tiles (Meds, Weight, Glucose, Activity) stagger in at 120ms intervals. Each: opacity 0→1, translateY +16→0, scale 0.94→1.0 with `easeOutBack`.
- Per-tile micro-icon (top-right corner, 36×36 white-pill) scales 0.7→1.0 with `easeOutCubic`, after the tile body lands.
- 1.2s: Bottom tab bar slides up 20px and fades in (`easeOutCubic`, 600ms).

### 3. Graph Data Load (5s, plays whenever a chart's data resolves)
**Purpose:** Replace boring spinners with confidence-building reveal.

**Beats:**
- 0–1.4s: Skeleton block (rounded 18px, 60% opacity, full-width inside chart bounds) with shimmer (white gradient sweeping left→right at 200px/s).
- 0.6–1.2s: Skeleton fades out as horizontal dashed gridlines draw in left-to-right (`easeOutCubic`).
- 0.4s onward: X-axis labels fade in.
- 1.2–2.0s: Each data point (5 points, weekly weight series) pops into place from 10px above its target, staggered 80ms, `easeOutBack`.
- 1.8–2.7s: Polyline traces between dots (`easeInOutCubic`); a faint area-fill gradient (sage 35% → 0%) fills below the line as it draws.
- 3.0–4.0s: Hero number ticks up with `easeOutQuart` (e.g., 192.4 → 188.2 lb) using tabular numerals so digits don't jitter.
- 3.6s: Caption pill (e.g., "Down 4.2 lb since this week last month") fades up 8px.

**Reuse:** Same primitive for any time-series chart (glucose, weight, steps, dose history). Customize point count, y-domain, accent color.

### 4. Meds Page Transition (5s, plays on navigate-to-Meds)
**Purpose:** Reinforce that this page is about medication; give the next-dose CTA dramatic weight.

**Beats:**
- 0.2s: "MEDS" eyebrow + "This week" title fade up.
- 0.4–1.2s: A single capsule pill (180×80, half coral, half cream) flies in from off-screen top-right (start at x:320, y:-120 → end at x:195, y:240) rotating from -45° to 0°, with `easeOutCubic`.
- 1.2–2.0s: Capsule settles (slight wobble damped out).
- 2.0–2.6s: Capsule splits — top half slides up 14px, bottom half slides down 14px (`easeInOutCubic`). A horizontal line is revealed between them.
- 2.4s: Dose card content reveals beneath (coral-soft background, 24px radius, "Next dose · Semaglutide · 1.0 mg · Sunday 8:30 AM · Left thigh", with "Log dose" / "Snooze" pill buttons).
- 3.0s: "RECENT" header + 4 historical dose rows stagger in from left (translateX +16→0), 100ms apart. Each row has a sage-soft 32px circle with a checkmark.

### 5. Glucose Page Transition (5s, plays on navigate-to-Glucose)
**Purpose:** Liquid metaphor sells the "reading" idea.

**Beats:**
- 0.2s: "GLUCOSE" / "Today" header fades up.
- 0.5–1.7s: A blue droplet (28×36, glucose-blue) falls from y:-40 to y:300 with `easeInQuad`. Vertical squash-stretch oscillates with `sin(t·π)`: tall on entry, fat on impact, tall on bounce.
- 1.5–2.5s: On impact, two concentric ripples expand from impact point (radius 20→100 then 20→140, fade out). Strokes 2px and 1.5px, glucose color.
- 1.9–2.9s: Gauge ring grows out of impact point (`easeOutBack`). It's a circular arc from -120° to +120° (track in `--line`, value arc in glucose blue).
- 2.4–3.4s: Big number "108 mg/dL" ticks up from 60 with `easeOutQuart`. Tabular nums.
- 3.4–4.8s: Day's glucose curve (12 points across the day) traces below with smooth Bezier (`easeInOutCubic`). 70/180 mg/dL threshold lines (dashed) and tinted "in-range" band appear with the curve.

### 6. Weight Page Transition (5s, plays on navigate-to-Weight)
**Purpose:** Tactile metaphor; communicates measurement before number.

**Beats:**
- 0.2s: "WEIGHT" / "Today" header fades up.
- 0.5–1.3s: A circular dial scale (280×200, white face, 21 tick marks across a 240° arc) slides up from bottom (`easeOutCubic`, y: 540 → 180).
- 0.7–2.3s: Needle swings into place — damped oscillation. Target angle 30°, with `sin(t·8) · 60° · exp(-3t)` overlay so it overshoots, oscillates, and settles.
- 2.4–3.3s: Big number "188.2" scales 0.92→1.0 and fades in below the dial. Numerical tween from 192.0 with `easeOutQuart`. Tabular nums, 72px display weight.
- 3.2–4.2s: 30-day trend card (white, 1px line border, 20px radius) slides up 14px. Inside: "30-DAY TREND" label, "−4.2 lb" in weight-purple, sparkline (8 points, weekly weights) traces in over 1s. Endpoint dot lights up after trace finishes.

## Design Tokens

### Colors (use OKLCH where shown — falls back gracefully via CSS color-mix in older browsers; or compute hex equivalents)
| Token | Value | Usage |
|---|---|---|
| `--bg` | `#f5f3ee` | Light page background |
| `--bg-dark` | `#0f1419` | Dark/inverted background |
| `--ink` | `#0f1419` | Primary text |
| `--paper` | `#ffffff` | Card surface |
| `--line` | `#e3dfd6` | Hairline borders, gridlines |
| `--muted` | `#8a8578` | Secondary text |
| `--sage` | `oklch(0.72 0.08 155)` | Accent — generic sage |
| `--sage-deep` | `oklch(0.52 0.09 155)` | Sage on light bg |
| `--sage-soft` | `oklch(0.93 0.04 155)` | Sage tinted background |
| `--coral` | `oklch(0.68 0.14 35)` | Meds accent / primary CTA |
| `--coral-soft` | `oklch(0.94 0.04 35)` | Meds tinted background |
| `--glucose` | `oklch(0.65 0.13 250)` | Glucose accent (blue) |
| `--weight` | `oklch(0.62 0.12 305)` | Weight accent (purple) |

### Typography
- **Display:** "Inter Tight" 600, letter-spacing -0.02em to -0.04em (used on titles, hero numbers).
- **UI:** "Inter" 400/500/600 (everything else).
- **Mono:** "JetBrains Mono" (timestamps in dev tools; not used in shipped UI here, but available).
- **Tabular numerals** wherever a number animates (`font-variant-numeric: tabular-nums`).

### Spacing
- Phone canvas: 390×780 (logical). Page horizontal padding: 24–28.
- Tile radius: 22. Card radius: 24. Pill button radius: 999. Phone-outline radius: 44–54.

### Easing
- Standard reveal: `easeOutCubic`.
- Pop / overshoot: `easeOutBack`.
- Travel/settle: `easeInOutCubic`.
- Falling object: `easeInQuad`.
- Number ticker: `easeOutQuart` (fast start, slow end so the final digits read).
- Dial settle: `target + sin(t·8)·60°·exp(-3·t)` (damped oscillation, NOT a stock easing).

### Durations (rough)
- Micro reveals: 400–600ms
- Page transitions: 4–5s end-to-end
- Intro: 7s
- Per-element entry stagger: 80–120ms

## Implementation Notes

- **Skip-to-end is mandatory.** A user who has seen the intro 50 times shouldn't sit through it. Tap-anywhere or first-pointer-event should jump to the final state.
- **Respect `prefers-reduced-motion`.** Replace each animation with a fade-only, ≤200ms version. Disable orbital dots, droplet fall, dial swing, capsule fly-in. Keep number tickers but instant.
- **Animations must not block interaction.** Tile content and CTAs should be tappable as soon as their `opacity > 0`. Don't gate touch handlers on the timeline.
- **Reuse the graph load primitive** for all charts. The timing/stagger should be identical across glucose, weight, steps, dose adherence, etc., so the app feels consistent.
- **Page-transition animations only on first navigation per session.** On subsequent visits, fade the page in over 200ms with no theatrics — otherwise it becomes annoying.
- **Tile micro-icons are decorative.** Real iconography should come from your existing icon set; the SVGs in the prototype are placeholders.
- **Brand:** "Lumen" is a placeholder. Replace logo, wordmark, and tagline with your real brand. Capsule shape works for any GLP1 app but you may want a different mark.

## Files in this Bundle
- `Lumen Animations.html` — main entry point (sidebar + Stage host).
- `scenes.jsx` — all six scene components (`IntroScene`, `DashboardScene`, `GraphLoadScene`, `MedsScene`, `GlucoseScene`, `WeightScene`).
- `animations.jsx` — timeline engine: `Stage`, `Sprite`, `useTime`, `useSprite`, `Easing`, `interpolate`, `animate`, `clamp`.
- `ios-frame.jsx` — iOS device chrome (not used in final but available for context).

To run the reference locally: open `Lumen Animations.html` in a browser. Use the sidebar to switch scenes, Space to play/pause, ←/→ to scrub.

## Suggested Implementation Order
1. **Design tokens** first — get colors, type, easing curves into your theme.
2. **Graph load** — highest reuse value; ship it once, every chart benefits.
3. **Dashboard reveal** — sets the tone of the app on each open.
4. **Per-page transitions** (Meds → Glucose → Weight) — these can ship independently.
5. **App intro** last — most polish, only seen on first launch.
