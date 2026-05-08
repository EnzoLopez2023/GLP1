import { useNavigate } from 'react-router-dom'
import {
  Syringe, Droplets, Activity, Scale, Plus, Pill, Calendar, Star,
} from 'lucide-react'
import { api } from '../api/client'
import { useQuery } from '../hooks/useQuery'
import { glucoseStatus } from '../utils/constants'
import { humanRelative, daysSince, lastNDays } from '../utils/dateHelpers'
import { estimatedA1C } from '../utils/insights'
import Card, { CardHeader } from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import Button from '../components/ui/Button'
import {
  Stagger, StaggerItem, FadeUp, ChartReveal, CountUp, ease,
} from '../components/motion/primitives'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine,
} from 'recharts'

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: profile }    = useQuery(api.getProfile)
  const { data: settings }   = useQuery(api.getSettings)
  const { data: injections }  = useQuery(() => api.getInjections(1))
  const { data: glucoseList } = useQuery(() => api.getGlucose())
  const { data: nutrition }   = useQuery(api.getTodayNutrition)
  const { data: wellbeing }   = useQuery(api.getTodayWellbeing)
  const { data: weightLog }   = useQuery(api.getWeightLog)

  const trendChartData = useMemo(() => {
    const days   = lastNDays(30).reverse()
    const cutoff = days[0]
    const weightByDate = Object.fromEntries(
      (weightLog ?? [])
        .filter(w => w.date >= cutoff)
        .map(w => [w.date, w.weightLbs])
    )
    return days.map(date => {
      const dayReadings = (glucoseList ?? [])
        .filter(r => r.readingAt.startsWith(date))
      const latest = dayReadings.sort((a, b) => b.readingAt.localeCompare(a.readingAt))[0]
      return {
        label:   format(parseISO(date), 'MM/dd'),
        glucose: latest?.value ?? null,
        weight:  weightByDate[date] ?? null,
      }
    })
  }, [glucoseList, weightLog])

  const lastInj     = injections?.[0]
  const latestG     = glucoseList?.[0]
  const latestW     = (weightLog ?? []).slice().reverse()[0]
  const injDaysAgo  = lastInj ? daysSince(lastInj.injectedAt) : null
  const nextInjDays = injDaysAgo !== null ? Math.max(0, 7 - injDaysAgo) : null
  const injDue      = nextInjDays === 0
  const glucoseS    = latestG ? glucoseStatus(latestG.value, latestG.readingType) : null
  const proteinGoal = 120
  const waterGoal   = settings?.waterUnit === 'ml' ? 2500 : 80

  // ── Journey timeline data (days since milestones, A1C estimate, appt) ──
  const daysFrom = (dateStr) => {
    if (!dateStr) return null
    const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    return d >= 0 ? d : null
  }
  const diagDays = daysFrom(profile?.diagnosisDate)
  const ketoDays = daysFrom(profile?.ketoStartDate)
  const glp1Days = profile?.startDate       ? daysFrom(profile.startDate)       : null
  const apptDays = profile?.appointmentDate ? daysFrom(profile.appointmentDate) : null
  const apptFmt  = profile?.appointmentDate
    ? new Date(profile.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  const milestone = (() => {
    if (diagDays === 30)  return '🎉 1 month since diagnosis — you\'re doing this!'
    if (diagDays === 90)  return '🏆 3 months since diagnosis — major milestone!'
    if (glp1Days === 28)  return `🎉 1 month on ${profile?.medicationName ?? 'GLP-1'}!`
    if (glp1Days === 56)  return `⭐ 2 months on ${profile?.medicationName ?? 'GLP-1'}!`
    if (ketoDays === 30)  return '🥑 1 month on keto — your body has adapted!'
    if (ketoDays === 60)  return '🏅 2 months keto strong!'
    return null
  })()

  const avgGlucose = useMemo(() => {
    const vals = (glucoseList ?? []).map(r => r.value)
    return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null
  }, [glucoseList])
  const a1c = estimatedA1C(avgGlucose)

  const weightDelta = useMemo(() => {
    if (!weightLog?.length) return null
    const sorted = weightLog.slice().sort((a, b) => a.date.localeCompare(b.date))
    const last = sorted[sorted.length - 1]
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30)
    const cutoff = monthAgo.toISOString().slice(0, 10)
    const earlier = sorted.find(w => w.date >= cutoff) ?? sorted[0]
    if (!earlier || !last) return null
    return +(last.weightLbs - earlier.weightLbs).toFixed(1)
  }, [weightLog])

  const eyebrow = new Date()
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase()
    .replace(',', ' ·')

  return (
    <div className="space-y-5">

      {/* ── Greeting ────────────────────────────────────────────────────── */}
      <FadeUp delay={0.05}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-wood-600 mb-1.5">
          {eyebrow}
        </p>
        <h2 className="display text-3xl font-bold text-wood-900 leading-tight">
          Good {greeting()}, {profile?.name || 'Enzo'}
        </h2>
      </FadeUp>

      {/* ── Journey timeline widget ─────────────────────────────────────── */}
      {(diagDays !== null || glp1Days !== null) && (
        <FadeUp delay={0.1}>
          <Card onClick={() => navigate('/insights')}>
            {milestone && (
              <div className="flex items-center gap-2 text-xs font-medium text-brand-800 bg-brand-100/70 rounded-xl px-3 py-2 mb-3">
                <Star size={13} className="shrink-0" />{milestone}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {diagDays !== null && (
                <JourneyChip count={diagDays} label="Dx"
                  bg="#fce4d8" valueColor="#9a3412" labelColor="#c2410c" />
              )}
              {ketoDays !== null && (
                <JourneyChip count={ketoDays} label="Keto"
                  bg="#dde9d3" valueColor="#365314" labelColor="#4d7c0f" />
              )}
              {glp1Days !== null && (
                <JourneyChip
                  count={glp1Days}
                  label={profile?.medicationName?.split(' ')[0] ?? 'GLP-1'}
                  bg="#fbeed8" valueColor="#92521b" labelColor="#b86c1e"
                />
              )}
            </div>
            {(a1c !== null || (apptFmt && apptDays !== null)) && (
              <div className="flex items-center justify-between mt-2.5 gap-2">
                {a1c !== null && (
                  <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                    style={{ background: '#ede5f4', color: '#4c1d95' }}>
                    ~{a1c}% est. A1C
                  </span>
                )}
                {apptFmt && apptDays !== null && (
                  <div className="flex items-center gap-1.5 text-xs text-brand-700 font-medium ml-auto">
                    <Calendar size={12} />
                    {apptDays === 0 ? 'Appointment today!' :
                     apptDays > 0  ? `${apptDays}d until ${apptFmt} appointment` :
                                      `Appointment was ${Math.abs(apptDays)}d ago`}
                  </div>
                )}
              </div>
            )}
          </Card>
        </FadeUp>
      )}

      {/* ── 2x2 stat tiles (Image 391 layout) ─────────────────────────── */}
      <Stagger className="grid grid-cols-2 gap-3">
        {/* Next dose */}
        <StaggerItem>
          <Tile
            tone="meds"
            eyebrow={injDue ? 'INJECTION DUE' : 'NEXT DOSE'}
            title={
              injDue ? 'Today' :
              lastInj && nextInjDays != null
                ? formatNextDoseDay(lastInj.injectedAt)
                : 'Set up'
            }
            footnote={
              lastInj
                ? `${profile?.medicationName || lastInj.medicationName} · ${lastInj.doseMg ?? profile?.currentDoseMg} mg`
                : 'Add your first injection'
            }
            icon={<Pill size={14} />}
            iconColor="#c2410c"
            onClick={() => navigate('/medication')}
          />
        </StaggerItem>

        {/* Weight */}
        <StaggerItem>
          <Tile
            tone="weight"
            eyebrow="WEIGHT"
            title={latestW ? <CountUp value={latestW.weightLbs} decimals={1} /> : '—'}
            footnote={
              latestW
                ? `lb${weightDelta != null ? ` · ${weightDelta > 0 ? '+' : ''}${weightDelta} this month` : ''}`
                : 'Log your first weight'
            }
            icon={<Scale size={14} />}
            iconColor="#6d28d9"
            onClick={() => navigate('/progress')}
          />
        </StaggerItem>

        {/* Glucose */}
        <StaggerItem>
          <Tile
            tone="glucose"
            eyebrow="GLUCOSE"
            title={latestG ? <CountUp value={latestG.value} /> : '—'}
            footnote={
              latestG
                ? `mg/dL · ${glucoseS?.label?.toLowerCase?.() ?? 'logged'}`
                : 'Add your first reading'
            }
            icon={<Droplets size={14} />}
            iconColor="#0c4a6e"
            onClick={() => navigate('/glucose')}
          />
        </StaggerItem>

        {/* Well-being summary */}
        <StaggerItem>
          <Tile
            tone="active"
            eyebrow="WELL-BEING"
            title={wellbeing?.mood ? <CountUp value={wellbeing.mood} /> : '—'}
            footnote={
              wellbeing?.mood
                ? `mood today · ${wellbeing?.energy ? `energy ${wellbeing.energy}` : 'tap to update'}`
                : 'Log how you feel today'
            }
            icon={<Activity size={14} />}
            iconColor="#365314"
            onClick={() => navigate('/wellbeing')}
          />
        </StaggerItem>
      </Stagger>

      {/* ── Injection due nudge ─────────────────────────────────────────── */}
      {injDue && (
        <FadeUp delay={0.7}>
          <Card className="border-2 border-brand-300 bg-brand-50 cursor-pointer" onClick={() => navigate('/medication')}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-brand-100">
                <Syringe size={24} className="text-brand-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-wood-900">Injection due today</p>
                {lastInj && (
                  <p className="text-xs text-wood-600 mt-0.5">
                    Last: {humanRelative(lastInj.injectedAt)} · {lastInj.doseMg} mg {lastInj.medicationName}
                  </p>
                )}
              </div>
              <Button size="sm" onClick={e => { e.stopPropagation(); navigate('/medication') }}>
                Log Now
              </Button>
            </div>
          </Card>
        </FadeUp>
      )}

      {/* ── 30-day trend (split weight + glucose panels) ────────────────── */}
      {(glucoseList?.length > 0 || weightLog?.length > 0) && (
        <FadeUp delay={0.8}>
          <Card>
            <CardHeader title="30-Day Trend" />
            <ChartReveal loading={!glucoseList || !weightLog} height={210}>
              <div className="flex flex-col h-full">
                {/* Weight panel */}
                <p className="text-[11px] font-semibold mb-1" style={{ color: '#4c1d95' }}>Weight (lbs)</p>
                <div className="h-[80px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendChartData} syncId="trend30" margin={{ top: 2, right: 12, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8d9b6" vertical={false} />
                      <XAxis dataKey="label" hide />
                      <YAxis tick={{ fontSize: 9, fill: '#6e4f30' }} domain={['auto', 'auto']} tickCount={3} width={34} />
                      {profile?.goalWeightLbs && (
                        <ReferenceLine y={profile.goalWeightLbs} stroke="#16a34a" strokeDasharray="4 2" strokeWidth={1}
                          label={{ value: 'goal', position: 'insideTopRight', fontSize: 9, fill: '#16a34a', dy: -4 }} />
                      )}
                      <Tooltip
                        contentStyle={{ borderRadius: 12, fontSize: 11, background: '#fffaf3', border: '1px solid #e8d9b6', color: '#352719' }}
                        formatter={v => v != null ? [`${v} lbs`, 'Weight'] : ['—', 'Weight']}
                      />
                      <Line dataKey="weight" stroke="#9b7cc7" strokeWidth={2.5} dot={false} connectNulls type="monotone"
                        isAnimationActive animationDuration={1100} animationEasing="ease-out" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="border-t border-wood-200/60 my-3" />

                {/* Glucose panel */}
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[11px] font-semibold" style={{ color: '#0c4a6e' }}>Glucose (mg/dL)</p>
                  <span className="flex items-center gap-1 text-[10px] text-wood-500">
                    <span className="inline-block w-3 h-2 rounded-sm" style={{ background: 'rgba(34,197,94,0.3)' }} />
                    normal range
                  </span>
                </div>
                <div className="h-[80px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendChartData} syncId="trend30" margin={{ top: 2, right: 12, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8d9b6" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#6e4f30' }} interval={6} />
                      <YAxis tick={{ fontSize: 9, fill: '#6e4f30' }} domain={[60, 'auto']} tickCount={4} width={34} />
                      <ReferenceArea y1={70} y2={100} fill="#22c55e" fillOpacity={0.12} />
                      <ReferenceLine y={70}  stroke="#ef4444" strokeDasharray="3 2" strokeWidth={1} />
                      <ReferenceLine y={126} stroke="#f97316" strokeDasharray="3 2" strokeWidth={1} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, fontSize: 11, background: '#fffaf3', border: '1px solid #e8d9b6', color: '#352719' }}
                        formatter={v => v != null ? [`${v} mg/dL`, 'Glucose'] : ['—', 'Glucose']}
                      />
                      <Line dataKey="glucose" stroke="transparent" strokeWidth={0} connectNulls={false}
                        isAnimationActive animationDuration={900} animationEasing="ease-out"
                        dot={(props) => {
                          const { cx, cy, payload } = props
                          if (payload.glucose == null) return <g key={`g-${cx}`} />
                          const v = payload.glucose
                          const color = v > 126 ? '#f97316' : v < 70 ? '#ef4444' : '#22c55e'
                          return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4}
                            fill={color} stroke="#fffaf3" strokeWidth={1.5} />
                        }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </ChartReveal>
          </Card>
        </FadeUp>
      )}

      {/* ── Protein / water ─────────────────────────────────────────────── */}
      <FadeUp delay={0.9}>
        <div className="grid grid-cols-2 gap-3">
          <Card onClick={() => navigate('/nutrition')}>
            <p className="text-xs text-wood-600 font-medium mb-1">Protein Today</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-wood-900 tabular">
                <CountUp value={nutrition?.proteinG ?? 0} />
              </span>
              <span className="text-xs text-wood-600">/ {proteinGoal} g</span>
            </div>
            <ProgressBar value={nutrition?.proteinG ?? 0} max={proteinGoal}
              color={(nutrition?.proteinG ?? 0) >= proteinGoal ? 'green' : 'brand'} className="mt-2" />
          </Card>

          <Card onClick={() => navigate('/nutrition')}>
            <p className="text-xs text-wood-600 font-medium mb-1">Water Today</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-wood-900 tabular">
                <CountUp value={nutrition?.waterOz ?? 0} />
              </span>
              <span className="text-xs text-wood-600">/ {waterGoal} oz</span>
            </div>
            <ProgressBar value={nutrition?.waterOz ?? 0} max={waterGoal}
              color={(nutrition?.waterOz ?? 0) >= waterGoal ? 'green' : 'blue'} className="mt-2" />
          </Card>
        </div>
      </FadeUp>

      {/* ── Well-being grid ─────────────────────────────────────────────── */}
      <FadeUp delay={1.0}>
        <Card>
          <CardHeader title="Today's Well-being" action={
            <Button size="xs" variant="ghost" onClick={() => navigate('/wellbeing')}>Update</Button>
          } />
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Mood',   value: wellbeing?.mood,         emoji: '😊' },
              { label: 'Energy', value: wellbeing?.energy,       emoji: '⚡' },
              { label: 'Hunger', value: wellbeing?.hunger,       emoji: '🍽️' },
              { label: 'Sleep',  value: wellbeing?.sleepQuality, emoji: '😴' },
            ].map(({ label, value, emoji }) => (
              <div key={label} className="text-center">
                <div className="text-xl mb-0.5">{emoji}</div>
                <div className="text-lg font-bold text-wood-900 tabular">{value ?? '—'}</div>
                <div className="text-[10px] text-wood-600">{label}</div>
              </div>
            ))}
          </div>
        </Card>
      </FadeUp>

    </div>
  )
}

// ── Tile (Image 391) ───────────────────────────────────────────────────────
function Tile({ tone, eyebrow, title, footnote, icon, iconColor, onClick }) {
  const bg = TILE_TONES[tone]?.bg ?? '#fff7ee'
  const eyeColor = TILE_TONES[tone]?.eyebrow ?? '#523a25'
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12, ease: ease.outCubic }}
      className="w-full text-left rounded-tile p-4 shadow-tile relative overflow-hidden"
      style={{ background: bg }}
    >
      <div className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/85 flex items-center justify-center shadow-sm" style={{ color: iconColor }}>
        {icon}
      </div>
      <p className="text-[10px] font-bold tracking-[0.16em]" style={{ color: eyeColor }}>{eyebrow}</p>
      <p className="display text-2xl font-bold text-wood-900 mt-3 tabular leading-none">{title}</p>
      <p className="text-[11px] text-wood-700 mt-2 line-clamp-1">{footnote}</p>
    </motion.button>
  )
}

const TILE_TONES = {
  meds:    { bg: '#fce4d8', eyebrow: '#9a3412' },
  glucose: { bg: '#dceef7', eyebrow: '#0c4a6e' },
  weight:  { bg: '#ede5f4', eyebrow: '#4c1d95' },
  active:  { bg: '#dde9d3', eyebrow: '#365314' },
}

// ── Journey chip — single counter in the journey widget ───────────────────
function JourneyChip({ count, label, bg, valueColor, labelColor }) {
  return (
    <div className="text-center rounded-xl py-2.5 px-1" style={{ background: bg }}>
      <p className="text-xl font-bold leading-none tabular" style={{ color: valueColor }}>{count}</p>
      <p className="text-[10px] font-medium mt-1" style={{ color: labelColor }}>days · {label}</p>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function formatNextDoseDay(injectedAt) {
  const next = new Date(injectedAt)
  next.setDate(next.getDate() + 7)
  return next.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' +
         next.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(':00', '')
}
