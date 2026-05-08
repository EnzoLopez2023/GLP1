import { useState, useMemo } from 'react'
import PageHero from '../components/motion/PageHero'
import { api } from '../api/client'
import { useQuery } from '../hooks/useQuery'
import { downloadJSON, downloadCSV, readFile } from '../utils/exportHelpers'
import { toDateStr } from '../utils/dateHelpers'
import Card, { CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Stagger, StaggerItem, FadeUp } from '../components/motion/primitives'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell,
} from 'recharts'
import {
  FileText, Download, Upload, Droplets, Syringe, Scale, FlaskConical,
  TrendingDown, TrendingUp, Minus, Activity, Flame, Target, Zap,
} from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import {
  glucoseStats, getDoseStages, perStageStats, injectionCadence,
  weightStats, estimatedA1C, weeklyAvgGlucose,
} from '../utils/insights'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

// ── Helpers ───────────────────────────────────────────────────────────────────
function stdDev(vals) {
  if (!vals.length) return 0
  const m = vals.reduce((s, v) => s + v, 0) / vals.length
  return Math.sqrt(vals.reduce((s, v) => s + (v - m) ** 2, 0) / vals.length)
}

function fmtDate(d) {
  if (!d) return '—'
  try { return format(parseISO(d), 'MMM d, yyyy') } catch { return d }
}
function fmtShort(d) {
  if (!d) return ''
  try { return format(parseISO(d), 'MMM yy') } catch { return d }
}
function fmtNum(v, dec = 0) {
  if (v == null) return '—'
  return typeof v === 'number' ? v.toFixed(dec) : v
}

function a1cColor(v) {
  if (v == null) return 'text-wood-500'
  if (v < 5.7) return 'text-green-600'
  if (v < 6.5) return 'text-amber-600'
  return 'text-red-600'
}
function cvColor(v) {
  if (v == null) return 'text-wood-500'
  if (v < 36) return 'text-green-600'
  if (v < 50) return 'text-amber-600'
  return 'text-red-600'
}
function tirColor(v) {
  if (v == null) return 'text-wood-500'
  if (v >= 70) return 'text-green-600'
  if (v >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#fffaf3] border border-wood-200/60 rounded-xl shadow-tile px-3 py-2 text-xs">
      <p className="font-semibold text-wood-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color || p.fill }}>
          {p.name}: {p.value}{p.unit || ''}
        </p>
      ))}
    </div>
  )
}

// ── StatCell ─────────────────────────────────────────────────────────────────
function StatCell({ label, value, unit, colorClass = 'text-wood-900', sub }) {
  return (
    <div className="bg-wood-50/60 rounded-2xl p-3.5 flex flex-col gap-0.5 border border-wood-200/50">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-wood-500">{label}</p>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span className={clsx('text-2xl font-bold tabular-nums', colorClass)}>{value ?? '—'}</span>
        {unit && <span className="text-xs text-wood-500">{unit}</span>}
      </div>
      {sub && <p className="text-[10px] text-wood-500 leading-tight">{sub}</p>}
    </div>
  )
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'glucose',  label: 'Glucose',  icon: Droplets },
  { id: 'progress', label: 'Progress', icon: TrendingDown },
  { id: 'labs',     label: 'Labs',     icon: FlaskConical },
  { id: 'export',   label: 'Export',   icon: Download },
]

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Reports() {
  const [tab, setTab]                       = useState('glucose')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile]           = useState(null)

  const { data: glucose }    = useQuery(api.getGlucose)
  const { data: injections } = useQuery(() => api.getInjections(500))
  const { data: weights }    = useQuery(api.getWeightLog)
  const { data: profile }    = useQuery(api.getProfile)
  const { data: vitalsRaw }  = useQuery(api.getMedicalVitals)
  const { data: labsRaw }    = useQuery(api.getMedicalLabs)

  const glu  = glucose    ?? []
  const inj  = injections ?? []
  const wts  = weights    ?? []
  const vits = vitalsRaw  ?? []
  const labs = labsRaw    ?? []

  // ── Glucose analytics ─────────────────────────────────────────────────────
  const stats = useMemo(() => glucoseStats(glu), [glu])

  const { sd, cv, gmi } = useMemo(() => {
    if (!stats?.count) return {}
    const vals = glu.map(r => r.value)
    const sd = +stdDev(vals).toFixed(1)
    const cv = +(sd / stats.avg * 100).toFixed(1)
    const gmi = +(3.31 + 0.02392 * stats.avg).toFixed(2)
    return { sd, cv, gmi }
  }, [glu, stats])

  const zones = useMemo(() => {
    if (!stats) return []
    const total = stats.count
    return [
      { key: 'low',    label: 'Low',       range: '< 70',    color: '#dc2626', count: stats.distribution.low    },
      { key: 'normal', label: 'Normal',    range: '70–99',   color: '#16a34a', count: stats.distribution.normal },
      { key: 'pre',    label: 'Pre-DM',    range: '100–125', color: '#d97706', count: stats.distribution.pre    },
      { key: 'high',   label: 'High',      range: '126–180', color: '#f97316', count: stats.distribution.high   },
      { key: 'vhigh',  label: 'Very High', range: '> 180',   color: '#7f1d1d', count: stats.distribution.vhigh  },
    ].map(z => ({ ...z, pct: total ? +(z.count / total * 100).toFixed(1) : 0 }))
  }, [stats])

  const dowData = useMemo(() => {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const buckets = Array(7).fill(null).map(() => [])
    for (const r of glu) {
      try { buckets[parseISO(r.readingAt).getDay()].push(r.value) } catch {}
    }
    return labels.map((day, i) => ({
      day,
      avg: buckets[i].length ? Math.round(buckets[i].reduce((s, v) => s + v, 0) / buckets[i].length) : null,
      count: buckets[i].length,
    })).filter(d => d.count > 0)
  }, [glu])

  const weeklyGlu = useMemo(() => weeklyAvgGlucose(glu), [glu])

  // 30-day summary
  const cutoff30 = new Date(Date.now() - 30 * 86400000).toISOString()
  const recent30 = useMemo(() => glu.filter(r => r.readingAt >= cutoff30), [glu, cutoff30])
  const stats30  = useMemo(() => glucoseStats(recent30), [recent30])

  // ── Progress analytics ────────────────────────────────────────────────────
  const wStats   = useMemo(() => weightStats(wts.slice().sort((a, b) => a.date.localeCompare(b.date)), profile), [wts, profile])
  const stages   = useMemo(() => getDoseStages(profile), [profile])
  const stageRows = useMemo(() => perStageStats({ stages, glucose: glu, weights: wts, injections: inj }), [stages, glu, wts, inj])
  const cadence  = useMemo(() => injectionCadence(inj), [inj])

  const injPhysics = useMemo(() => {
    if (!wStats?.lost || !wStats.days) return null
    const totalCalDeficit = Math.round(wStats.lost * 3500)
    const dailyDeficit    = Math.round(totalCalDeficit / wStats.days)
    const weeklyDeficit   = dailyDeficit * 7
    return { totalCalDeficit, dailyDeficit, weeklyDeficit }
  }, [wStats])

  // Injection streak (consecutive weeks backward from now)
  const { heatmapWeeks, streak } = useMemo(() => {
    const weeks = []
    for (let w = 19; w >= 0; w--) {
      const anchor = new Date(Date.now() - w * 7 * 86400000)
      const sunday = new Date(anchor)
      sunday.setDate(anchor.getDate() - anchor.getDay())
      sunday.setHours(0, 0, 0, 0)
      const nextSunday = new Date(sunday.getTime() + 7 * 86400000)
      const weekInj = inj.filter(i => {
        const d = new Date(i.injectedAt)
        return d >= sunday && d < nextSunday
      })
      weeks.push({
        label: format(sunday, 'MMM d'),
        injected: weekInj.length > 0,
        doseMg: weekInj[0]?.doseMg ?? null,
      })
    }
    let s = 0
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (weeks[i].injected) s++
      else break
    }
    return { heatmapWeeks: weeks, streak: s }
  }, [inj])

  // ── Lab analytics ─────────────────────────────────────────────────────────
  const labHbA1c = useMemo(() =>
    labs.filter(l => l.testName === 'HbA1c' && l.value != null)
      .sort((a, b) => a.collectedDate.localeCompare(b.collectedDate)),
    [labs])

  // Combine lab A1C + GMI from weekly glucose onto one timeline
  const a1cTimeline = useMemo(() => {
    const labPoints = labHbA1c.map(l => ({
      date: l.collectedDate,
      label: fmtShort(l.collectedDate),
      labA1c: l.value,
      gmi: null,
    }))
    const gmiPoints = weeklyGlu
      .filter(w => w.avg)
      .map(w => ({
        date: w.weekKey,
        label: w.weekLabel,
        labA1c: null,
        gmi: +(3.31 + 0.02392 * w.avg).toFixed(2),
      }))
    // merge + sort
    const merged = [...labPoints, ...gmiPoints].sort((a, b) => a.date.localeCompare(b.date))
    // forward-fill labA1c for rendering continuity (recharts connectNulls handles it)
    return merged
  }, [labHbA1c, weeklyGlu])

  // Days since last normal A1C (lab-confirmed <5.7%)
  const daysSinceNormalA1c = useMemo(() => {
    const normal = labHbA1c.filter(l => l.value < 5.7)
    if (!normal.length) return null
    const last = normal[normal.length - 1]
    return differenceInDays(new Date(), parseISO(last.collectedDate))
  }, [labHbA1c])

  // Flag trend per lab visit
  const flagTrend = useMemo(() => {
    const byDate = {}
    for (const lab of labs) {
      if (!byDate[lab.collectedDate]) byDate[lab.collectedDate] = { date: lab.collectedDate, H: 0, L: 0, normal: 0 }
      const e = byDate[lab.collectedDate]
      if (lab.flag === 'H' || lab.flag === 'HH') e.H++
      else if (lab.flag === 'L' || lab.flag === 'LL') e.L++
      else e.normal++
    }
    return Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({ ...d, label: fmtShort(d.date), total: d.H + d.L + d.normal }))
  }, [labs])

  // Biomarker status panel
  const biomarkers = useMemo(() => {
    const latestLab = name => labs
      .filter(l => l.testName === name && l.value != null)
      .sort((a, b) => b.collectedDate.localeCompare(a.collectedDate))[0] ?? null
    const latestVital = vits.length
      ? [...vits].sort((a, b) => b.visitDate.localeCompare(a.visitDate))[0]
      : null
    const bpFlag = latestVital?.bpSystolic >= 140 || latestVital?.bpDiastolic >= 90 ? 'H'
      : latestVital?.bpSystolic >= 130 ? 'H' : ''
    return [
      { label: 'HbA1c',        ...labEntry(latestLab('HbA1c'))    },
      { label: 'Triglycerides', ...labEntry(latestLab('Triglycerides')) },
      { label: 'HDL',           ...labEntry(latestLab('HDL'))      },
      { label: 'ALT (Liver)',   ...labEntry(latestLab('ALT'))      },
      { label: 'TSH',           ...labEntry(latestLab('TSH'))      },
      { label: 'Lymphocytes',   ...labEntry(latestLab('Lymphocytes (abs)')) },
      { label: 'Sodium',        ...labEntry(latestLab('Sodium'))   },
      {
        label: 'Blood Pressure',
        value: latestVital?.bpSystolic ? `${latestVital.bpSystolic}/${latestVital.bpDiastolic}` : null,
        unit: 'mmHg', flag: bpFlag, date: latestVital?.visitDate,
      },
    ]
  }, [labs, vits])

  // ── Export handlers ───────────────────────────────────────────────────────
  async function handleFullExport() {
    const data = await api.exportData()
    downloadJSON(data, `tare-backup-${toDateStr()}.json`)
    toast.success('Full backup exported!')
  }
  async function handleGlucoseCSV() {
    const rows = glu.map(r => ({
      Date: r.readingAt.slice(0,10), Time: r.readingAt.slice(11,16),
      'Value (mg/dL)': r.value, Type: r.readingType, Notes: r.notes ?? '',
    }))
    downloadCSV(rows, `glucose-${toDateStr()}.csv`)
    toast.success('Glucose CSV exported!')
  }
  async function handleInjectionCSV() {
    const rows = inj.map(i => ({
      Date: i.injectedAt.slice(0,10), Time: i.injectedAt.slice(11,16),
      Medication: i.medicationName, 'Dose (mg)': i.doseMg, Site: i.site, Notes: i.notes ?? '',
    }))
    downloadCSV(rows, `injections-${toDateStr()}.csv`)
    toast.success('Injections CSV exported!')
  }
  async function handleWeightCSV() {
    const rows = wts.map(w => ({
      Date: w.date, 'Weight (lbs)': w.weightLbs, Notes: w.notes ?? '',
    }))
    downloadCSV(rows, `weight-${toDateStr()}.csv`)
    toast.success('Weight CSV exported!')
  }
  async function handleImport() {
    if (!importFile) { toast.error('Please select a file'); return }
    try {
      const text = await readFile(importFile)
      await api.importData(JSON.parse(text))
      toast.success('Data imported! Refresh to see changes.')
      setShowImportModal(false)
    } catch (err) {
      toast.error('Import failed: ' + err.message)
    }
  }

  return (
    <PageHero variant="reports">
    <div className="space-y-5">

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <FadeUp>
        <div className="flex gap-1 p-1 bg-wood-100/60 rounded-2xl">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all',
                tab === id ? 'bg-[#fffaf3] shadow-tile text-wood-900' : 'text-wood-500 hover:text-wood-700'
              )}
            >
              <Icon size={13} />{label}
            </button>
          ))}
        </div>
      </FadeUp>

      <AnimatePresence mode="wait">

        {/* ════════════════════════════════ GLUCOSE ══════════════════════════ */}
        {tab === 'glucose' && (
          <motion.div key="glucose"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
            className="space-y-5"
          >

            {/* All-time glucose command center */}
            <FadeUp>
              <Card>
                <CardHeader title="All-Time Glucose Analytics" subtitle={`${glu.length} total readings`} />
                <div className="grid grid-cols-3 gap-2">
                  <StatCell label="Mean" value={fmtNum(stats?.avg)} unit="mg/dL" sub="all readings" />
                  <StatCell label="Std Dev" value={fmtNum(sd)} unit="mg/dL" sub="variability" />
                  <StatCell
                    label="CV" value={cv != null ? `${cv}%` : '—'}
                    colorClass={cvColor(cv)}
                    sub={cv == null ? '' : cv < 36 ? '✓ stable' : cv < 50 ? 'moderate' : 'high variability'}
                  />
                  <StatCell
                    label="GMI / eA1c"
                    value={fmtNum(gmi, 2)}
                    unit="%"
                    colorClass={a1cColor(gmi)}
                    sub="from glucose avg"
                  />
                  <StatCell
                    label="Time in Range"
                    value={stats?.timeInRangePct != null ? `${stats.timeInRangePct}%` : '—'}
                    colorClass={tirColor(stats?.timeInRangePct)}
                    sub="70–180 mg/dL"
                  />
                  <StatCell label="Range" value={stats?.count ? `${stats.min}–${stats.max}` : '—'} unit="mg/dL" sub="min – max" />
                </div>
                <p className="text-[10px] text-wood-400 mt-3 px-1">
                  GMI (Glucose Management Indicator) = 3.31 + 0.02392 × mean glucose — ADA-validated estimate of HbA1c.
                  CV &lt;36% is the clinical target for glycemic stability.
                </p>
              </Card>
            </FadeUp>

            {/* Time-in-range zone bar */}
            {zones.length > 0 && (
              <FadeUp delay={0.05}>
                <Card>
                  <CardHeader title="Reading Distribution" subtitle="All readings by glucose zone" />
                  <div className="flex h-9 rounded-xl overflow-hidden w-full mb-3 border border-wood-200/40">
                    {zones.map(z => z.count > 0 && (
                      <div
                        key={z.key}
                        style={{ width: `${z.pct}%`, background: z.color }}
                        title={`${z.label}: ${z.count} (${z.pct}%)`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {zones.map(z => (
                      <div key={z.key} className="text-center">
                        <div className="w-3 h-3 rounded-sm mx-auto mb-1" style={{ background: z.color }} />
                        <p className="text-[10px] font-bold text-wood-700">{z.pct}%</p>
                        <p className="text-[9px] text-wood-500">{z.label}</p>
                        <p className="text-[9px] text-wood-400">{z.range}</p>
                        <p className="text-[9px] text-wood-400">{z.count} reads</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </FadeUp>
            )}

            {/* Day-of-week pattern */}
            {dowData.length >= 3 && (
              <FadeUp delay={0.09}>
                <Card>
                  <CardHeader title="Glucose by Day of Week" subtitle="Average mg/dL per day — patterns in control" />
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={dowData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8d9b6" strokeOpacity={0.6} vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#78614a' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#78614a' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                      <Tooltip content={<ChartTooltip />} />
                      <ReferenceLine y={100} stroke="#d97706" strokeDasharray="4 2" strokeWidth={1} />
                      <Bar dataKey="avg" name="Avg glucose" unit=" mg/dL" radius={[4,4,0,0]}>
                        {dowData.map(d => (
                          <Cell key={d.day} fill={d.avg < 100 ? '#16a34a' : d.avg < 126 ? '#d97706' : '#ef4444'} fillOpacity={0.75} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {dowData.length > 0 && (() => {
                    const best  = [...dowData].sort((a, b) => a.avg - b.avg)[0]
                    const worst = [...dowData].sort((a, b) => b.avg - a.avg)[0]
                    return (
                      <div className="flex gap-3 mt-2 flex-wrap">
                        <span className="text-[11px] text-green-700">Best day: {best.day} ({best.avg} mg/dL avg)</span>
                        <span className="text-[11px] text-red-700">Highest day: {worst.day} ({worst.avg} mg/dL avg)</span>
                      </div>
                    )
                  })()}
                </Card>
              </FadeUp>
            )}

            {/* 30-day summary vs all-time */}
            <FadeUp delay={0.13}>
              <Card>
                <CardHeader title="30-Day vs All-Time" subtitle="How recent control compares to your full history" />
                <div className="space-y-2">
                  {[
                    { label: 'Mean glucose', allTime: stats?.avg, recent: stats30?.avg, unit: 'mg/dL', betterLow: true },
                    { label: 'Fasting avg',  allTime: stats?.fastingAvg, recent: stats30?.fastingAvg, unit: 'mg/dL', betterLow: true },
                    { label: 'Time in range', allTime: stats?.timeInRangePct, recent: stats30?.timeInRangePct, unit: '%', betterLow: false },
                  ].map(({ label, allTime, recent, unit, betterLow }) => {
                    const delta = (allTime != null && recent != null) ? recent - allTime : null
                    const improving = delta != null && (betterLow ? delta < -1 : delta > 1)
                    const worsening = delta != null && (betterLow ? delta > 1  : delta < -1)
                    return (
                      <div key={label} className="flex items-center gap-3 py-2 border-b border-wood-200/30 last:border-0">
                        <p className="text-xs text-wood-700 font-medium w-28 shrink-0">{label}</p>
                        <div className="flex gap-4 flex-1">
                          <div className="text-center flex-1">
                            <p className="text-[10px] text-wood-400">All-time</p>
                            <p className="text-sm font-bold text-wood-800">{allTime ?? '—'}{allTime != null ? ` ${unit}` : ''}</p>
                          </div>
                          <div className="text-center flex-1">
                            <p className="text-[10px] text-wood-400">Last 30 days</p>
                            <p className={clsx('text-sm font-bold', improving ? 'text-green-700' : worsening ? 'text-red-700' : 'text-wood-800')}>
                              {recent ?? '—'}{recent != null ? ` ${unit}` : ''}
                            </p>
                          </div>
                          <div className="text-center w-12">
                            <p className="text-[10px] text-wood-400">Delta</p>
                            {delta != null ? (
                              <p className={clsx('text-sm font-bold flex items-center justify-center gap-0.5', improving ? 'text-green-600' : worsening ? 'text-red-600' : 'text-wood-500')}>
                                {improving ? <TrendingDown size={11} /> : worsening ? <TrendingUp size={11} /> : <Minus size={11} />}
                                {Math.abs(delta)}
                              </p>
                            ) : <p className="text-sm text-wood-400">—</p>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-[10px] text-wood-400 mt-2 px-0.5">
                  {recent30.length} readings in last 30 days · {glu.length} all-time
                </p>
              </Card>
            </FadeUp>

          </motion.div>
        )}

        {/* ════════════════════════════════ PROGRESS ═════════════════════════ */}
        {tab === 'progress' && (
          <motion.div key="progress"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
            className="space-y-5"
          >

            {/* Weight physics */}
            {wStats && (
              <FadeUp>
                <Card>
                  <CardHeader title="Weight Physics" subtitle="The numbers behind the numbers" />
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <StatCell label="Total Lost" value={wStats.lost > 0 ? `${wStats.lost} lbs` : '—'} colorClass="text-green-700" sub={`${wStats.lostPct}% body weight`} />
                    <StatCell label="Weekly Rate" value={wStats.weeklyRate > 0 ? `${wStats.weeklyRate} lbs` : '—'} sub="lbs/week avg" />
                    {injPhysics && <>
                      <StatCell label="Implied Deficit" value={injPhysics.dailyDeficit.toLocaleString()} unit="cal/day" sub="3,500 cal = 1 lb model" />
                      <StatCell label="Total Cal Deficit" value={(injPhysics.totalCalDeficit / 1000).toFixed(1)} unit="k cal" sub="cumulative" />
                    </>}
                    {wStats.goal && <StatCell label="To Goal" value={wStats.goalDelta > 0 ? `${wStats.goalDelta} lbs` : '✓ Reached'} colorClass={wStats.goalDelta <= 0 ? 'text-green-600' : 'text-wood-900'} sub={wStats.goalProgressPct != null ? `${wStats.goalProgressPct}% there` : ''} />}
                    <StatCell label="Tracking" value={`${wStats.weeks} wks`} sub={`${wStats.days} days total`} />
                  </div>
                  {wStats.goalProgressPct != null && (
                    <div>
                      <div className="flex justify-between text-[10px] text-wood-500 mb-1">
                        <span>{wStats.startWeight} lbs</span>
                        <span>{wStats.goalProgressPct}% to goal</span>
                        <span>{wStats.goal} lbs</span>
                      </div>
                      <div className="w-full h-2.5 bg-wood-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-green-500 transition-all"
                          style={{ width: `${Math.min(100, wStats.goalProgressPct)}%` }}
                        />
                      </div>
                      {wStats.goalDelta > 0 && wStats.weeklyRate > 0 && (
                        <p className="text-[11px] text-wood-500 mt-1.5">
                          At current pace: ~{Math.ceil(wStats.goalDelta / wStats.weeklyRate)} more weeks
                        </p>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-wood-400 mt-2">
                    Implied caloric deficit uses the 3,500 cal/lb approximation and assumes a mixed fat/muscle composition. Actual deficit varies with metabolism.
                  </p>
                </Card>
              </FadeUp>
            )}

            {/* Per-dose stage breakdown */}
            {stageRows.length > 0 && (
              <FadeUp delay={0.06}>
                <Card>
                  <CardHeader title="GLP-1 Effectiveness Per Stage" subtitle="How each dose step changed your numbers" />
                  <div className="overflow-x-auto -mx-3">
                    <table className="w-full text-xs min-w-[480px]">
                      <thead>
                        <tr className="border-b border-wood-200/60">
                          <th className="text-left py-2 px-3 font-semibold text-wood-600">Dose</th>
                          <th className="text-right py-2 px-3 font-semibold text-wood-600">Fasting avg</th>
                          <th className="text-right py-2 px-3 font-semibold text-wood-600">Lbs lost</th>
                          <th className="text-right py-2 px-3 font-semibold text-wood-600">Inj</th>
                          <th className="text-right py-2 px-3 font-semibold text-wood-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-wood-200/30">
                        {stageRows.map(s => (
                          <tr key={s.dose} className="hover:bg-wood-50/50 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-wood-900">{s.label}</td>
                            <td className={clsx('py-2.5 px-3 text-right font-medium', s.fastingAvg < 100 ? 'text-green-700' : s.fastingAvg < 126 ? 'text-amber-700' : s.fastingAvg ? 'text-red-700' : 'text-wood-400')}>
                              {s.fastingAvg ? `${s.fastingAvg} mg/dL` : '—'}
                            </td>
                            <td className={clsx('py-2.5 px-3 text-right font-medium', s.weightLost > 0 ? 'text-green-700' : s.weightLost < 0 ? 'text-red-700' : 'text-wood-400')}>
                              {s.weightLost != null ? `${s.weightLost > 0 ? '↓' : s.weightLost < 0 ? '↑' : ''}${Math.abs(s.weightLost)} lbs` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right text-wood-600">{s.injectionCount}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                                s.isCurrent ? 'bg-green-100 text-green-700' : s.isPast ? 'bg-wood-100 text-wood-600' : 'bg-blue-50 text-blue-700'
                              )}>
                                {s.isCurrent ? 'current' : s.isPast ? 'past' : 'upcoming'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </FadeUp>
            )}

            {/* Injection heatmap */}
            {inj.length > 0 && (
              <FadeUp delay={0.1}>
                <Card>
                  <CardHeader
                    title="Injection Timeline"
                    subtitle={`Last 20 weeks · ${streak > 0 ? `${streak}-week streak` : 'No current streak'} · ${cadence?.onTimeRate ?? '—'}% on-time`}
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {heatmapWeeks.map((w, i) => (
                      <div
                        key={i}
                        title={`${w.label}${w.injected ? ` — ${w.doseMg} mg injected` : ' — missed'}`}
                        className={clsx(
                          'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                          w.injected ? 'bg-green-500' : 'bg-wood-100'
                        )}
                      >
                        <span className={clsx('text-[8px] font-bold leading-none', w.injected ? 'text-white' : 'text-wood-300')}>
                          {w.label.slice(0, 3)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-green-500" />
                      <span className="text-[11px] text-wood-500">Injected</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-wood-100 border border-wood-200" />
                      <span className="text-[11px] text-wood-500">No injection logged</span>
                    </div>
                  </div>
                  {cadence && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="bg-wood-50 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-wood-500">Avg gap</p>
                        <p className="text-base font-bold text-wood-900">{cadence.avgGap ?? '—'}<span className="text-xs font-normal"> days</span></p>
                      </div>
                      <div className="bg-wood-50 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-wood-500">On-time rate</p>
                        <p className={clsx('text-base font-bold', cadence.onTimeRate >= 80 ? 'text-green-700' : 'text-amber-700')}>
                          {cadence.onTimeRate ?? '—'}<span className="text-xs font-normal">%</span>
                        </p>
                      </div>
                      <div className="bg-wood-50 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-wood-500">Days since last</p>
                        <p className={clsx('text-base font-bold', cadence.daysSinceLast <= 7 ? 'text-green-700' : cadence.daysSinceLast <= 10 ? 'text-amber-700' : 'text-red-700')}>
                          {cadence.daysSinceLast}
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              </FadeUp>
            )}

          </motion.div>
        )}

        {/* ════════════════════════════════ LABS ════════════════════════════ */}
        {tab === 'labs' && (
          <motion.div key="labs"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
            className="space-y-5"
          >

            {/* HbA1c journey: lab-confirmed + GMI estimate */}
            {a1cTimeline.length > 1 && (
              <FadeUp>
                <Card>
                  <CardHeader
                    title="HbA1c Journey"
                    subtitle={daysSinceNormalA1c != null
                      ? `Lab-confirmed + estimated from glucose · Normal A1C was ${daysSinceNormalA1c} days ago`
                      : 'Lab-confirmed A1C + GMI estimated from glucose readings'}
                  />
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={a1cTimeline} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8d9b6" strokeOpacity={0.5} />
                      <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#78614a' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#78614a' }} tickLine={false} axisLine={false} domain={[4, 'auto']} />
                      <Tooltip content={<ChartTooltip />} />
                      <ReferenceLine y={5.7} stroke="#d97706" strokeDasharray="4 2" label={{ value: 'Pre-DM 5.7', fill: '#92521b', fontSize: 8, position: 'insideTopLeft' }} />
                      <ReferenceLine y={6.5} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'DM 6.5', fill: '#dc2626', fontSize: 8, position: 'insideTopLeft' }} />
                      <Legend wrapperStyle={{ fontSize: 10, color: '#78614a', paddingTop: 4 }} />
                      <Line
                        type="monotone" dataKey="labA1c" name="Lab HbA1c" unit="%" connectNulls={false}
                        stroke="#7c3aed" strokeWidth={2.5}
                        dot={{ r: 5, fill: '#7c3aed', strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone" dataKey="gmi" name="GMI (est.)" unit="%" connectNulls
                        stroke="#5fa8d3" strokeWidth={1.5} strokeDasharray="4 2"
                        dot={false} activeDot={{ r: 4, fill: '#5fa8d3' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-1 flex-wrap text-[10px] text-wood-500">
                    <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-violet-600 inline-block rounded" /> Lab-confirmed (purple dots)</span>
                    <span className="flex items-center gap-1.5"><span className="w-4 h-px border-t-2 border-dashed border-blue-400 inline-block" /> GMI estimated from glucose avg (dashed)</span>
                  </div>
                </Card>
              </FadeUp>
            )}

            {/* Lab flag trend */}
            {flagTrend.length > 1 && (
              <FadeUp delay={0.06}>
                <Card>
                  <CardHeader title="Abnormal Lab Values Over Time" subtitle="Fewer H/L flags = your labs are normalizing" />
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={flagTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8d9b6" strokeOpacity={0.5} vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#78614a' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#78614a' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="H" name="High (H)" stackId="a" fill="#ef4444" fillOpacity={0.75} radius={[0,0,0,0]} />
                      <Bar dataKey="L" name="Low (L)"  stackId="a" fill="#3b82f6" fillOpacity={0.75} radius={[3,3,0,0]} />
                      <Bar dataKey="normal" name="Normal" stackId="a" fill="#16a34a" fillOpacity={0.35} radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-3 mt-2 text-[10px]">
                    {(() => {
                      const first = flagTrend[0]
                      const last  = flagTrend[flagTrend.length - 1]
                      const firstFlags = first.H + first.L
                      const lastFlags  = last.H  + last.L
                      const delta = lastFlags - firstFlags
                      return delta < 0
                        ? <span className="text-green-700">{Math.abs(delta)} fewer abnormal values vs first visit — labs are improving</span>
                        : delta > 0
                        ? <span className="text-red-700">{delta} more abnormal values vs first visit</span>
                        : <span className="text-wood-500">Same number of abnormal values as first visit</span>
                    })()}
                  </div>
                </Card>
              </FadeUp>
            )}

            {/* Metabolic status panel */}
            {biomarkers.some(b => b.value != null) && (
              <FadeUp delay={0.1}>
                <Card>
                  <CardHeader title="Metabolic Biomarker Status" subtitle="Latest values from lab records" />
                  <div className="grid grid-cols-2 gap-2">
                    {biomarkers.filter(b => b.value != null).map(b => {
                      const isH = b.flag === 'H' || b.flag === 'HH'
                      const isL = b.flag === 'L' || b.flag === 'LL'
                      const isNormal = !b.flag
                      return (
                        <div key={b.label} className={clsx(
                          'rounded-2xl p-3 border flex flex-col gap-1',
                          isH ? 'bg-red-50 border-red-200' : isL ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                        )}>
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-wood-600">{b.label}</p>
                            <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                              isH ? 'bg-red-100 text-red-700' : isL ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            )}>
                              {isH ? 'HIGH' : isL ? 'LOW' : 'NORMAL'}
                            </span>
                          </div>
                          <p className={clsx('text-xl font-bold tabular-nums',
                            isH ? 'text-red-700' : isL ? 'text-blue-700' : 'text-green-700'
                          )}>
                            {b.value} <span className="text-xs font-normal text-wood-500">{b.unit}</span>
                          </p>
                          <p className="text-[10px] text-wood-400">{fmtDate(b.date)}</p>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </FadeUp>
            )}

          </motion.div>
        )}

        {/* ════════════════════════════════ EXPORT ══════════════════════════ */}
        {tab === 'export' && (
          <motion.div key="export"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <FadeUp>
              <Card>
                <CardHeader title="Export Data" subtitle="Download your data in various formats" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-wood-50 rounded-xl border border-wood-200/50">
                    <div className="flex items-center gap-2.5">
                      <FileText size={16} className="text-brand-500" />
                      <div>
                        <p className="text-sm font-medium text-wood-900">Full Backup (JSON)</p>
                        <p className="text-xs text-wood-500">All data — use for backup & restore</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={handleFullExport}><Download size={14} /> Export</Button>
                  </div>
                  {[
                    { label: 'Glucose Readings',  desc: 'All readings as CSV',  icon: Droplets, fn: handleGlucoseCSV,   count: glu.length  },
                    { label: 'Injection History', desc: 'All injections as CSV', icon: Syringe,  fn: handleInjectionCSV, count: inj.length  },
                    { label: 'Weight Log',         desc: 'Weight history as CSV', icon: Scale,    fn: handleWeightCSV,   count: wts.length  },
                  ].map(({ label, desc, icon: Icon, fn, count }) => (
                    <div key={label} className="flex items-center justify-between p-3 bg-wood-50 rounded-xl border border-wood-200/50">
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className="text-wood-500" />
                        <div>
                          <p className="text-sm font-medium text-wood-900">{label}</p>
                          <p className="text-xs text-wood-500">{desc} · {count} records</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={fn}><Download size={14} /> CSV</Button>
                    </div>
                  ))}
                </div>
              </Card>
            </FadeUp>

            <FadeUp delay={0.06}>
              <Card>
                <CardHeader title="Import Data" />
                <p className="text-xs text-wood-500 mb-3">
                  Restore from a previous JSON backup. <strong>This will replace all existing data.</strong>
                </p>
                <Button variant="outline" onClick={() => setShowImportModal(true)}>
                  <Upload size={16} /> Import Backup
                </Button>
              </Card>
            </FadeUp>
          </motion.div>
        )}

      </AnimatePresence>

      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Backup" size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-red-50 rounded-xl text-xs text-red-700 border border-red-200">
            ⚠️ Importing will replace ALL existing data. Export a backup first if needed.
          </div>
          <input type="file" accept=".json" onChange={e => setImportFile(e.target.files[0])}
            className="block w-full text-sm text-wood-700" />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowImportModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleImport}>Import & Replace</Button>
          </div>
        </div>
      </Modal>
    </div>
    </PageHero>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────
function labEntry(lab) {
  return {
    value: lab?.value ?? null,
    unit:  lab?.unit  ?? '',
    flag:  lab?.flag  ?? '',
    date:  lab?.collectedDate ?? null,
  }
}
