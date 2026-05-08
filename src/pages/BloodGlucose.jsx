import { useState, useMemo, useEffect } from 'react'
import { api } from '../api/client'
import { useQuery } from '../hooks/useQuery'
import { GLUCOSE_TYPES, glucoseStatus } from '../utils/constants'
import { toDisplayDateTime, lastNDays, localDateTimeStr, toDateStr } from '../utils/dateHelpers'
import { format, parseISO } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import Card, { CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { FormField, Input, Select, Textarea } from '../components/ui/FormField'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { Droplets, Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHero from '../components/motion/PageHero'

const RANGE_OPTIONS = [7, 14, 30, 60, 90, null]

export default function BloodGlucose() {
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter]       = useState('all')
  const [range, setRange]         = useState(30)
  const [delId, setDelId]         = useState(null)

  const { data: readings,   refetch } = useQuery(api.getGlucose)
  const { data: injections }          = useQuery(() => api.getInjections(90))

  const cutoff   = range === null ? '1970-01-01' : new Date(Date.now() - range * 86400000).toISOString()
  const inRange  = useMemo(() => (readings ?? []).filter(r => r.readingAt >= cutoff), [readings, range])
  const filtered = useMemo(() =>
    filter === 'all' ? inRange : inRange.filter(r => r.readingType === filter), [inRange, filter])

  const avg       = filtered.length ? Math.round(filtered.reduce((s, r) => s + r.value, 0) / filtered.length) : null
  const highCount = filtered.filter(r => r.value > 125).length
  const lowCount  = filtered.filter(r => r.value < 70).length

  const chartData = useMemo(() => {
    let days
    if (range === null) {
      const oldest = inRange.length ? inRange[inRange.length - 1].readingAt.slice(0, 10) : toDateStr(new Date())
      const nDays = Math.max(1, Math.ceil((Date.now() - new Date(oldest).getTime()) / 86400000) + 1)
      days = lastNDays(nDays).reverse()
    } else {
      days = lastNDays(range).reverse()
    }
    return days.map(date => {
      const dayR    = inRange.filter(r => r.readingAt.startsWith(date))
      const fastR   = dayR.filter(r => r.readingType === 'fasting')
      const postR   = dayR.filter(r => r.readingType === 'post-meal')
      const avg     = dayR.length  ? Math.round(dayR.reduce((s,r)  => s + r.value, 0) / dayR.length)  : null
      const fastAvg = fastR.length ? Math.round(fastR.reduce((s,r) => s + r.value, 0) / fastR.length) : null
      const postAvg = postR.length ? Math.round(postR.reduce((s,r) => s + r.value, 0) / postR.length) : null
      return { date, avg, fastAvg, postAvg, label: format(parseISO(date), 'MM/dd') }
    })
  }, [inRange, range])

  const injectionLabels = useMemo(() => {
    const cutoffDate = range === null ? '1970-01-01' : lastNDays(range)[range - 1]
    return (injections ?? [])
      .filter(inj => inj.injectedAt.slice(0, 10) >= cutoffDate)
      .map(inj => format(parseISO(inj.injectedAt.slice(0, 10)), 'MM/dd'))
  }, [injections, range])

  const trendInfo = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => a.readingAt.localeCompare(b.readingAt))
    const N = 5
    if (sorted.length < N + 1) return { dir: 'neutral', recent: null, prior: null, n: N }
    const recent = sorted.slice(-N)
    const prior  = sorted.slice(Math.max(0, sorted.length - N * 2), -N)
    if (!prior.length) return { dir: 'neutral', recent: null, prior: null, n: N }
    const rAvg = Math.round(recent.reduce((s,r) => s + r.value, 0) / recent.length)
    const pAvg = Math.round(prior.reduce((s,r)  => s + r.value, 0) / prior.length)
    const dir = rAvg - pAvg > 5 ? 'up' : pAvg - rAvg > 5 ? 'down' : 'neutral'
    return { dir, recent: rAvg, prior: pAvg, n: N }
  }, [filtered])

  async function handleDelete(id) {
    await api.deleteGlucose(id)
    toast.success('Reading deleted')
    refetch()
    setDelId(null)
  }

  const statusColor = (val, type) => {
    const s = glucoseStatus(val, type)
    return s.label === 'Normal' ? 'green' : s.label === 'Low' ? 'red' : s.label === 'Elevated' ? 'orange' : 'red'
  }

  return (
    <PageHero variant="glucose">
    <div className="space-y-5">

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {RANGE_OPTIONS.map(r => (
            <button key={r ?? 'all'} onClick={() => setRange(r)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                range === r ? 'bg-brand-500 text-white' : 'bg-[#fffaf3] text-wood-700 border border-wood-200/60'}`}>
              {r === null ? 'All' : `${r}d`}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowModal(true)}><Plus size={16} /> Add Reading</Button>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-xs text-gray-500">Avg ({range}d)</p>
          <p className="text-2xl font-bold text-gray-800 mt-0.5">{avg ?? '—'}</p>
          <p className="text-xs text-gray-400">mg/dL</p>
        </Card>
        <Card>
          <p className="text-xs text-red-500 font-medium">High</p>
          <p className="text-2xl font-bold text-gray-800 mt-0.5">{highCount}</p>
          <p className="text-xs text-gray-400">&gt;125 mg/dL</p>
        </Card>
        <Card>
          <p className="text-xs text-orange-500 font-medium">Low</p>
          <p className="text-2xl font-bold text-gray-800 mt-0.5">{lowCount}</p>
          <p className="text-xs text-gray-400">&lt;70 mg/dL</p>
        </Card>
      </div>

      {/* ── Trend ─────────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <Card>
          <div className="flex items-center gap-3">
            {trendInfo.dir === 'up'   ? <TrendingUp className="text-red-500"    size={20} /> :
             trendInfo.dir === 'down' ? <TrendingDown className="text-green-500" size={20} /> :
                                        <Minus className="text-gray-400" size={20} />}
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">
                {trendInfo.dir === 'up'   ? 'Glucose trending up recently' :
                 trendInfo.dir === 'down' ? 'Glucose trending down — great progress!' :
                 'Glucose is stable recently'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {trendInfo.recent !== null
                  ? `Last ${trendInfo.n} readings avg ${trendInfo.recent} mg/dL vs ${trendInfo.prior} prior`
                  : `${filtered.length} reading${filtered.length !== 1 ? 's' : ''} logged — need ${trendInfo.n + 1}+ to show trend`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Chart ─────────────────────────────────────────────────────── */}
      {inRange.length > 0 && (
        <Card>
          <CardHeader title="Daily Glucose Averages" />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[60, 'auto']} />
                <Tooltip formatter={(v, n) => [v ? `${v} mg/dL` : '—', n]} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={70}  stroke="#ef4444" strokeDasharray="3 2" label={{ value: 'Low',    fontSize: 9 }} />
                <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="3 2" label={{ value: 'Normal', fontSize: 9 }} />
                <ReferenceLine y={126} stroke="#f97316" strokeDasharray="3 2" label={{ value: 'High',   fontSize: 9 }} />
                <Line type="monotone" dataKey="avg"     name="Average"   stroke="#0ea5e9" dot={false} strokeWidth={2}   connectNulls />
                <Line type="monotone" dataKey="fastAvg" name="Fasting"   stroke="#8b5cf6" dot={false} strokeWidth={1.5} connectNulls strokeDasharray="4 2" />
                <Line type="monotone" dataKey="postAvg" name="Post-Meal" stroke="#f97316" dot={false} strokeWidth={1.5} connectNulls strokeDasharray="4 2" />
                {injectionLabels.map(lbl => (
                  <ReferenceLine key={lbl} x={lbl} stroke="#7c3aed" strokeWidth={1.5}
                    label={{ value: '💉', position: 'top', fontSize: 11 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* ── Filter tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ id: 'all', label: 'All' }, ...GLUCOSE_TYPES].map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === t.id ? 'bg-brand-500 text-white' : 'bg-[#fffaf3] text-wood-700 border border-wood-200/60'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── List ──────────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-wood-600 mb-2 px-1">
          Readings · {filtered.length}
        </p>
        {!filtered.length ? (
          <Card>
            <EmptyState icon={Droplets} title="No readings yet"
              description="Add a reading from your Care Touch meter to get started." />
          </Card>
        ) : (
          <ul className="divide-y divide-wood-200/40">
            {filtered.map(r => {
              const s = glucoseStatus(r.value, r.readingType)
              return (
                <li key={r.id} className="py-3 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold
                      ${s.label === 'Normal' ? 'bg-active-soft text-[#365314]' :
                        s.label === 'Low'    ? 'bg-red-50 text-red-700' :
                        'bg-meds-soft text-[#9a3412]'}`}
                      style={s.label === 'Normal' ? { background: '#dde9d3' } : s.label === 'Low' ? {} : { background: '#fce4d8' }}
                    >
                      {r.value}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-wood-900">{r.value} mg/dL</span>
                        <Badge color={statusColor(r.value, r.readingType)}>{s.label}</Badge>
                        <Badge color="gray">{GLUCOSE_TYPES.find(t => t.id === r.readingType)?.label ?? r.readingType}</Badge>
                      </div>
                      <p className="text-xs text-wood-600 mt-0.5">{toDisplayDateTime(r.readingAt)}</p>
                      {r.notes && <p className="text-xs text-wood-500 italic mt-0.5">{r.notes}</p>}
                    </div>
                  </div>
                  <button onClick={() => setDelId(r.id)} className="text-wood-400 hover:text-red-500 p-1">
                    <Trash2 size={14} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <GlucoseInsights readings={readings ?? []} />

      <AddGlucoseModal isOpen={showModal} onClose={() => setShowModal(false)} onSaved={refetch} />

      <Modal isOpen={delId !== null} onClose={() => setDelId(null)} title="Delete Reading?" size="sm">
        <p className="text-sm text-gray-600 mb-4">This cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDelId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => handleDelete(delId)}>Delete</Button>
        </div>
      </Modal>
    </div>
    </PageHero>
  )
}

function AddGlucoseModal({ isOpen, onClose, onSaved }) {
  const [form, setForm] = useState({
    value: '', readingType: 'fasting',
    readingAt: localDateTimeStr(), notes: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (isOpen) setForm(f => ({ ...f, readingAt: localDateTimeStr() }))
  }, [isOpen])

  async function handleSubmit(e) {
    e.preventDefault()
    const val = Number(form.value)
    if (!val || val < 20 || val > 600) { toast.error('Enter a valid glucose value (20–600 mg/dL)'); return }
    await api.addGlucose({ ...form, value: val, readingAt: new Date(form.readingAt).toISOString() })
    toast.success('Glucose reading saved!')
    setForm({ value: '', readingType: 'fasting', readingAt: localDateTimeStr(), notes: '' })
    onSaved()
    onClose()
  }

  const preview = form.value ? glucoseStatus(Number(form.value), form.readingType) : null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Glucose Reading">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Glucose Value (mg/dL)" htmlFor="gval" required>
          <Input id="gval" type="number" min="20" max="600" placeholder="e.g. 95"
            value={form.value} onChange={e => set('value', e.target.value)} required />
          {preview && (
            <span className={`inline-flex mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${preview.bg}`}>
              {preview.label}
            </span>
          )}
        </FormField>
        <FormField label="Reading Type" htmlFor="rtype">
          <Select id="rtype" value={form.readingType} onChange={e => set('readingType', e.target.value)}>
            {GLUCOSE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label} — {t.description}</option>)}
          </Select>
        </FormField>
        <FormField label="Date & Time" htmlFor="rdt">
          <Input id="rdt" type="datetime-local" value={form.readingAt}
            onChange={e => set('readingAt', e.target.value)} required />
        </FormField>
        <FormField label="Notes" htmlFor="rnotes">
          <Textarea id="rnotes" rows={2} placeholder="e.g. After breakfast..."
            value={form.notes} onChange={e => set('notes', e.target.value)} />
        </FormField>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Reading</Button>
        </div>
      </form>
    </Modal>
  )
}

function GlucoseInsights({ readings }) {
  const insights = useMemo(() => {
    const out = []
    if (readings.length < 5) return out
    const now = Date.now()

    const fasting = readings.filter(r => r.readingType === 'fasting')
    if (fasting.length >= 3) {
      const avg = Math.round(fasting.reduce((s, r) => s + r.value, 0) / fasting.length)
      if (avg > 100) out.push({ type: 'warning', text: `Your average fasting glucose is ${avg} mg/dL — above the 100 mg/dL threshold.` })
      else out.push({ type: 'good', text: `Your average fasting glucose is ${avg} mg/dL — within the normal range.` })
    }

    const thisWeek = readings.filter(r => now - new Date(r.readingAt) < 7 * 86400000)
    const lastWeek = readings.filter(r => { const a = now - new Date(r.readingAt); return a >= 7*86400000 && a < 14*86400000 })
    if (thisWeek.length >= 3 && lastWeek.length >= 3) {
      const twA = Math.round(thisWeek.reduce((s,r) => s+r.value,0)/thisWeek.length)
      const lwA = Math.round(lastWeek.reduce((s,r) => s+r.value,0)/lastWeek.length)
      if (twA < lwA - 5) out.push({ type: 'good',    text: `Your glucose average improved by ${lwA - twA} mg/dL vs last week.` })
      else if (twA > lwA + 5) out.push({ type: 'warning', text: `Your glucose average increased by ${twA - lwA} mg/dL vs last week.` })
    }
    return out
  }, [readings])

  if (!insights.length) return null
  return (
    <Card>
      <CardHeader title="Glucose Insights" />
      <ul className="space-y-2">
        {insights.map((ins, i) => (
          <li key={i} className={`flex items-start gap-2 text-sm rounded-xl p-3
            ${ins.type === 'good' ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
            <span className="mt-0.5 shrink-0">{ins.type === 'good' ? '✅' : '⚠️'}</span>
            {ins.text}
          </li>
        ))}
      </ul>
    </Card>
  )
}
