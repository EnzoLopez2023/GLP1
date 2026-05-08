// Pure analysis helpers for the Insights page.
// All functions are side-effect free and tolerate empty inputs.

import { differenceInDays, parseISO, startOfWeek, format } from 'date-fns'
import { MEDICATIONS } from './constants'

const DAY_MS = 86400000

// ── Dose stages ────────────────────────────────────────────────────────────
// For each entry in the medication's escalation table, build a stage with:
//   { week, dose, label, startDate, endDate, isCurrent, isFuture }
// startDate is derived from profile.startDate; endDate is the day before the
// next stage begins (or null for the final/current stage if no next exists).
export function getDoseStages(profile) {
  if (!profile?.medicationName || !profile?.startDate) return []
  const med = MEDICATIONS[profile.medicationName]
  if (!med?.escalation?.length) return []

  const start = parseISO(profile.startDate)
  if (Number.isNaN(start.getTime())) return []

  const today = new Date()
  return med.escalation.map((step, i) => {
    const stageStart = new Date(start.getTime() + (step.week - 1) * 7 * DAY_MS)
    const next = med.escalation[i + 1]
    const stageEnd = next
      ? new Date(start.getTime() + (next.week - 1) * 7 * DAY_MS - DAY_MS)
      : null
    const startedAlready = stageStart <= today
    const endedAlready   = stageEnd && stageEnd < today
    return {
      week: step.week,
      dose: step.dose,
      label: `${step.dose} mg`,
      startDate: stageStart,
      endDate: stageEnd,
      isCurrent: startedAlready && !endedAlready,
      isFuture:  !startedAlready,
      isPast:    !!endedAlready,
    }
  })
}

export function currentStage(stages) {
  return stages.find(s => s.isCurrent) ?? null
}

export function nextStage(stages) {
  return stages.find(s => s.isFuture) ?? null
}

export function weeksOnMedication(profile) {
  if (!profile?.startDate) return null
  const days = differenceInDays(new Date(), parseISO(profile.startDate))
  if (days < 0) return null
  return Math.floor(days / 7) + 1   // week 1 = days 0–6
}

// ── A1C estimate ───────────────────────────────────────────────────────────
// ADA eAG formula: A1C = (avgGlucose_mgdL + 46.7) / 28.7
// Returns null if not enough data, otherwise one decimal place.
export function estimatedA1C(avgGlucoseMgDl) {
  if (!avgGlucoseMgDl || avgGlucoseMgDl < 50) return null
  return +((avgGlucoseMgDl + 46.7) / 28.7).toFixed(1)
}

// ── Glucose stats ──────────────────────────────────────────────────────────
// glucose is the API response (DESC by readingAt). All math handles ASC or DESC
// since we just iterate.
export function glucoseStats(glucose) {
  if (!glucose?.length) return null
  const all      = glucose.map(r => r.value)
  const fasting  = glucose.filter(r => r.readingType === 'fasting').map(r => r.value)
  const postMeal = glucose.filter(r => r.readingType === 'post-meal').map(r => r.value)
  const inRange  = glucose.filter(r => r.value >= 70 && r.value <= 180).length
  return {
    count:        glucose.length,
    avg:          avg(all),
    fastingAvg:   avg(fasting),
    fastingCount: fasting.length,
    postMealAvg:  avg(postMeal),
    postMealCount: postMeal.length,
    timeInRangePct: glucose.length ? Math.round(inRange / glucose.length * 100) : 0,
    distribution: {
      low:    glucose.filter(r => r.value < 70).length,                                          // <70
      normal: glucose.filter(r => r.value >= 70  && r.value < 100).length,                        // 70–99
      pre:    glucose.filter(r => r.value >= 100 && r.value < 126).length,                        // 100–125
      high:   glucose.filter(r => r.value >= 126 && r.value <= 180).length,                       // 126–180
      vhigh:  glucose.filter(r => r.value > 180).length,                                          // >180
    },
    min: Math.min(...all),
    max: Math.max(...all),
  }
}

// Compare the most recent N readings to the prior N to detect a trend.
export function glucoseTrend(glucose, windowSize = 10) {
  const fasting = (glucose ?? [])
    .filter(r => r.readingType === 'fasting')
    .slice()
    .sort((a, b) => a.readingAt.localeCompare(b.readingAt))   // ASC

  if (fasting.length < windowSize * 2) return null
  const recent = fasting.slice(-windowSize)
  const prior  = fasting.slice(-windowSize * 2, -windowSize)
  const recentAvg = avg(recent.map(r => r.value))
  const priorAvg  = avg(prior.map(r => r.value))
  const delta = recentAvg - priorAvg
  return {
    recentAvg,
    priorAvg,
    delta,
    direction: delta < -3 ? 'down' : delta > 3 ? 'up' : 'flat',
    windowSize,
  }
}

// Per-week aggregate, useful for bar charts.
// Returns: [{ weekStart: 'MMM d', avg, fastingAvg, count }]
export function weeklyAvgGlucose(glucose) {
  if (!glucose?.length) return []
  const buckets = new Map()  // ISO week-start → array of values
  for (const r of glucose) {
    const ws = format(startOfWeek(parseISO(r.readingAt), { weekStartsOn: 0 }), 'yyyy-MM-dd')
    if (!buckets.has(ws)) buckets.set(ws, [])
    buckets.get(ws).push(r)
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ws, rows]) => {
      const fasting = rows.filter(r => r.readingType === 'fasting').map(r => r.value)
      return {
        weekKey:    ws,
        weekLabel:  format(parseISO(ws), 'MMM d'),
        count:      rows.length,
        avg:        avg(rows.map(r => r.value)),
        fastingAvg: fasting.length ? avg(fasting) : null,
      }
    })
}

// ── Weight stats ───────────────────────────────────────────────────────────
// weights ASC by date.
export function weightStats(weights, profile) {
  if (!weights?.length) return null
  const start = weights[0]
  const last  = weights[weights.length - 1]
  const lost  = +(start.weightLbs - last.weightLbs).toFixed(1)
  const days  = Math.max(1, differenceInDays(parseISO(last.date), parseISO(start.date)))
  const weeks = Math.max(1, Math.round(days / 7))
  const startW = start.weightLbs
  const lostPct = startW ? +((lost / startW) * 100).toFixed(1) : 0
  const goal = profile?.goalWeightLbs
  const goalDelta = goal ? +(last.weightLbs - goal).toFixed(1) : null
  const goalProgressPct = (goal && (startW - goal) > 0)
    ? Math.min(100, Math.round((lost / (startW - goal)) * 100))
    : null
  return {
    startWeight:  startW,
    currentWeight: last.weightLbs,
    lost,
    lostPct,
    days,
    weeks,
    weeklyRate: +(lost / weeks).toFixed(2),
    goal,
    goalDelta,
    goalProgressPct,
  }
}

// Recent vs prior weight delta to detect plateau or steady loss.
export function weightTrend(weights, windowDays = 14) {
  if (!weights || weights.length < 2) return null
  const today = new Date()
  const cutoffISO = new Date(today.getTime() - windowDays * DAY_MS).toISOString().slice(0, 10)
  const prior = weights.filter(w => w.date <  cutoffISO)
  const recent = weights.filter(w => w.date >= cutoffISO)
  if (!prior.length || !recent.length) return null
  const priorLast = prior[prior.length - 1].weightLbs
  const recentLast = recent[recent.length - 1].weightLbs
  return {
    delta: +(recentLast - priorLast).toFixed(1),
    windowDays,
  }
}

// ── Per-stage analysis ─────────────────────────────────────────────────────
// For each completed (or current) dose stage, summarize what happened during it.
export function perStageStats({ stages, glucose, weights, injections }) {
  return stages
    .filter(s => !s.isFuture)
    .map(s => {
      // Compare on YYYY-MM-DD slices so weight rows (date-only) align with
      // glucose/injection rows (full timestamps).
      const startDay = format(s.startDate, 'yyyy-MM-dd')
      const endDay   = s.endDate ? format(s.endDate, 'yyyy-MM-dd') : null
      const inRange = (iso) => {
        const day = String(iso).slice(0, 10)
        return day >= startDay && (!endDay || day <= endDay)
      }

      const stageGlucose = (glucose ?? []).filter(r => inRange(r.readingAt))
      const fasting = stageGlucose.filter(r => r.readingType === 'fasting').map(r => r.value)
      const stageWeights = (weights ?? []).filter(w => inRange(w.date))
      const stageInjections = (injections ?? []).filter(i => inRange(i.injectedAt))

      const wFirst = stageWeights[0]
      const wLast  = stageWeights[stageWeights.length - 1]
      const lostInStage = (wFirst && wLast) ? +(wFirst.weightLbs - wLast.weightLbs).toFixed(1) : null

      return {
        ...s,
        glucoseCount: stageGlucose.length,
        glucoseAvg:   stageGlucose.length ? avg(stageGlucose.map(r => r.value)) : null,
        fastingAvg:   fasting.length ? avg(fasting) : null,
        fastingCount: fasting.length,
        weightStart:  wFirst?.weightLbs ?? null,
        weightEnd:    wLast?.weightLbs  ?? null,
        weightLost:   lostInStage,
        injectionCount: stageInjections.length,
      }
    })
}

// ── Injection cadence ──────────────────────────────────────────────────────
// injections from API are DESC. Returns the gap (days) between successive
// injections, the latest gap, and "days since last".
export function injectionCadence(injections) {
  if (!injections?.length) return null
  const sorted = injections.slice().sort((a, b) => a.injectedAt.localeCompare(b.injectedAt))
  const gaps = []
  for (let i = 1; i < sorted.length; i++) {
    const d = differenceInDays(parseISO(sorted[i].injectedAt.slice(0, 10)), parseISO(sorted[i - 1].injectedAt.slice(0, 10)))
    gaps.push({
      date: sorted[i].injectedAt.slice(0, 10),
      gapDays: d,
      doseMg: sorted[i].doseMg,
    })
  }
  const latest = sorted[sorted.length - 1]
  const daysSinceLast = differenceInDays(new Date(), parseISO(latest.injectedAt))
  const onTime = gaps.filter(g => g.gapDays >= 6 && g.gapDays <= 8).length
  return {
    daysSinceLast,
    latest,
    gaps,
    avgGap: gaps.length ? +(gaps.reduce((s, g) => s + g.gapDays, 0) / gaps.length).toFixed(1) : null,
    onTimeRate: gaps.length ? Math.round((onTime / gaps.length) * 100) : null,
  }
}

// ── Encouraging insights for diabetic on keto + GLP-1 ──────────────────────
// Returns an array of insight cards for the top of the page.
export function generateInsights({ profile, glucose, weights, injections, stages }) {
  const list = []

  // Injection adherence (fixed bug: use most recent, not oldest)
  if (injections?.length) {
    const sorted = injections.slice().sort((a, b) => b.injectedAt.localeCompare(a.injectedAt))
    const latest = sorted[0]
    const daysSince = differenceInDays(new Date(), parseISO(latest.injectedAt))
    if (daysSince > 8) {
      list.push({
        type: 'warning',
        title: `It's been ${daysSince} days since your last injection`,
        body:  'GLP-1 medications work best with consistent weekly dosing.',
        action: 'Log your injection in the Medication tab.',
      })
    } else if (daysSince <= 7) {
      list.push({
        type: 'positive',
        title: `On schedule — last injection ${daysSince === 0 ? 'today' : `${daysSince} day${daysSince===1?'':'s'} ago`}`,
        body:  `${latest.doseMg} mg ${profile?.medicationName ?? 'GLP-1'} on ${format(parseISO(latest.injectedAt), 'MMM d')}.`,
      })
    }
  }

  // Glucose progress (encouraging tone for diabetic working on improvement)
  const stats = glucoseStats(glucose)
  if (stats?.fastingCount >= 3) {
    const f = stats.fastingAvg
    if (f < 100) {
      list.push({
        type: 'positive',
        title: `Fasting average ${f} mg/dL — non-diabetic range`,
        body:  'Excellent control. Keep doing what you\'re doing.',
      })
    } else if (f < 126) {
      list.push({
        type: 'positive',
        title: `Fasting average ${f} mg/dL — pre-diabetic range`,
        body:  'You\'ve crossed below the diabetic threshold. Major win for keto + GLP-1 combined.',
      })
    } else if (f < 150) {
      list.push({
        type: 'info',
        title: `Fasting average ${f} mg/dL — making progress`,
        body:  'You\'re trending toward target. Each dose escalation typically drops fastings further.',
      })
    } else if (f < 180) {
      list.push({
        type: 'info',
        title: `Fasting average ${f} mg/dL — early progress`,
        body:  'Your numbers are still working downward. Keto plus GLP-1 is one of the most effective combos for this; give it the full escalation cycle to see the full effect.',
      })
    } else {
      list.push({
        type: 'info',
        title: `Fasting average ${f} mg/dL`,
        body:  'High fastings often respond strongest to the next dose escalation. Track the change after each step-up — that\'s where the wins compound.',
      })
    }
  }

  // Glucose trend
  const trend = glucoseTrend(glucose, 8)
  if (trend) {
    if (trend.direction === 'down') {
      list.push({
        type: 'positive',
        title: `Fasting glucose trending down: ${Math.abs(trend.delta).toFixed(0)} mg/dL improvement`,
        body:  `Recent ${trend.windowSize} fastings average ${trend.recentAvg} vs ${trend.priorAvg} before. That\'s real, measurable progress.`,
      })
    } else if (trend.direction === 'up') {
      list.push({
        type: 'info',
        title: `Fasting glucose has crept up ${trend.delta.toFixed(0)} mg/dL recently`,
        body:  'Worth checking — sleep, illness, stress, or a missed injection can all push fastings up. If it persists past a dose change, mention it to your doctor.',
      })
    } else {
      list.push({
        type: 'info',
        title: 'Fasting glucose holding steady',
        body:  'Stable control between dose changes is a good sign. The next escalation usually moves the average down again.',
      })
    }
  }

  // Weight progress
  const wStats = weightStats(weights, profile)
  if (wStats?.lost > 0) {
    const pct = wStats.lostPct
    if (pct >= 10) {
      list.push({
        type: 'positive',
        title: `Down ${wStats.lost} lbs (${pct}% of starting weight)`,
        body:  `Past 10% — clinically meaningful. Most of the metabolic benefits of GLP-1 weight loss appear here. ${wStats.weeklyRate} lbs/week average.`,
      })
    } else if (pct >= 5) {
      list.push({
        type: 'positive',
        title: `Down ${wStats.lost} lbs (${pct}% of starting weight)`,
        body:  `5%+ is the threshold for measurable A1C and glucose improvement. ${wStats.weeklyRate} lbs/week average — solid pace.`,
      })
    } else {
      list.push({
        type: 'positive',
        title: `Down ${wStats.lost} lbs over ${wStats.weeks} week${wStats.weeks===1?'':'s'}`,
        body:  `${wStats.weeklyRate} lbs/week. Loss usually accelerates with each dose escalation, so the curve gets steeper from here.`,
      })
    }
    if (wStats.goalProgressPct != null) {
      list.push({
        type: 'info',
        title: `${wStats.goalProgressPct}% of the way to your goal weight`,
        body:  `${Math.abs(wStats.goalDelta)} lbs to go. At your current pace, ~${Math.max(1, Math.round(Math.abs(wStats.goalDelta) / Math.max(0.1, wStats.weeklyRate)))} more weeks.`,
      })
    }
  }

  // Time in range
  if (stats && stats.count >= 10) {
    const tir = stats.timeInRangePct
    if (tir >= 70) {
      list.push({
        type: 'positive',
        title: `${tir}% of readings in range (70–180 mg/dL)`,
        body:  'That\'s the target many endocrinologists set. Sustained, this corresponds to roughly an A1C of 7% or below.',
      })
    } else if (tir >= 50) {
      list.push({
        type: 'info',
        title: `${tir}% of readings in range (70–180 mg/dL)`,
        body:  'Above 50% — meaningful improvement zone. Goal: 70%+. Each dose escalation usually pulls highs lower.',
      })
    }
  }

  // Stage transition: are we within the first 14 days of a new dose?
  const cur = currentStage(stages)
  if (cur) {
    const daysIntoStage = differenceInDays(new Date(), cur.startDate)
    if (daysIntoStage >= 0 && daysIntoStage <= 14) {
      list.push({
        type: 'info',
        title: `You're ${daysIntoStage <= 1 ? 'just starting' : `in week ${Math.floor(daysIntoStage / 7) + 1} of`} ${cur.label}`,
        body:  doseExpectations(profile?.medicationName, cur.dose, /* atStart */ true),
      })
    }
  }

  // Next escalation preview
  const nxt = nextStage(stages)
  if (cur && nxt) {
    const daysToNext = differenceInDays(nxt.startDate, new Date())
    if (daysToNext >= 0 && daysToNext <= 21) {
      list.push({
        type: 'info',
        title: `Next dose: ${nxt.label} expected in ${daysToNext} day${daysToNext===1?'':'s'}`,
        body:  doseExpectations(profile?.medicationName, nxt.dose, /* atStart */ true, /* fromDose */ cur.dose),
      })
    }
  }

  return list
}

// ── Dose-transition expectations (Mounjaro/tirzepatide-aware) ──────────────
export function doseExpectations(medName, toDose, atStart = true, fromDose = null) {
  const isTirzepatide = medName === 'Mounjaro' || medName === 'Zepbound'
  const isSemaglutide = medName === 'Ozempic'  || medName === 'Wegovy'

  if (isTirzepatide) {
    const map = {
      2.5:  'Starter dose. Body is adjusting — appetite suppression starts mild and ramps over weeks 2–4. GI side effects (nausea, GERD, sulfur burps) are most common in week 1; usually fade. Hydration is the #1 thing.',
      5:    'First "real" therapeutic dose. Expect noticeably stronger appetite suppression and the first clear weight-loss acceleration. Fasting glucose often drops 10–20 mg/dL across this 4-week block. Brief nausea bump in week 1 is normal.',
      7.5:  'Sweet-spot dose for many. Glucose typically drops the most during this stage. Continued weight loss. Side effects often plateau.',
      10:   'Diminishing-returns curve begins for some — gains continue but more slowly. Many people reach their A1C goal here and pause escalation in conversation with their doctor.',
      12.5: 'Reserved for those still needing more glucose control or weight loss. Best results when stage 10 plateaued. Watch tolerance carefully.',
      15:   'Maximum dose. Best glycemic and weight outcomes in clinical trials (SURMOUNT). Long-term commitment to tolerance and adherence.',
    }
    return map[toDose] ?? `Continue tracking — each dose increase usually drops fastings further and accelerates weight loss for 2–4 weeks before settling.`
  }

  if (isSemaglutide) {
    const map = {
      0.25: 'Starter dose, primarily for tolerance — minimal glucose/weight effect by design. Expect appetite suppression to ramp over weeks 2–4.',
      0.5:  'First therapeutic dose. Appetite suppression strengthens; weight loss accelerates. Fasting glucose typically drops here.',
      1.0:  'Strong therapeutic stage. Most glucose improvement happens during this block in trials. Side effects often plateau.',
      1.7:  'High-dose Wegovy step. Continued weight loss; A1C drop continues but slower.',
      2.0:  'Max Ozempic dose. Best glucose results for most. Long-term commitment.',
      2.4:  'Max Wegovy dose. Best weight-loss results in trials. Long-term commitment.',
    }
    return map[toDose] ?? 'Each dose escalation usually drops fastings further and accelerates weight loss for 2–4 weeks before settling.'
  }

  return 'Each dose escalation usually drops fastings further and accelerates weight loss for 2–4 weeks before settling.'
}

// ── Helpers ────────────────────────────────────────────────────────────────
function avg(arr) {
  if (!arr.length) return 0
  return Math.round(arr.reduce((s, x) => s + x, 0) / arr.length)
}
