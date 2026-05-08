import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useQuery } from '../hooks/useQuery'
import { MEDICATIONS, INJECTION_SITES, buildDecayCurve } from '../utils/constants'
import { toDisplayDateTime, localDateTimeStr } from '../utils/dateHelpers'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import Card, { CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { FormField, Input, Select, Textarea } from '../components/ui/FormField'
import EmptyState from '../components/ui/EmptyState'
import { Syringe, MapPin, Clock, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHero from '../components/motion/PageHero'

export default function Medication() {
  const [showModal, setShowModal] = useState(false)
  const [delId, setDelId]         = useState(null)

  const { data: profile }    = useQuery(api.getProfile)
  const { data: injections, refetch } = useQuery(() => api.getInjections(30))

  const med    = profile?.medicationName ?? 'Ozempic'
  const medDef = MEDICATIONS[med] ?? MEDICATIONS.Ozempic
  const lastInj = injections?.[0]

  const decayCurve = lastInj
    ? buildDecayCurve(lastInj.injectedAt, medDef.halfLifeDays, lastInj.doseMg)
    : []
  const nowISO = new Date().toISOString()

  const lastSites = (injections ?? []).slice(0, 3).map(i => i.site)
  const nextSite  = INJECTION_SITES.find(s => !lastSites.includes(s.id)) ?? INJECTION_SITES[0]

  async function handleDelete(id) {
    await api.deleteInjection(id)
    toast.success('Injection deleted')
    refetch()
    setDelId(null)
  }

  return (
    <PageHero variant="meds">
    <div className="space-y-5">

      <div className="flex justify-end">
        <Button onClick={() => setShowModal(true)}><Plus size={16} /> Log Injection</Button>
      </div>

      {/* ── Decay chart ────────────────────────────────────────────────── */}
      {lastInj && (
        <Card>
          <CardHeader title="Medication Level" subtitle={`${med} · half-life ${medDef.halfLifeDays} days`} />
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={decayCurve} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tickFormatter={t => format(parseISO(t), 'MM/dd')}
                  tick={{ fontSize: 10 }} interval={7} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <Tooltip labelFormatter={t => format(parseISO(t), 'MMM d h:mm a')}
                  formatter={v => [`${v.toFixed(1)}%`, 'Level']} />
                <ReferenceLine x={nowISO} stroke="#0ea5e9" strokeDasharray="4 2"
                  label={{ value: 'Now', fontSize: 10 }} />
                <Line type="monotone" dataKey="pct" stroke="#0ea5e9" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Current: ~{decayCurve.find(p => p.time >= nowISO)?.pct?.toFixed(0) ?? '?'}% remaining
          </p>
        </Card>
      )}

      {/* ── Site rotation ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader title="Injection Site Rotation" subtitle="Rotate every injection" />
        <div className="relative mx-auto" style={{ width: 200, height: 260 }}>
          <svg viewBox="0 0 200 260" className="absolute inset-0 w-full h-full opacity-10">
            <ellipse cx="100" cy="30" rx="22" ry="26" fill="#374151" />
            <rect x="70" y="56" width="60" height="90" rx="14" fill="#374151" />
            <rect x="42" y="60" width="22" height="70" rx="11" fill="#374151" />
            <rect x="136" y="60" width="22" height="70" rx="11" fill="#374151" />
            <rect x="72" y="144" width="24" height="90" rx="12" fill="#374151" />
            <rect x="104" y="144" width="24" height="90" rx="12" fill="#374151" />
          </svg>
          {INJECTION_SITES.map(site => {
            const used   = lastSites.includes(site.id)
            const isNext = site.id === nextSite.id
            return (
              <div key={site.id} title={site.label}
                style={{ left: `${site.x}%`, top: `${site.y}%`, transform: 'translate(-50%,-50%)' }}
                className={`absolute w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold
                  ${isNext ? 'bg-green-400 border-green-600 text-white' :
                    used   ? 'bg-red-200  border-red-400  text-red-700' :
                             'bg-gray-100 border-gray-300 text-gray-500'}`}>
                {isNext ? '★' : used ? '✓' : ''}
              </div>
            )
          })}
        </div>
        <p className="text-xs text-center text-gray-500 mt-1">
          Suggested next: <span className="font-semibold text-green-600">{nextSite.label}</span>
        </p>
      </Card>

      {/* ── History — flat list, no card chrome (matches Image 392 style) ─ */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-wood-600 mb-2 px-1">
          Recent
        </p>
        {!injections?.length ? (
          <Card>
            <EmptyState icon={Syringe} title="No injections logged"
              description="Tap 'Log Injection' to record your first dose." />
          </Card>
        ) : (
          <ul className="divide-y divide-wood-200/40">
            {injections.map(inj => (
              <li key={inj.id} className="py-3 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-active-soft flex items-center justify-center mt-0.5 shrink-0"
                    style={{ background: '#dde9d3' }}>
                    <span className="text-active-deep" style={{ color: '#365314' }}>✓</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-wood-900">
                      {inj.doseMg} mg · {inj.medicationName}
                    </p>
                    <div className="flex gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-wood-600 flex items-center gap-1">
                        <Clock size={10} /> {toDisplayDateTime(inj.injectedAt)}
                      </span>
                      <span className="text-xs text-wood-600 flex items-center gap-1">
                        <MapPin size={10} />
                        {INJECTION_SITES.find(s => s.id === inj.site)?.label ?? inj.site}
                      </span>
                    </div>
                    {inj.notes && <p className="text-xs text-wood-500 mt-0.5 italic">{inj.notes}</p>}
                  </div>
                </div>
                <button onClick={() => setDelId(inj.id)} className="text-wood-400 hover:text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddInjectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        profile={profile}
        nextSite={nextSite}
        onSaved={refetch}
      />

      <Modal isOpen={delId !== null} onClose={() => setDelId(null)} title="Delete Injection?" size="sm">
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

function AddInjectionModal({ isOpen, onClose, profile, nextSite, onSaved }) {
  const med    = profile?.medicationName ?? 'Mounjaro'
  const medDef = MEDICATIONS[med] ?? MEDICATIONS.Mounjaro ?? MEDICATIONS.Ozempic
  const [form, setForm] = useState({
    medicationName: med,
    doseMg: profile?.currentDoseMg ?? medDef.doses[0] ?? 2.5,
    site: nextSite?.id ?? 'abdomen-left',
    injectedAt: localDateTimeStr(),
    notes: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (isOpen) {
      const m    = profile?.medicationName ?? 'Mounjaro'
      const mDef = MEDICATIONS[m] ?? MEDICATIONS.Mounjaro ?? MEDICATIONS.Ozempic
      setForm({
        medicationName: m,
        doseMg: profile?.currentDoseMg ?? mDef.doses[0] ?? 2.5,
        site: nextSite?.id ?? 'abdomen-left',
        injectedAt: localDateTimeStr(),
        notes: '',
      })
    }
  }, [isOpen, profile?.medicationName, profile?.currentDoseMg, nextSite?.id])

  async function handleSubmit(e) {
    e.preventDefault()
    await api.addInjection({ ...form, injectedAt: new Date(form.injectedAt).toISOString(), doseMg: Number(form.doseMg) })
    toast.success('Injection logged!')
    onSaved()
    onClose()
  }

  const currentMedDef = MEDICATIONS[form.medicationName] ?? MEDICATIONS.Ozempic

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Injection">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Medication" htmlFor="med">
          <Select id="med" value={form.medicationName} onChange={e => set('medicationName', e.target.value)}>
            {Object.keys(MEDICATIONS).map(m => <option key={m}>{m}</option>)}
          </Select>
        </FormField>
        <FormField label="Dose (mg)" htmlFor="dose">
          {currentMedDef.doses.length ? (
            <Select id="dose" value={form.doseMg} onChange={e => set('doseMg', e.target.value)}>
              {currentMedDef.doses.map(d => <option key={d} value={d}>{d} mg</option>)}
            </Select>
          ) : (
            <Input id="dose" type="number" step="0.01" value={form.doseMg}
              onChange={e => set('doseMg', e.target.value)} required />
          )}
        </FormField>
        <FormField label="Injection Site" htmlFor="site">
          <Select id="site" value={form.site} onChange={e => set('site', e.target.value)}>
            {INJECTION_SITES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
        </FormField>
        <FormField label="Date & Time" htmlFor="dt">
          <Input id="dt" type="datetime-local" value={form.injectedAt}
            onChange={e => set('injectedAt', e.target.value)} required />
        </FormField>
        <FormField label="Notes" htmlFor="notes">
          <Textarea id="notes" rows={2} placeholder="Optional notes..." value={form.notes}
            onChange={e => set('notes', e.target.value)} />
        </FormField>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Injection</Button>
        </div>
      </form>
    </Modal>
  )
}
