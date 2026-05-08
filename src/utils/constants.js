// ── Medication definitions ────────────────────────────────────────────────────
export const MEDICATIONS = {
  Ozempic: {
    activeIngredient: 'Semaglutide',
    halfLifeDays: 7,
    doses: [0.25, 0.5, 1.0, 2.0],
    escalation: [
      { week: 1,  dose: 0.25 },
      { week: 5,  dose: 0.5 },
      { week: 9,  dose: 1.0 },
      { week: 13, dose: 2.0 },
    ],
  },
  Wegovy: {
    activeIngredient: 'Semaglutide',
    halfLifeDays: 7,
    doses: [0.25, 0.5, 1.0, 1.7, 2.4],
    escalation: [
      { week: 1,  dose: 0.25 },
      { week: 5,  dose: 0.5 },
      { week: 9,  dose: 1.0 },
      { week: 13, dose: 1.7 },
      { week: 17, dose: 2.4 },
    ],
  },
  Mounjaro: {
    activeIngredient: 'Tirzepatide',
    halfLifeDays: 5,
    doses: [2.5, 5, 7.5, 10, 12.5, 15],
    escalation: [
      { week: 1,  dose: 2.5 },
      { week: 5,  dose: 5 },
      { week: 9,  dose: 7.5 },
      { week: 13, dose: 10 },
      { week: 17, dose: 12.5 },
      { week: 21, dose: 15 },
    ],
  },
  Zepbound: {
    activeIngredient: 'Tirzepatide',
    halfLifeDays: 5,
    doses: [2.5, 5, 7.5, 10, 12.5, 15],
    escalation: [
      { week: 1,  dose: 2.5 },
      { week: 5,  dose: 5 },
      { week: 9,  dose: 7.5 },
      { week: 13, dose: 10 },
      { week: 17, dose: 12.5 },
      { week: 21, dose: 15 },
    ],
  },
  Custom: {
    activeIngredient: 'Custom',
    halfLifeDays: 7,
    doses: [],
    escalation: [],
  },
}

// ── Injection sites ───────────────────────────────────────────────────────────
export const INJECTION_SITES = [
  { id: 'abdomen-left',   label: 'Abdomen Left',   x: 40, y: 48 },
  { id: 'abdomen-right',  label: 'Abdomen Right',  x: 60, y: 48 },
  { id: 'thigh-left',     label: 'Thigh Left',     x: 35, y: 68 },
  { id: 'thigh-right',    label: 'Thigh Right',    x: 65, y: 68 },
  { id: 'upperarm-left',  label: 'Upper Arm Left', x: 18, y: 38 },
  { id: 'upperarm-right', label: 'Upper Arm Right',x: 82, y: 38 },
]

// ── Side-effect types ─────────────────────────────────────────────────────────
export const SIDE_EFFECT_TYPES = [
  'Nausea', 'Vomiting', 'Diarrhea', 'Constipation',
  'Stomach Pain', 'Bloating', 'Heartburn / Reflux',
  'Fatigue', 'Headache', 'Dizziness',
  'Injection Site Reaction', 'Decreased Appetite',
  'Hair Loss', 'Other',
]

// ── Glucose reading types ─────────────────────────────────────────────────────
export const GLUCOSE_TYPES = [
  { id: 'fasting',   label: 'Fasting',    description: 'Before eating, 8+ hrs fast' },
  { id: 'pre-meal',  label: 'Pre-Meal',   description: 'Just before eating' },
  { id: 'post-meal', label: 'Post-Meal',  description: '1-2 hrs after eating' },
  { id: 'bedtime',   label: 'Bedtime',    description: 'Before sleep' },
  { id: 'random',    label: 'Random',     description: 'Any other time' },
]

// ── Glucose reference ranges (mg/dL) ─────────────────────────────────────────
export const GLUCOSE_RANGES = {
  fasting: { low: 70, normal: [70, 99], prediabetes: [100, 125], high: 126 },
  postMeal: { low: 70, normal: [70, 139], prediabetes: [140, 199], high: 200 },
}

export function glucoseStatus(value, type = 'fasting') {
  if (value < 70) return { label: 'Low', color: 'glucose-low', bg: 'bg-red-100 text-red-700' }
  const range = type === 'post-meal' ? GLUCOSE_RANGES.postMeal : GLUCOSE_RANGES.fasting
  if (value <= range.normal[1]) return { label: 'Normal', color: 'glucose-normal', bg: 'bg-green-100 text-green-700' }
  if (value <= range.prediabetes[1]) return { label: 'Elevated', color: 'glucose-high', bg: 'bg-orange-100 text-orange-700' }
  return { label: 'High', color: 'glucose-vhigh', bg: 'bg-red-100 text-red-800' }
}

// ── Measurement types ─────────────────────────────────────────────────────────
export const MEASUREMENT_TYPES = [
  'Waist', 'Hips', 'Chest', 'Neck',
  'Left Arm', 'Right Arm', 'Left Thigh', 'Right Thigh',
]

// ── Meal types ────────────────────────────────────────────────────────────────
export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

// ── Days of week ──────────────────────────────────────────────────────────────
export const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
]

// ── Medication level decay calculator ─────────────────────────────────────────
/**
 * Returns % of drug remaining at `hoursAfterDose` hours post-injection,
 * given the drug's half-life in days.
 */
export function medicationLevel(hoursAfterDose, halfLifeDays) {
  const halfLifeHours = halfLifeDays * 24
  return 100 * Math.pow(0.5, hoursAfterDose / halfLifeHours)
}

/** Build a 14-day decay curve starting from injectionDate */
export function buildDecayCurve(injectionDateISO, halfLifeDays, doseMg) {
  const start = new Date(injectionDateISO)
  const points = []
  for (let h = 0; h <= 336; h += 6) { // 0 → 14 days in 6-hr steps
    const pct = medicationLevel(h, halfLifeDays)
    const ts = new Date(start.getTime() + h * 3600 * 1000)
    points.push({
      time: ts.toISOString(),
      level: +(pct * doseMg / 100).toFixed(4),
      pct: +pct.toFixed(1),
    })
  }
  return points
}
