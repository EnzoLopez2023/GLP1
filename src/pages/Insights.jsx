import { useMemo } from 'react'
import PageHero from '../components/motion/PageHero'
import { api } from '../api/client'
import { useQuery } from '../hooks/useQuery'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Legend, Cell,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import Card, { CardHeader } from '../components/ui/Card'
import {
  Lightbulb, TrendingDown, TrendingUp, AlertTriangle, CheckCircle,
  Target, Syringe, Activity,
} from 'lucide-react'
import {
  getDoseStages, currentStage, nextStage, weeksOnMedication,
  glucoseStats, glucoseTrend, weightStats, weightTrend, perStageStats,
  injectionCadence, generateInsights, doseExpectations, estimatedA1C,
} from '../utils/insights'

const STAGE_COLORS = ['#fef3c7', '#fed7aa', '#fecaca', '#ddd6fe', '#bfdbfe', '#bbf7d0']

export default function Insights() {
  const { data: profile }    = useQuery(api.getProfile)
  const { data: glucose }    = useQuery(() => api.getGlucose())
  const { data: injections } = useQuery(() => api.getInjections(500))
  const { data: weights }    = useQuery(api.getWeightLog)

  const stages = useMemo(() => getDoseStages(profile), [profile])

  const insights = useMemo(() => generateInsights({
    profile, glucose: glucose ?? [], weights: weights ?? [],
    injections: injections ?? [], stages,
  }), [profile, glucose, weights, injections, stages])

  const gStats = useMemo(() => glucoseStats(glucose ?? []), [glucose])
  const gTrend = useMemo(() => glucoseTrend(glucose ?? [], 8), [glucose])
  const wStats = useMemo(() => weightStats(weights ?? [], profile), [weights, profile])
  const wTrend = useMemo(() => weightTrend(weights ?? [], 14), [weights])
  const cadence = useMemo(() => injectionCadence(injections ?? []), [injections])
  const stageStats = useMemo(
    () => perStageStats({ stages, glucose: glucose ?? [], weights: weights ?? [], injections: injections ?? [] }),
    [stages, glucose, weights, injections]
  )

  const glucoseChartData = useMemo(() => buildGlucoseChartData(glucose ?? []), [glucose])
  const weightChartData  = useMemo(() => buildWeightChartData(weights ?? []), [weights])

  const cur = currentStage(stages)
  const nxt = nextStage(stages)
  const week = weeksOnMedication(profile)

  const a1c = estimatedA1C(gStats?.avg)

  const daysSince = (dateStr) => {
    if (!dateStr) return null
    const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    return d >= 0 ? d : null
  }
  const diagDays  = daysSince(profile?.diagnosisDate)
  const ketoDays  = daysSince(profile?.ketoStartDate)
  const glp1Days  = profile?.startDate ? daysSince(profile.startDate) : null

  const diagTs  = profile?.diagnosisDate  ? new Date(profile.diagnosisDate).getTime()  : null
  const ketoTs  = profile?.ketoStartDate  ? new Date(profile.ketoStartDate).getTime()  : null

  const hasAnyData = (glucose?.length || weights?.length || injections?.length)

  if (!hasAnyData) {
    return (
      <Card>
        <div className="text-center py-8">
          <Lightbulb size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-600">Not enough data yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Log injections, glucose readings, and weight to see insights.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <PageHero variant="insights">
    <div className="space-y-5">

      {/* ── Smart insight cards ─────────────────────────────────────────── */}
      {insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((ins, i) => <InsightCard key={i} ins={ins} />)}
        </div>
      )}

      {/* ── Journey Timeline ────────────────────────────────────────────── */}
      {(diagDays !== null || ketoDays !== null || glp1Days !== null) && (
        <Card>
          <CardHeader title="Your Journey" subtitle="Key milestones since you started" />
          <div className="grid grid-cols-3 gap-3">
            {diagDays !== null && (
              <div className="text-center p-3 bg-red-50 rounded-xl">
                <p className="text-2xl font-bold text-red-700">Day {diagDays}</p>
                <p className="text-xs text-red-600 font-medium mt-0.5">Since Diagnosis</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(profile.diagnosisDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
            )}
            {ketoDays !== null && (
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-700">Day {ketoDays}</p>
                <p className="text-xs text-green-600 font-medium mt-0.5">On Keto</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(profile.ketoStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
            )}
            {glp1Days !== null && (
              <div className="text-center p-3 bg-brand-50 rounded-xl">
                <p className="text-2xl font-bold text-brand-700">Day {glp1Days}</p>
                <p className="text-xs text-brand-600 font-medium mt-0.5">On {profile.medicationName ?? 'GLP-1'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(profile.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Estimated A1C ───────────────────────────────────────────────── */}
      {a1c !== null && gStats?.count >= 3 && (
        <Card>
          <CardHeader
            title="Estimated A1C"
            subtitle={`Calculated from your ${gStats.count} glucose readings · ADA eAG formula`}
          />
          <div className="flex items-end gap-4">
            <div>
              <p className="text-5xl font-bold tracking-tight" style={{
                color: a1c < 6.5 ? '#16a34a' : a1c < 7 ? '#ca8a04' : a1c < 8 ? '#ea580c' : '#dc2626'
              }}>{a1c}<span className="text-2xl font-semibold text-gray-400 ml-0.5">%</span></p>
              <p className="text-xs text-gray-500 mt-1">Based on avg glucose of {gStats.avg} mg/dL</p>
            </div>
            <div className="flex-1 space-y-1.5 pb-1">
              {[
                { label: 'Non-diabetic', range: '<5.7%', color: 'bg-green-500',  active: a1c < 5.7  },
                { label: 'Pre-diabetic', range: '5.7–6.4%', color: 'bg-yellow-400', active: a1c >= 5.7 && a1c < 6.5 },
                { label: 'Target (diabetic)', range: '<7.0%', color: 'bg-blue-400',  active: a1c >= 6.5 && a1c < 7  },
                { label: 'Above target',  range: '≥7.0%', color: 'bg-orange-400', active: a1c >= 7   },
              ].map(r => (
                <div key={r.label} className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1 ${r.active ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-400'}`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${r.color} ${r.active ? 'opacity-100' : 'opacity-30'}`} />
                  <span>{r.label}</span>
                  <span className="ml-auto">{r.range}</span>
                </div>
              ))}
            </div>
          </div>
          {gStats.fastingAvg && (
            <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
              Fasting avg: {gStats.fastingAvg} mg/dL → est. fasting A1C {estimatedA1C(gStats.fastingAvg)}% · This estimate improves as you log more readings.
            </p>
          )}
        </Card>
      )}

      {/* ── Dose Stage Progress ─────────────────────────────────────────── */}
      {stages.length > 0 && (
        <Card>
          <CardHeader
            title="Dose Stage Progress"
            subtitle={
              week
                ? `Week ${week} on ${profile.medicationName}`
                : 'Set your start date in Settings to enable this'
            }
          />
          <div className="space-y-2">
            {stages.map((s, i) => (
              <StageRow key={s.week} stage={s} color={STAGE_COLORS[i % STAGE_COLORS.length]} />
            ))}
          </div>
          {nxt && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-800 mb-1">
                Coming up: {nxt.label} on {format(nxt.startDate, 'MMM d')}
              </p>
              <p className="text-xs text-blue-700 leading-relaxed">
                {doseExpectations(profile?.medicationName, nxt.dose, true, cur?.dose)}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* ── Glucose journey ─────────────────────────────────────────────── */}
      {glucoseChartData.length >= 2 && (
        <Card>
          <CardHeader
            title="Glucose Journey (all time)"
            subtitle={
              gStats?.fastingCount
                ? `Fasting avg ${gStats.fastingAvg} · ${gStats.count} readings logged`
                : `${gStats?.count ?? 0} readings logged`
            }
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={glucoseChartData} margin={{ top: 8, right: 8, bottom: 4, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="ts"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  scale="time"
                  tickFormatter={t => format(new Date(t), 'MMM d')}
                  tick={{ fontSize: 10 }}
                  minTickGap={28}
                />
                <YAxis tick={{ fontSize: 10 }} domain={[40, 'auto']} />
                <Tooltip
                  labelFormatter={t => format(new Date(t), 'MMM d, yyyy')}
                  formatter={(v, name) => [`${v} mg/dL`, name]}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <ReferenceLine y={70}  stroke="#ef4444" strokeDasharray="2 4" label={{ value: 'low', fontSize: 9, fill: '#ef4444', position: 'right' }} />
                <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="2 4" label={{ value: '100', fontSize: 9, fill: '#16a34a', position: 'right' }} />
                <ReferenceLine y={180} stroke="#f97316" strokeDasharray="2 4" label={{ value: '180', fontSize: 9, fill: '#ea580c', position: 'right' }} />
                {diagTs && <ReferenceLine x={diagTs} stroke="#dc2626" strokeDasharray="4 2" label={{ value: 'Dx', fontSize: 9, fill: '#dc2626', position: 'top' }} />}
                {ketoTs && ketoTs !== diagTs && <ReferenceLine x={ketoTs} stroke="#16a34a" strokeDasharray="4 2" label={{ value: 'Keto', fontSize: 9, fill: '#16a34a', position: 'top' }} />}
                {/* Stage start markers */}
                {stages.filter(s => !s.isFuture).map(s => (
                  <ReferenceLine
                    key={s.week}
                    x={s.startDate.getTime()}
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    label={{ value: s.label, fontSize: 9, fill: '#475569', position: 'top' }}
                  />
                ))}
                <Line type="monotone" dataKey="all"     name="all"     stroke="#0ea5e9" strokeWidth={1.5} dot={{ r: 2 }} connectNulls />
                <Line type="monotone" dataKey="fasting" name="fasting" stroke="#dc2626" strokeWidth={2}   dot={{ r: 2.5 }} connectNulls />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {gTrend && (
            <p className={`text-xs mt-2 ${gTrend.direction === 'down' ? 'text-green-700' : gTrend.direction === 'up' ? 'text-orange-700' : 'text-gray-600'}`}>
              {gTrend.direction === 'down' && <TrendingDown size={12} className="inline mr-1" />}
              {gTrend.direction === 'up'   && <TrendingUp   size={12} className="inline mr-1" />}
              Recent {gTrend.windowSize} fastings: avg {gTrend.recentAvg} mg/dL
              {gTrend.direction !== 'flat' && ` (${gTrend.delta > 0 ? '+' : ''}${gTrend.delta.toFixed(0)} vs prior ${gTrend.windowSize})`}
            </p>
          )}
        </Card>
      )}

      {/* ── Weight journey ──────────────────────────────────────────────── */}
      {weightChartData.length >= 2 && (
        <Card>
          <CardHeader
            title="Weight Journey (all time)"
            subtitle={
              wStats
                ? `${wStats.lost > 0 ? `−${wStats.lost}` : `+${Math.abs(wStats.lost)}`} lbs (${wStats.lostPct}%) over ${wStats.weeks} week${wStats.weeks===1?'':'s'}`
                : ''
            }
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightChartData} margin={{ top: 8, right: 8, bottom: 4, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="ts"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  scale="time"
                  tickFormatter={t => format(new Date(t), 'MMM d')}
                  tick={{ fontSize: 10 }}
                  minTickGap={28}
                />
                <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip
                  labelFormatter={t => format(new Date(t), 'MMM d, yyyy')}
                  formatter={v => [`${v} lbs`, 'weight']}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                {profile?.goalWeightLbs && (
                  <ReferenceLine
                    y={profile.goalWeightLbs}
                    stroke="#16a34a"
                    strokeDasharray="3 3"
                    label={{ value: `goal ${profile.goalWeightLbs}`, fontSize: 9, fill: '#15803d', position: 'right' }}
                  />
                )}
                {diagTs && <ReferenceLine x={diagTs} stroke="#dc2626" strokeDasharray="4 2" label={{ value: 'Dx', fontSize: 9, fill: '#dc2626', position: 'top' }} />}
                {ketoTs && ketoTs !== diagTs && <ReferenceLine x={ketoTs} stroke="#16a34a" strokeDasharray="4 2" label={{ value: 'Keto', fontSize: 9, fill: '#16a34a', position: 'top' }} />}
                {stages.filter(s => !s.isFuture).map(s => (
                  <ReferenceLine
                    key={s.week}
                    x={s.startDate.getTime()}
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    label={{ value: s.label, fontSize: 9, fill: '#475569', position: 'top' }}
                  />
                ))}
                <Line type="monotone" dataKey="weight" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 2.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {wTrend && Math.abs(wTrend.delta) > 0.1 && (
            <p className={`text-xs mt-2 ${wTrend.delta < 0 ? 'text-green-700' : 'text-orange-700'}`}>
              {wTrend.delta < 0 ? <TrendingDown size={12} className="inline mr-1" /> : <TrendingUp size={12} className="inline mr-1" />}
              Last {wTrend.windowDays} days: {wTrend.delta > 0 ? '+' : ''}{wTrend.delta} lbs
            </p>
          )}
        </Card>
      )}

      {/* ── Time in Range distribution ──────────────────────────────────── */}
      {gStats && gStats.count >= 5 && (
        <Card>
          <CardHeader
            title="Time in Range"
            subtitle={`${gStats.timeInRangePct}% of readings between 70–180 mg/dL`}
          />
          <div className="space-y-2">
            <DistRow label="Low (<70)"           color="bg-red-400"      count={gStats.distribution.low}    total={gStats.count} />
            <DistRow label="Normal (70–99)"      color="bg-green-500"    count={gStats.distribution.normal} total={gStats.count} />
            <DistRow label="Pre-diabetic (100–125)" color="bg-yellow-400" count={gStats.distribution.pre}    total={gStats.count} />
            <DistRow label="Elevated (126–180)"  color="bg-orange-400"   count={gStats.distribution.high}   total={gStats.count} />
            <DistRow label="High (>180)"         color="bg-red-600"      count={gStats.distribution.vhigh}  total={gStats.count} />
          </div>
        </Card>
      )}

      {/* ── Per-stage outcomes ──────────────────────────────────────────── */}
      {stageStats.some(s => s.glucoseCount || s.injectionCount || s.weightStart) && (
        <Card>
          <CardHeader
            title="Outcomes by Dose Stage"
            subtitle="What each dose has done for you so far"
          />
          <div className="space-y-2">
            {stageStats.map(s => (
              <StageOutcomeRow key={s.week} stage={s} medName={profile?.medicationName} />
            ))}
          </div>
        </Card>
      )}

      {/* ── Injection cadence ───────────────────────────────────────────── */}
      {cadence?.gaps?.length >= 2 && (
        <Card>
          <CardHeader
            title="Injection Cadence"
            subtitle={`${cadence.gaps.length + 1} injections logged · avg ${cadence.avgGap} days apart · ${cadence.onTimeRate}% on time (6–8 days)`}
          />
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cadence.gaps.slice(-12)} margin={{ top: 8, right: 8, bottom: 4, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => format(parseISO(d), 'MMM d')} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 'dataMax + 2']} />
                <Tooltip
                  formatter={(v, _, p) => [`${v} day${v===1?'':'s'}`, `gap (${p.payload.doseMg}mg)`]}
                  labelFormatter={d => format(parseISO(d), 'MMM d, yyyy')}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <ReferenceLine y={7} stroke="#16a34a" strokeDasharray="3 3" label={{ value: 'target 7d', fontSize: 9, fill: '#15803d' }} />
                <Bar dataKey="gapDays" radius={[4, 4, 0, 0]}>
                  {cadence.gaps.slice(-12).map((g, i) => (
                    <Cell key={i} fill={g.gapDays >= 6 && g.gapDays <= 8 ? '#22c55e' : g.gapDays > 8 ? '#f97316' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

    </div>
    </PageHero>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────
function InsightCard({ ins }) {
  const cls = ins.type === 'positive' ? 'border-green-200  bg-green-50'  :
              ins.type === 'warning'  ? 'border-orange-200 bg-orange-50' :
              'border-blue-200 bg-blue-50'
  const Icon = ins.type === 'positive' ? CheckCircle : ins.type === 'warning' ? AlertTriangle : Lightbulb
  const iconCls = ins.type === 'positive' ? 'text-green-600' : ins.type === 'warning' ? 'text-orange-600' : 'text-blue-600'
  return (
    <Card className={cls}>
      <div className="flex items-start gap-3">
        <Icon size={18} className={`${iconCls} mt-0.5 shrink-0`} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">{ins.title}</p>
          <p className="text-xs text-gray-700 mt-1 leading-relaxed">{ins.body}</p>
          {ins.action && <p className="text-xs font-medium text-brand-600 mt-1.5">→ {ins.action}</p>}
        </div>
      </div>
    </Card>
  )
}

function StageRow({ stage, color }) {
  const status = stage.isCurrent ? 'current' : stage.isPast ? 'past' : 'future'
  const dateLine = stage.endDate
    ? `${format(stage.startDate, 'MMM d')} – ${format(stage.endDate, 'MMM d')}`
    : `${format(stage.startDate, 'MMM d')} →`
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
        status === 'current' ? 'border-brand-300 ring-2 ring-brand-100' : 'border-gray-100'
      }`}
      style={{ background: status === 'future' ? '#f9fafb' : color }}
    >
      <div className="shrink-0 w-12 text-center">
        <p className="text-[11px] font-semibold text-gray-700">Wk {stage.week}</p>
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-gray-800">{stage.label}</p>
        <p className="text-[11px] text-gray-600">{dateLine}</p>
      </div>
      {status === 'current' && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500 text-white">NOW</span>
      )}
      {status === 'past' && <CheckCircle size={14} className="text-green-600" />}
    </div>
  )
}

function StageOutcomeRow({ stage, medName }) {
  const isCurrent = stage.isCurrent
  return (
    <div className={`p-3 rounded-xl border ${isCurrent ? 'border-brand-300 bg-brand-50/40' : 'border-gray-100 bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-bold text-gray-800">{stage.label}</p>
          <p className="text-[11px] text-gray-500">
            {format(stage.startDate, 'MMM d')}
            {stage.endDate ? ` – ${format(stage.endDate, 'MMM d')}` : ' → ongoing'}
          </p>
        </div>
        {isCurrent && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500 text-white">NOW</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Fasting avg"    value={stage.fastingAvg ? `${stage.fastingAvg}` : '—'}    unit="mg/dL"    helpfulCount={stage.fastingCount} />
        <Stat label="Weight"         value={stage.weightLost != null ? (stage.weightLost > 0 ? `−${stage.weightLost}` : `+${Math.abs(stage.weightLost)}`) : '—'} unit="lbs" />
        <Stat label="Injections"     value={stage.injectionCount || '—'} unit="shots" />
      </div>
      {!stage.isCurrent && stage.fastingAvg == null && stage.weightStart == null && (
        <p className="text-[11px] text-gray-500 italic mt-2">No data logged during this stage</p>
      )}
      {stage.isCurrent && (
        <p className="text-[11px] text-blue-700 mt-2 leading-relaxed">
          {doseExpectations(medName, stage.dose, false)}
        </p>
      )}
    </div>
  )
}

function Stat({ label, value, unit, helpfulCount }) {
  return (
    <div>
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className="text-sm font-bold text-gray-800">
        {value} {value !== '—' && <span className="text-[10px] font-normal text-gray-400">{unit}</span>}
      </p>
      {helpfulCount != null && helpfulCount > 0 && value !== '—' && (
        <p className="text-[9px] text-gray-400">{helpfulCount} reading{helpfulCount===1?'':'s'}</p>
      )}
    </div>
  )
}

function DistRow({ label, color, count, total }) {
  const pct = total ? (count / total) * 100 : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-700">{label}</span>
        <span className="text-xs font-medium text-gray-800">{count} ({Math.round(pct)}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Chart data builders ─────────────────────────────────────────────────────
// Glucose: separate fasting + all-readings series. One row per reading, with
// `all` always set and `fasting` only when readingType === 'fasting'.
function buildGlucoseChartData(glucose) {
  if (!glucose?.length) return []
  return glucose
    .slice()
    .sort((a, b) => a.readingAt.localeCompare(b.readingAt))
    .map(r => ({
      ts:      new Date(r.readingAt).getTime(),
      all:     r.value,
      fasting: r.readingType === 'fasting' ? r.value : null,
    }))
}

function buildWeightChartData(weights) {
  if (!weights?.length) return []
  return weights
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(w => ({
      ts:     parseISO(w.date).getTime(),
      weight: w.weightLbs,
    }))
}
