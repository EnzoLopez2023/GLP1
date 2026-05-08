import { useState } from 'react'
import { api } from '../api/client'
import { useQuery } from '../hooks/useQuery'
import { toDateStr, toDisplayDate } from '../utils/dateHelpers'
import { format, parseISO } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Card, { CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { FormField, Input, Textarea } from '../components/ui/FormField'
import EmptyState from '../components/ui/EmptyState'
import { Scale, Ruler, Camera, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { readFileAsDataURL } from '../utils/exportHelpers'
import PageHero from '../components/motion/PageHero'

export default function Progress() {
  const [showWeightModal,  setShowWeightModal]  = useState(false)
  const [showMeasureModal, setShowMeasureModal] = useState(false)
  const [showPhotoModal,   setShowPhotoModal]   = useState(false)
  const [photoDataMap,     setPhotoDataMap]     = useState({})
  const [delId,            setDelId]            = useState(null)

  const { data: weights,  refetch: refetchW } = useQuery(api.getWeightLog)
  const { data: measures, refetch: refetchM } = useQuery(api.getMeasurements)
  const { data: photos,   refetch: refetchP } = useQuery(api.getPhotos)
  const { data: profile }                      = useQuery(api.getProfile)

  const latestWeight = weights?.[weights.length - 1]
  const startWeight  = weights?.[0]
  const totalLost    = (startWeight && latestWeight)
    ? +(startWeight.weightLbs - latestWeight.weightLbs).toFixed(1) : null
  const toGoal = (profile?.goalWeightLbs && latestWeight)
    ? +(latestWeight.weightLbs - profile.goalWeightLbs).toFixed(1) : null

  const weightChart = (weights ?? []).map(w => ({
    label: format(parseISO(w.date), 'MM/dd'), weight: w.weightLbs,
  }))

  async function handleDeleteWeight(id) {
    await api.deleteWeight(id)
    toast.success('Recording deleted')
    refetchW()
    setDelId(null)
  }

  async function loadPhoto(id) {
    if (photoDataMap[id]) return
    const { dataUrl } = await api.getPhotoData(id)
    setPhotoDataMap(m => ({ ...m, [id]: dataUrl }))
  }

  return (
    <PageHero variant="weight">
    <div className="space-y-5">

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowMeasureModal(true)}><Ruler size={15} /> Measurements</Button>
        <Button variant="outline" size="sm" onClick={() => setShowPhotoModal(true)}><Camera size={15} /> Photo</Button>
        <Button onClick={() => setShowWeightModal(true)}><Plus size={16} /> Log Weight</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-xs text-gray-500">Current</p>
          <p className="text-xl font-bold text-gray-800 mt-0.5">{latestWeight?.weightLbs ?? '—'}</p>
          <p className="text-xs text-gray-400">lbs</p>
        </Card>
        <Card>
          <p className="text-xs text-green-600 font-medium">Lost</p>
          <p className="text-xl font-bold text-gray-800 mt-0.5">{totalLost !== null ? Math.max(0, totalLost) : '—'}</p>
          <p className="text-xs text-gray-400">lbs total</p>
        </Card>
        <Card>
          <p className="text-xs text-blue-600 font-medium">To Goal</p>
          <p className="text-xl font-bold text-gray-800 mt-0.5">{toGoal !== null ? Math.max(0, toGoal) : '—'}</p>
          <p className="text-xs text-gray-400">lbs remaining</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Weight History" />
        {weightChart.length > 1 ? (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightChart} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip formatter={v => [`${v} lbs`, 'Weight']} />
                <Line type="monotone" dataKey="weight" stroke="#0ea5e9"
                  dot={{ r: 3, fill: '#0ea5e9' }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState icon={Scale} title="Not enough data"
            description="Log at least 2 weight entries to see your chart." />
        )}
      </Card>

      {/* ── Recordings list ──────────────────────────────────────────── */}
      <Card padding={false}>
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Recordings ({(weights ?? []).length})</h3>
        </div>
        {!(weights ?? []).length ? (
          <div className="p-4">
            <EmptyState icon={Scale} title="No recordings yet"
              description="Log your weight to start tracking your progress." />
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {[...(weights ?? [])].reverse().map(w => (
              <li key={w.id} className="px-4 py-3 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold">
                    {w.weightLbs}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-800">{w.weightLbs} lbs</span>
                    <p className="text-xs text-gray-500 mt-0.5">{toDisplayDate(w.date)}</p>
                    {w.notes && <p className="text-xs text-gray-400 italic mt-0.5">{w.notes}</p>}
                  </div>
                </div>
                <button onClick={() => setDelId(w.id)} className="text-gray-300 hover:text-red-400 p-1">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Measurements" action={
          <Button size="xs" variant="ghost" onClick={() => setShowMeasureModal(true)}><Plus size={12} /> Add</Button>
        } />
        {!measures?.length ? (
          <EmptyState icon={Ruler} title="No measurements logged" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 pr-3">Date</th>
                  {['waist','hips','chest','neck'].map(k => (
                    <th key={k} className="pb-2 pr-2 capitalize">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {measures.slice(0,5).map(m => (
                  <tr key={m.id}>
                    <td className="py-2 pr-3 text-gray-500">{toDisplayDate(m.date)}</td>
                    {['waist','hips','chest','neck'].map(k => (
                      <td key={k} className="py-2 pr-2 font-medium">{m[k] ? `${m[k]}"` : '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Progress Photos" action={
          <Button size="xs" variant="ghost" onClick={() => setShowPhotoModal(true)}><Plus size={12} /> Add</Button>
        } />
        {!photos?.length ? (
          <EmptyState icon={Camera} title="No photos yet"
            description="Progress photos are stored on the server." />
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map(p => (
              <div key={p.id} className="aspect-square relative group cursor-pointer"
                onClick={() => loadPhoto(p.id)}>
                {photoDataMap[p.id] ? (
                  <img src={photoDataMap[p.id]} alt={p.label || toDisplayDate(p.date)}
                    className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
                    <Camera size={20} className="text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100
                                flex items-end p-1 transition-opacity">
                  <span className="text-white text-[10px]">{toDisplayDate(p.date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <WeightModal   isOpen={showWeightModal}  onClose={() => setShowWeightModal(false)}  onSaved={refetchW} />
      <MeasureModal  isOpen={showMeasureModal} onClose={() => setShowMeasureModal(false)} onSaved={refetchM} />
      <PhotoModal    isOpen={showPhotoModal}   onClose={() => setShowPhotoModal(false)}   onSaved={refetchP} />

      <Modal isOpen={delId !== null} onClose={() => setDelId(null)} title="Delete Recording?" size="sm">
        <p className="text-sm text-gray-600 mb-4">This cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDelId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => handleDeleteWeight(delId)}>Delete</Button>
        </div>
      </Modal>
    </div>
    </PageHero>
  )
}

function WeightModal({ isOpen, onClose, onSaved }) {
  const [form, setForm] = useState({ date: toDateStr(), weightLbs: '', notes: '' })
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    await api.addWeight({ date: form.date, weightLbs: Number(form.weightLbs), notes: form.notes })
    await api.saveProfile({ weightLbs: Number(form.weightLbs) })
    toast.success('Weight logged!')
    setForm({ date: toDateStr(), weightLbs: '', notes: '' })
    onSaved()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Weight" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Date" htmlFor="wdate">
          <Input id="wdate" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </FormField>
        <FormField label="Weight (lbs)" htmlFor="wval" required>
          <Input id="wval" type="number" step="0.1" min="50" max="600"
            placeholder="e.g. 185.5" value={form.weightLbs}
            onChange={e => set('weightLbs', e.target.value)} required />
        </FormField>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  )
}

function MeasureModal({ isOpen, onClose, onSaved }) {
  const fields = ['waist','hips','chest','neck','leftArm','rightArm','leftThigh','rightThigh']
  const [form, setForm] = useState(Object.fromEntries([['date', toDateStr()], ['notes',''], ...fields.map(f => [f,''])]))
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    const data = { date: form.date, notes: form.notes }
    fields.forEach(f => { data[f] = Number(form[f]) || null })
    await api.addMeasurement(data)
    toast.success('Measurements saved!')
    onSaved()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Measurements">
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Date" htmlFor="mdate">
          <Input id="mdate" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          {fields.map(f => (
            <FormField key={f} label={`${f.replace(/([A-Z])/g,' $1')} (in)`} htmlFor={`m_${f}`}>
              <Input id={`m_${f}`} type="number" step="0.25" min="0" placeholder="—"
                value={form[f]} onChange={e => set(f, e.target.value)} />
            </FormField>
          ))}
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  )
}

function PhotoModal({ isOpen, onClose, onSaved }) {
  const [preview, setPreview] = useState(null)
  const [label, setLabel]     = useState('')
  const [date, setDate]       = useState(toDateStr())

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setPreview(await readFileAsDataURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!preview) { toast.error('Please select a photo'); return }
    await api.addPhoto({ date, label, dataUrl: preview })
    toast.success('Photo saved!')
    setPreview(null); setLabel(''); setDate(toDateStr())
    onSaved()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Progress Photo" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Date" htmlFor="pdate">
          <Input id="pdate" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </FormField>
        <FormField label="Label (optional)" htmlFor="plabel">
          <Input id="plabel" value={label} onChange={e => setLabel(e.target.value)}
            placeholder="e.g. Front view, Week 4" />
        </FormField>
        <Input type="file" accept="image/*" onChange={handleFile} />
        {preview && <img src={preview} alt="preview" className="mt-2 w-full h-40 object-cover rounded-xl" />}
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Photo</Button>
        </div>
      </form>
    </Modal>
  )
}
