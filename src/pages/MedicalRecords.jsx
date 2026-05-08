import { useState, useMemo } from 'react'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { api } from '../api/client'
import { useQuery } from '../hooks/useQuery'
import Card, { CardHeader } from '../components/ui/Card'
import { Stagger, StaggerItem, FadeUp } from '../components/motion/primitives'
import {
  Activity, FlaskConical, Pill, Stethoscope, ClipboardList,
  TrendingUp, TrendingDown, CheckCircle,
  ChevronDown, ChevronUp, Database,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—'
  try { return format(parseISO(d), 'MMM d, yyyy') } catch { return d }
}
function fmtShort(d) {
  if (!d) return ''
  try { return format(parseISO(d), 'MMM yyyy') } catch { return d }
}

function flagColor(flag) {
  if (flag === 'H' || flag === 'HH') return { text: 'text-red-700',   bg: 'bg-red-50',   pill: 'bg-red-100 text-red-700',   border: 'border-red-200' }
  if (flag === 'L' || flag === 'LL') return { text: 'text-blue-700',  bg: 'bg-blue-50',  pill: 'bg-blue-100 text-blue-700',  border: 'border-blue-200' }
  return                                    { text: 'text-wood-700',   bg: 'bg-wood-50',  pill: 'bg-wood-100 text-wood-700',  border: 'border-wood-200/60' }
}

function FlagIcon({ flag }) {
  if (flag === 'H' || flag === 'HH') return <TrendingUp size={12} className="text-red-500" />
  if (flag === 'L' || flag === 'LL') return <TrendingDown size={12} className="text-blue-500" />
  return <CheckCircle size={12} className="text-green-500" />
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview',  icon: Activity },
  { id: 'labs',     label: 'Labs',      icon: FlaskConical },
  { id: 'history',  label: 'History',   icon: ClipboardList },
]

// ── Lab panels we care about for charting ─────────────────────────────────────
const CHART_TESTS = ['HbA1c', 'Glucose', 'Triglycerides', 'HDL', 'LDL', 'ALT', 'AST', 'Creatinine']

const PANEL_ORDER = ['HbA1c', 'Glucose', 'Lipid', 'CBC', 'CMP', 'Thyroid', 'Other']

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#fffaf3] border border-wood-200/60 rounded-xl shadow-tile px-3 py-2 text-xs">
      <p className="font-semibold text-wood-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value} {p.unit || ''}
        </p>
      ))}
    </div>
  )
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, value, unit, flag, sub }) {
  const c = flagColor(flag)
  return (
    <div className={clsx('rounded-2xl p-3.5 flex flex-col gap-1 border', c.bg, c.border)}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-wood-500">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={clsx('text-2xl font-bold', c.text)}>{value ?? '—'}</span>
        {unit && <span className="text-xs text-wood-500">{unit}</span>}
        {flag && flag !== '' && (
          <span className={clsx('text-[9px] font-bold px-1 py-0.5 rounded ml-1', c.pill)}>{flag}</span>
        )}
      </div>
      {sub && <p className="text-[10px] text-wood-500">{sub}</p>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MedicalRecords() {
  const [tab, setTab] = useState('overview')
  const [labPanel, setLabPanel] = useState('All')

  const { data: vitalsRaw }      = useQuery(api.getMedicalVitals)
  const { data: labsRaw }        = useQuery(api.getMedicalLabs)
  const { data: diagnosesRaw }   = useQuery(api.getMedicalDiagnoses)
  const { data: medicationsRaw } = useQuery(api.getMedicalMedications)
  const { data: proceduresRaw }  = useQuery(api.getMedicalProcedures)

  const vitals      = vitalsRaw      ?? []
  const labs        = labsRaw        ?? []
  const diagnoses   = diagnosesRaw   ?? []
  const medications = medicationsRaw ?? []
  const procedures  = proceduresRaw  ?? []

  const hasData = vitals.length || labs.length || diagnoses.length || medications.length || procedures.length

  // Key stats: latest HbA1c, latest fasting glucose, latest weight
  const latestHbA1c = useMemo(() => {
    const rows = labs.filter(l => l.testName === 'HbA1c').sort((a, b) => b.collectedDate.localeCompare(a.collectedDate))
    return rows[0] ?? null
  }, [labs])

  const latestGlucose = useMemo(() => {
    const rows = labs.filter(l => l.testName === 'Glucose').sort((a, b) => b.collectedDate.localeCompare(a.collectedDate))
    return rows[0] ?? null
  }, [labs])

  const latestWeight = useMemo(() => {
    if (!vitals.length) return null
    return [...vitals].sort((a, b) => b.visitDate.localeCompare(a.visitDate))[0]
  }, [vitals])

  const latestALT = useMemo(() => {
    const rows = labs.filter(l => l.testName === 'ALT').sort((a, b) => b.collectedDate.localeCompare(a.collectedDate))
    return rows[0] ?? null
  }, [labs])

  // Weight chart data
  const weightChartData = useMemo(() => vitals.map(v => ({
    date: fmtShort(v.visitDate),
    rawDate: v.visitDate,
    weight: v.weightLbs ? Math.round(v.weightLbs * 10) / 10 : null,
  })).filter(d => d.weight !== null), [vitals])

  // HbA1c trend
  const a1cChartData = useMemo(() =>
    labs.filter(l => l.testName === 'HbA1c' && l.value !== null)
      .map(l => ({ date: fmtShort(l.collectedDate), rawDate: l.collectedDate, value: l.value })),
    [labs])

  // Glucose trend
  const glucoseChartData = useMemo(() =>
    labs.filter(l => l.testName === 'Glucose' && l.value !== null)
      .map(l => ({ date: fmtShort(l.collectedDate), rawDate: l.collectedDate, value: l.value })),
    [labs])

  // Lipid trend
  const lipidChartData = useMemo(() => {
    const dates = [...new Set(labs.filter(l => l.panel === 'Lipid').map(l => l.collectedDate))].sort()
    return dates.map(d => {
      const row = { date: fmtShort(d), rawDate: d }
      for (const test of ['Triglycerides', 'HDL', 'LDL', 'Total Cholesterol']) {
        const match = labs.find(l => l.collectedDate === d && l.testName === test)
        if (match?.value !== null) row[test] = match?.value
      }
      return row
    })
  }, [labs])

  // Liver enzyme trend
  const liverChartData = useMemo(() => {
    const dates = [...new Set(labs.filter(l => l.testName === 'ALT' || l.testName === 'AST').map(l => l.collectedDate))].sort()
    return dates.map(d => {
      const row = { date: fmtShort(d), rawDate: d }
      for (const test of ['ALT', 'AST']) {
        const match = labs.find(l => l.collectedDate === d && l.testName === test)
        if (match?.value !== null) row[test] = match?.value
      }
      return row
    })
  }, [labs])

  // Labs grouped by panel for the Labs tab
  const labsByPanel = useMemo(() => {
    const panels = {}
    for (const l of labs) {
      if (!panels[l.panel]) panels[l.panel] = {}
      if (!panels[l.panel][l.testName]) panels[l.panel][l.testName] = []
      panels[l.panel][l.testName].push(l)
    }
    return panels
  }, [labs])

  const availablePanels = useMemo(() =>
    ['All', ...PANEL_ORDER.filter(p => labsByPanel[p])],
    [labsByPanel])

  const filteredLabsByPanel = useMemo(() => {
    if (labPanel === 'All') return labsByPanel
    return labsByPanel[labPanel] ? { [labPanel]: labsByPanel[labPanel] } : {}
  }, [labsByPanel, labPanel])

  if (!hasData) {
    return (
      <div className="space-y-6">
        <FadeUp>
          <Card>
            <div className="text-center py-10">
              <Database size={36} className="text-wood-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-wood-700">No medical records yet</p>
              <p className="text-xs text-wood-500 mt-1.5 max-w-xs mx-auto">
                Run the seed script to import your lab results, vitals, and history from your medical records.
              </p>
              <code className="mt-4 inline-block text-[11px] bg-wood-100 text-wood-800 px-3 py-2 rounded-lg">
                node scripts/seed-medical-records.mjs
              </code>
            </div>
          </Card>
        </FadeUp>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <FadeUp>
        <div className="flex gap-1 p-1 bg-wood-100/60 rounded-2xl">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all',
                tab === id
                  ? 'bg-[#fffaf3] shadow-tile text-wood-900'
                  : 'text-wood-500 hover:text-wood-700'
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </FadeUp>

      <AnimatePresence mode="wait">
        {tab === 'overview' && (
          <motion.div key="overview"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Key metrics */}
            <FadeUp delay={0.05}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-wood-600 mb-2 px-1">
                Latest Results
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {latestHbA1c && (
                  <StatPill
                    label="HbA1c"
                    value={latestHbA1c.value}
                    unit="%"
                    flag={latestHbA1c.flag}
                    sub={fmtDate(latestHbA1c.collectedDate)}
                  />
                )}
                {latestGlucose && (
                  <StatPill
                    label="Glucose"
                    value={latestGlucose.value}
                    unit="mg/dL"
                    flag={latestGlucose.flag}
                    sub={fmtDate(latestGlucose.collectedDate)}
                  />
                )}
                {latestWeight && (
                  <StatPill
                    label="Weight"
                    value={latestWeight.weightLbs ? Math.round(latestWeight.weightLbs * 10) / 10 : null}
                    unit="lbs"
                    flag=""
                    sub={fmtDate(latestWeight.visitDate)}
                  />
                )}
                {latestALT && (
                  <StatPill
                    label="ALT (Liver)"
                    value={latestALT.value}
                    unit="U/L"
                    flag={latestALT.flag}
                    sub={fmtDate(latestALT.collectedDate)}
                  />
                )}
              </div>
            </FadeUp>

            {/* Weight over time — full area chart */}
            {weightChartData.length > 1 && (
              <FadeUp delay={0.1}>
                <Card>
                  <CardHeader title="Weight History" subtitle="All recorded visits" />
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={weightChartData} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#d97706" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8d9b6" strokeOpacity={0.6} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#78614a' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#78614a' }} tickLine={false} axisLine={false}
                        domain={['auto', 'auto']} tickFormatter={v => `${v}`} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="weight" name="Weight" unit=" lbs"
                        stroke="#d97706" strokeWidth={2} fill="url(#wGrad)" dot={{ r: 4, fill: '#d97706', strokeWidth: 0 }}
                        activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              </FadeUp>
            )}

            {/* HbA1c trend */}
            {a1cChartData.length > 1 && (
              <FadeUp delay={0.14}>
                <Card>
                  <CardHeader title="HbA1c Trend" subtitle="Glycated hemoglobin over time" />
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={a1cChartData} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8d9b6" strokeOpacity={0.6} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#78614a' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#78614a' }} tickLine={false} axisLine={false}
                        domain={[4, 'auto']} />
                      <Tooltip content={<ChartTooltip />} />
                      <ReferenceLine y={5.7} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Pre-DM', fill: '#92521b', fontSize: 9 }} />
                      <ReferenceLine y={6.5} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'DM', fill: '#dc2626', fontSize: 9 }} />
                      <Line type="monotone" dataKey="value" name="HbA1c" unit="%"
                        stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 5, fill: '#7c3aed', strokeWidth: 0 }}
                        activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex gap-3 mt-2 px-1">
                    <span className="text-[10px] text-wood-500">Normal: &lt;5.7%</span>
                    <span className="text-[10px] text-amber-600">Prediabetes: 5.7–6.4%</span>
                    <span className="text-[10px] text-red-600">Diabetes: ≥6.5%</span>
                  </div>
                </Card>
              </FadeUp>
            )}

            {/* Lipid trend */}
            {lipidChartData.length > 1 && (
              <FadeUp delay={0.18}>
                <Card>
                  <CardHeader title="Lipid Panel" subtitle="Triglycerides, HDL & LDL over time" />
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={lipidChartData} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8d9b6" strokeOpacity={0.6} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#78614a' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#78614a' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 10, color: '#78614a', paddingTop: 4 }} />
                      <Line type="monotone" dataKey="Triglycerides" unit=" mg/dL" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }} />
                      <Line type="monotone" dataKey="HDL" unit=" mg/dL" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }} />
                      <Line type="monotone" dataKey="LDL" unit=" mg/dL" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </FadeUp>
            )}

            {/* Liver enzyme trend */}
            {liverChartData.length > 1 && (
              <FadeUp delay={0.22}>
                <Card>
                  <CardHeader title="Liver Enzymes" subtitle="ALT & AST over time" />
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={liverChartData} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8d9b6" strokeOpacity={0.6} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#78614a' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#78614a' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 10, color: '#78614a', paddingTop: 4 }} />
                      <ReferenceLine y={44} stroke="#f59e0b" strokeDasharray="4 2" />
                      <Line type="monotone" dataKey="ALT" unit=" U/L" stroke="#d97706" strokeWidth={2} dot={{ r: 3, fill: '#d97706', strokeWidth: 0 }} />
                      <Line type="monotone" dataKey="AST" unit=" U/L" stroke="#92400e" strokeWidth={2} dot={{ r: 3, fill: '#92400e', strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </FadeUp>
            )}
          </motion.div>
        )}

        {tab === 'labs' && (
          <motion.div key="labs"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Panel filter */}
            <FadeUp>
              <div className="flex gap-1.5 flex-wrap">
                {availablePanels.map(p => (
                  <button key={p} onClick={() => setLabPanel(p)}
                    className={clsx(
                      'text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all',
                      labPanel === p
                        ? 'bg-brand-600 text-white'
                        : 'bg-wood-100 text-wood-600 hover:bg-wood-200'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </FadeUp>

            {/* Lab results by panel */}
            {Object.entries(filteredLabsByPanel).map(([panel, tests], pi) => (
              <FadeUp key={panel} delay={pi * 0.04}>
                <Card>
                  <CardHeader title={panel === 'CMP' ? 'Comprehensive Metabolic Panel' :
                    panel === 'CBC' ? 'Complete Blood Count' :
                    panel === 'HbA1c' ? 'HbA1c / Glycated Hemoglobin' :
                    panel + ' Panel'} />
                  <div className="space-y-4">
                    {Object.entries(tests).map(([testName, rows]) => (
                      <LabTestRows key={testName} testName={testName} rows={rows} />
                    ))}
                  </div>
                </Card>
              </FadeUp>
            ))}
          </motion.div>
        )}

        {tab === 'history' && (
          <motion.div key="history"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Diagnoses */}
            {diagnoses.length > 0 && (
              <FadeUp delay={0.05}>
                <Card>
                  <CardHeader title="Diagnoses" />
                  <Stagger className="divide-y divide-wood-200/40">
                    {diagnoses.map(d => (
                      <StaggerItem key={d.id}>
                        <div className="py-3 flex items-start gap-3">
                          <div className={clsx(
                            'mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                            d.status === 'active' ? 'bg-red-50' : 'bg-wood-100'
                          )}>
                            <Stethoscope size={15} className={d.status === 'active' ? 'text-red-600' : 'text-wood-500'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-wood-900">{d.name}</p>
                            {d.icd10 && <p className="text-[10px] font-mono text-wood-500 mt-0.5">{d.icd10}</p>}
                            <div className="flex flex-wrap gap-2 mt-1">
                              {d.onsetDate && (
                                <span className="text-[11px] text-wood-600">
                                  Onset: {fmtDate(d.onsetDate)}
                                </span>
                              )}
                              {d.resolvedDate && (
                                <span className="text-[11px] text-green-700">
                                  Resolved: {fmtDate(d.resolvedDate)}
                                </span>
                              )}
                            </div>
                            {d.notes && <p className="text-xs text-wood-500 mt-1">{d.notes}</p>}
                          </div>
                          <span className={clsx(
                            'text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                            d.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-wood-100 text-wood-600'
                          )}>
                            {d.status}
                          </span>
                        </div>
                      </StaggerItem>
                    ))}
                  </Stagger>
                </Card>
              </FadeUp>
            )}

            {/* Medications */}
            {medications.length > 0 && (
              <FadeUp delay={0.08}>
                <Card>
                  <CardHeader title="Medications" />
                  <Stagger className="divide-y divide-wood-200/40">
                    {medications.map(m => (
                      <StaggerItem key={m.id}>
                        <div className="py-3 flex items-start gap-3">
                          <div className={clsx(
                            'mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                            m.status === 'active' ? 'bg-green-50' : 'bg-wood-100'
                          )}>
                            <Pill size={15} className={m.status === 'active' ? 'text-green-600' : 'text-wood-400'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-wood-900">{m.name}</p>
                            {m.dosage && <p className="text-xs text-wood-600 mt-0.5">{m.dosage}</p>}
                            {m.instructions && <p className="text-xs text-wood-500 mt-0.5">{m.instructions}</p>}
                            <div className="flex flex-wrap gap-2 mt-1">
                              {m.startDate && (
                                <span className="text-[11px] text-wood-600">
                                  Started: {fmtDate(m.startDate)}
                                </span>
                              )}
                              {m.endDate && (
                                <span className="text-[11px] text-wood-500">
                                  Ended: {fmtDate(m.endDate)}
                                </span>
                              )}
                            </div>
                            {m.reason && <p className="text-[11px] text-wood-500 mt-1">For: {m.reason}</p>}
                            {m.prescriber && <p className="text-[11px] text-wood-400 mt-0.5">Rx: {m.prescriber}</p>}
                          </div>
                          <span className={clsx(
                            'text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                            m.status === 'active'      ? 'bg-green-100 text-green-700'
                            : m.status === 'completed' ? 'bg-wood-100 text-wood-600'
                            : 'bg-wood-100 text-wood-500'
                          )}>
                            {m.status}
                          </span>
                        </div>
                      </StaggerItem>
                    ))}
                  </Stagger>
                </Card>
              </FadeUp>
            )}

            {/* Procedures */}
            {procedures.length > 0 && (
              <FadeUp delay={0.12}>
                <Card>
                  <CardHeader title="Procedures" />
                  <Stagger className="divide-y divide-wood-200/40">
                    {procedures.map(p => (
                      <StaggerItem key={p.id}>
                        <div className="py-3 flex items-start gap-3">
                          <div className="mt-0.5 w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <Activity size={15} className="text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-wood-900">{p.name}</p>
                            <p className="text-[11px] text-wood-600 mt-0.5">{fmtDate(p.procedureDate)}</p>
                            {p.provider && <p className="text-[11px] text-wood-500 mt-0.5">By: {p.provider}</p>}
                            {p.facility && <p className="text-[11px] text-wood-400">{p.facility}</p>}
                            {p.notes && <p className="text-xs text-wood-500 mt-1">{p.notes}</p>}
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0">
                            {p.status}
                          </span>
                        </div>
                      </StaggerItem>
                    ))}
                  </Stagger>
                </Card>
              </FadeUp>
            )}

            {/* Vitals table */}
            {vitals.length > 0 && (
              <FadeUp delay={0.16}>
                <Card>
                  <CardHeader title="Visit Vitals" subtitle="Weight & measurements per visit" />
                  <div className="overflow-x-auto -mx-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-wood-200/60">
                          <th className="text-left py-2 px-3 font-semibold text-wood-600">Date</th>
                          <th className="text-right py-2 px-3 font-semibold text-wood-600">Weight</th>
                          <th className="text-right py-2 px-3 font-semibold text-wood-600">BP</th>
                          <th className="text-right py-2 px-3 font-semibold text-wood-600">HR</th>
                          <th className="text-right py-2 px-3 font-semibold text-wood-600">SpO₂</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-wood-200/30">
                        {[...vitals].reverse().map(v => (
                          <tr key={v.id} className="hover:bg-wood-50/50 transition-colors">
                            <td className="py-2.5 px-3 text-wood-800 font-medium">{fmtDate(v.visitDate)}</td>
                            <td className="py-2.5 px-3 text-right text-wood-700">
                              {v.weightLbs ? `${Math.round(v.weightLbs * 10) / 10} lbs` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right text-wood-700">
                              {v.bpSystolic ? `${v.bpSystolic}/${v.bpDiastolic}` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right text-wood-700">
                              {v.heartRate ? `${v.heartRate} bpm` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right text-wood-700">
                              {v.spO2 ? `${v.spO2}%` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </FadeUp>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Lab test rows — shows all collected values for one test across time ────────
function LabTestRows({ testName, rows }) {
  const [expanded, setExpanded] = useState(false)
  const sorted = [...rows].sort((a, b) => b.collectedDate.localeCompare(a.collectedDate))
  const latest = sorted[0]
  const c = flagColor(latest?.flag)

  return (
    <div>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 group"
      >
        <div className={clsx('w-2 h-2 rounded-full shrink-0', {
          'bg-red-400': latest?.flag === 'H' || latest?.flag === 'HH',
          'bg-blue-400': latest?.flag === 'L' || latest?.flag === 'LL',
          'bg-green-400': !latest?.flag,
        })} />
        <span className="text-sm font-semibold text-wood-900 flex-1 text-left">{testName}</span>
        <div className="flex items-center gap-1.5">
          <span className={clsx('text-sm font-bold', c.text)}>
            {latest?.value ?? latest?.valueText ?? '—'} {latest?.unit || ''}
          </span>
          {latest?.flag && (
            <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded-full', c.pill)}>
              {latest.flag}
            </span>
          )}
          <FlagIcon flag={latest?.flag} />
        </div>
        {sorted.length > 1 && (
          expanded ? <ChevronUp size={14} className="text-wood-400 shrink-0" />
                   : <ChevronDown size={14} className="text-wood-400 shrink-0" />
        )}
      </button>

      {/* Reference range */}
      {latest?.refText && (
        <p className="text-[10px] text-wood-400 mt-0.5 ml-4">
          Ref: {latest.refText}
        </p>
      )}

      {/* History rows */}
      <AnimatePresence>
        {expanded && sorted.length > 1 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-2 ml-4 space-y-1.5 pb-1">
              {sorted.map(r => {
                const rc = flagColor(r.flag)
                return (
                  <div key={r.id} className={clsx('flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs', rc.bg, rc.border)}>
                    <span className="text-wood-600">{fmtDate(r.collectedDate)}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={clsx('font-semibold', rc.text)}>
                        {r.value ?? r.valueText ?? '—'} {r.unit || ''}
                      </span>
                      {r.flag && (
                        <span className={clsx('text-[9px] font-bold px-1 py-0.5 rounded-full', rc.pill)}>
                          {r.flag}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
