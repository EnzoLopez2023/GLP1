import { useState, useMemo } from 'react'
import { api } from '../api/client'
import { useQuery } from '../hooks/useQuery'
import { SIDE_EFFECT_TYPES } from '../utils/constants'
import { toDisplayDateTime, lastNDays } from '../utils/dateHelpers'
import { format, parseISO } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Card, { CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { FormField, Input, Select, Textarea, ScaleInput } from '../components/ui/FormField'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { Activity, Plus, Trash2, AlertCircle, Info, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

// ── GLP-1 side-effect knowledge base ─────────────────────────────────────────
const GLP1_SIDE_EFFECTS = [
  { name: 'Nausea',                  freq: 'very-common', tip: 'Peaks in weeks 1–3 at each new dose — eat smaller meals and avoid fatty, greasy foods' },
  { name: 'Decreased Appetite',      freq: 'very-common', tip: 'Expected and intentional — honor it but make sure you\'re still nourishing yourself' },
  { name: 'Diarrhea',                freq: 'very-common', tip: 'Eat slowly, avoid high-fat meals, and stay well hydrated' },
  { name: 'Constipation',            freq: 'very-common', tip: 'Increase water and fiber intake; daily walks help keep things moving' },
  { name: 'Vomiting',                freq: 'common',      tip: 'Often caused by eating too fast or too much — contact your doctor if severe or persistent' },
  { name: 'Stomach Pain',            freq: 'common',      tip: 'Eat smaller portions and avoid carbonated drinks' },
  { name: 'Bloating',                freq: 'common',      tip: 'Slow down eating; avoid foods that ferment quickly (beans, cruciferous veggies, soda)' },
  { name: 'Heartburn / Reflux',      freq: 'common',      tip: 'Avoid eating right before bed; stay upright 2–3 hrs after meals' },
  { name: 'Fatigue',                 freq: 'common',      tip: 'Most noticeable in the first few weeks — usually resolves as your body adjusts' },
  { name: 'Headache',                freq: 'less-common', tip: 'Often linked to lower calorie intake or dehydration — drink plenty of water' },
  { name: 'Dizziness',               freq: 'less-common', tip: 'Rise slowly; can be related to lower blood sugar or blood pressure changes' },
  { name: 'Injection Site Reaction', freq: 'less-common', tip: 'Rotate injection sites with each dose to reduce irritation' },
  { name: 'Hair Loss',               freq: 'less-common', tip: 'Usually temporary — tied to rapid weight loss and calorie deficit, not the medication itself' },
]

const TIRZ_DOSES = [2.5, 5, 7.5, 10, 12.5, 15]
const SEMA_DOSES = [0.25, 0.5, 1, 2]

const FREQ_GROUPS = [
  { key: 'very-common', label: 'Very Common',  labelColor: 'text-orange-600', dotColor: 'bg-orange-400' },
  { key: 'common',      label: 'Common',        labelColor: 'text-amber-600',  dotColor: 'bg-amber-400'  },
  { key: 'less-common', label: 'Less Common',   labelColor: 'text-gray-500',   dotColor: 'bg-gray-300'   },
]

export default function SideEffects() {
  const [showModal, setShowModal] = useState(false)
  const [delId, setDelId]         = useState(null)

  const { data: effects, refetch } = useQuery(api.getSideEffects)
  const { data: injections }        = useQuery(api.getInjections)

  const doseContext = useMemo(() => {
    if (!injections?.length) return null
    const sorted = [...injections].sort((a, b) => a.injectedAt.localeCompare(b.injectedAt))
    const latest  = sorted[sorted.length - 1]
    const { doseMg: currentDose, medicationName: medName } = latest

    let doseStartIdx = sorted.length - 1
    while (doseStartIdx > 0 && sorted[doseStartIdx - 1].doseMg === currentDose) doseStartIdx--
    const weeksOnDose = Math.floor(
      (Date.now() - new Date(sorted[doseStartIdx].injectedAt.slice(0, 10)).getTime()) / (7 * 86400000)
    )
    const prevDose = doseStartIdx > 0 ? sorted[doseStartIdx - 1].doseMg : null

    const isTirz  = /mounjaro|zepbound|tirzepatide/i.test(medName)
    const doses    = isTirz ? TIRZ_DOSES : SEMA_DOSES
    const doseIdx  = doses.indexOf(currentDose)
    const nextDose = doseIdx >= 0 && doseIdx < doses.length - 1 ? doses[doseIdx + 1] : null
    const isMax    = doseIdx === doses.length - 1

    let timingTip
    if (prevDose !== null && weeksOnDose <= 1) {
      timingTip = `You recently increased from ${prevDose}mg to ${currentDose}mg. GI side effects may temporarily return or intensify for 2–4 weeks as your body adjusts to the higher dose.`
    } else if (weeksOnDose <= 3) {
      timingTip = `You're in week ${weeksOnDose + 1} at this dose — one of the most common windows for GI side effects. They typically peak around weeks 2–3 and improve significantly by week 6.`
    } else if (weeksOnDose <= 8) {
      timingTip = `${weeksOnDose} weeks in at ${currentDose}mg. Most side effects stabilize around this time — if you're still experiencing significant issues, it's worth a conversation with your doctor.`
    } else {
      timingTip = `You've been stable on ${currentDose}mg for ${weeksOnDose} weeks. At this point, ongoing side effects are less likely to be adjustment-related — discuss persistent symptoms with your doctor.`
    }

    const nextDoseTip = isMax
      ? `You're at the maximum dose of ${currentDose}mg. Side effects should be stable going forward.`
      : nextDose
        ? `If you titrate to ${nextDose}mg, expect a similar 2–4 week adjustment period with possible GI symptoms returning, especially nausea.`
        : null

    return { currentDose, medName, weeksOnDose, prevDose, nextDose, isMax, timingTip, nextDoseTip, isTirz }
  }, [injections])

  const freqData = useMemo(() => {
    if (!effects?.length) return []
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString()
    const counts = {}
    effects.filter(e => e.loggedAt >= cutoff).forEach(e => { counts[e.symptom] = (counts[e.symptom]??0)+1 })
    return Object.entries(counts).map(([symptom, count]) => ({ symptom: symptom.substring(0,12), count }))
      .sort((a,b) => b.count - a.count).slice(0,8)
  }, [effects])

  const severityChart = useMemo(() => {
    const dates = lastNDays(14).reverse()
    return dates.map(date => {
      const dayE = (effects??[]).filter(e => e.loggedAt.startsWith(date))
      const avg  = dayE.length ? +(dayE.reduce((s,e) => s+e.severity,0)/dayE.length).toFixed(1) : null
      return { label: format(parseISO(date), 'MM/dd'), severity: avg }
    })
  }, [effects])

  const insights = useMemo(() => {
    if (!effects?.length) return []
    const out = []
    const nausea = effects.filter(e => e.symptom === 'Nausea')
    if (nausea.length >= 3) {
      const avgSev = +(nausea.reduce((s,e) => s+e.severity,0)/nausea.length).toFixed(1)
      out.push(`Nausea is your most frequent symptom with avg severity ${avgSev}/10.`)
    }
    return out
  }, [effects])

  async function handleDelete(id) {
    await api.deleteSideEffect(id)
    toast.success('Entry deleted')
    refetch()
    setDelId(null)
  }

  const severityColor = s => s >= 7 ? 'red' : s >= 4 ? 'orange' : 'green'

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setShowModal(true)}><Plus size={16} /> Log Symptom</Button>
      </div>

      {doseContext && (
        <Card>
          <CardHeader
            title={`What to Expect · ${doseContext.medName} ${doseContext.currentDose}mg`}
            subtitle={`Week ${doseContext.weeksOnDose + 1} at this dose${doseContext.prevDose ? ` · titrated up from ${doseContext.prevDose}mg` : ' · starting dose'}`}
          />

          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl mb-4">
            <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-800 leading-relaxed">{doseContext.timingTip}</p>
          </div>

          <div className="space-y-4">
            {FREQ_GROUPS.map(group => {
              const items = GLP1_SIDE_EFFECTS.filter(se => se.freq === group.key)
              return (
                <div key={group.key}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${group.labelColor}`}>{group.label}</p>
                  <ul className="space-y-2">
                    {items.map(se => (
                      <li key={se.name} className="flex items-start gap-2 text-xs">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${group.dotColor}`} />
                        <span>
                          <span className="font-medium text-gray-800">{se.name}</span>
                          <span className="text-gray-500"> — {se.tip}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          {doseContext.nextDoseTip && (
            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-xl mt-4">
              <TrendingUp size={14} className="text-green-600 mt-0.5 shrink-0" />
              <p className="text-xs text-green-800 leading-relaxed">{doseContext.nextDoseTip}</p>
            </div>
          )}
        </Card>
      )}

      {freqData.length > 0 && (
        <Card>
          <CardHeader title="Symptom Frequency (30 days)" />
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={freqData} layout="vertical" margin={{ top:0, right:16, bottom:0, left:80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="symptom" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" name="Occurrences" fill="#0ea5e9" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {effects?.length > 0 && (
        <Card>
          <CardHeader title="Severity Trend (14 days)" />
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityChart} margin={{ top:4, right:8, bottom:4, left:-20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 10 }} domain={[0,10]} />
                <Tooltip formatter={(v,n) => [v??'—', 'Avg Severity']} />
                <Bar dataKey="severity" name="severity" fill="#f97316" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {insights.length > 0 && (
        <Card>
          <CardHeader title="Patterns Detected" />
          <ul className="space-y-2">
            {insights.map((ins,i) => (
              <li key={i} className="flex items-start gap-2 text-sm bg-orange-50 rounded-xl p-3 text-orange-800">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />{ins}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card padding={false}>
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">History</h3>
        </div>
        {!effects?.length ? (
          <div className="p-4">
            <EmptyState icon={Activity} title="No symptoms logged"
              description="Track side effects to identify patterns over time." />
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {effects.map(e => (
              <li key={e.id} className="px-4 py-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{e.symptom}</span>
                    <Badge color={severityColor(e.severity)}>Severity {e.severity}/10</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{toDisplayDateTime(e.loggedAt)}</p>
                  {e.notes && <p className="text-xs text-gray-400 italic mt-0.5">{e.notes}</p>}
                </div>
                <button onClick={() => setDelId(e.id)} className="text-gray-300 hover:text-red-400 p-1">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AddSideEffectModal isOpen={showModal} onClose={() => setShowModal(false)} onSaved={refetch} />
      <Modal isOpen={delId !== null} onClose={() => setDelId(null)} title="Delete Entry?" size="sm">
        <p className="text-sm text-gray-600 mb-4">This cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDelId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => handleDelete(delId)}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}

function AddSideEffectModal({ isOpen, onClose, onSaved }) {
  const [form, setForm] = useState({ symptom:'Nausea', severity:5, loggedAt: new Date().toISOString().slice(0,16), notes:'' })
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    await api.addSideEffect({ ...form, loggedAt: new Date(form.loggedAt).toISOString(), severity: Number(form.severity) })
    toast.success('Symptom logged!')
    onSaved()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Side Effect">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Symptom" htmlFor="sym">
          <Select id="sym" value={form.symptom} onChange={e => set('symptom', e.target.value)}>
            {SIDE_EFFECT_TYPES.map(s => <option key={s}>{s}</option>)}
          </Select>
        </FormField>
        <FormField label={`Severity: ${form.severity}/10`} htmlFor="sev">
          <ScaleInput value={form.severity} onChange={v => set('severity', v)} labels={['Mild','Severe']} />
        </FormField>
        <FormField label="Date & Time" htmlFor="sdt">
          <Input id="sdt" type="datetime-local" value={form.loggedAt}
            onChange={e => set('loggedAt', e.target.value)} />
        </FormField>
        <FormField label="Notes" htmlFor="snotes">
          <Textarea id="snotes" rows={2} placeholder="What were you doing? What helped?"
            value={form.notes} onChange={e => set('notes', e.target.value)} />
        </FormField>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  )
}
