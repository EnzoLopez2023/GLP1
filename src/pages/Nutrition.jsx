import { useState, useMemo, useRef } from 'react'
import { api } from '../api/client'
import { useQuery } from '../hooks/useQuery'
import { toDateStr, lastNDays } from '../utils/dateHelpers'
import { format, parseISO } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Card, { CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import ProgressBar from '../components/ui/ProgressBar'
import Modal from '../components/ui/Modal'
import { FormField, Input, Select, Textarea } from '../components/ui/FormField'
import { Plus, Sparkles, Camera, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const PROTEIN_GOAL = 120
const WATER_GOAL   = 80

export default function Nutrition() {
  const [showDayModal, setShowDayModal]   = useState(false)
  const [showMealModal, setShowMealModal] = useState(false)
  const today = toDateStr()

  const { data: settings }    = useQuery(api.getSettings)
  const { data: todayRecord, refetch: refetchToday } = useQuery(api.getTodayNutrition)
  const { data: weekRecords } = useQuery(() => {
    const dates = lastNDays(7)
    const from = dates[dates.length - 1], to = dates[0]
    return api.getNutritionRange(from, to)
  })
  const { data: meals, refetch: refetchMeals } = useQuery(() => api.getMeals(today), [today])
  const { data: todayGlucose } = useQuery(() => api.getGlucose({ from: today, to: today }))

  const chartData = useMemo(() => {
    const dates = lastNDays(7).reverse()
    const byDate = Object.fromEntries((weekRecords ?? []).map(r => [r.date, r]))
    return dates.map(date => ({
      label:   format(parseISO(date), 'EEE'),
      protein: byDate[date]?.proteinG   ?? 0,
      water:   byDate[date]?.waterOz    ?? 0,
    }))
  }, [weekRecords])

  async function handleQuickAdd(field, amount) {
    const rec = await api.getTodayNutrition()
    await api.updateNutrition(today, { [field]: (rec[field] ?? 0) + amount })
    refetchToday()
    toast.success(`+${amount} ${field === 'waterOz' ? 'oz water' : 'g protein'}`)
  }

  return (
    <div className="space-y-5">

      <Card>
        <CardHeader title="Today's Nutrition" action={
          <Button size="xs" onClick={() => setShowDayModal(true)}><Plus size={12} /> Edit</Button>
        } />
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-700">Protein</span>
              <span className="text-xs text-gray-500">{todayRecord?.proteinG ?? 0} / {PROTEIN_GOAL} g</span>
            </div>
            <ProgressBar value={todayRecord?.proteinG ?? 0} max={PROTEIN_GOAL}
              color={(todayRecord?.proteinG ?? 0) >= PROTEIN_GOAL ? 'green' : 'brand'} />
            <div className="flex gap-2 mt-2">
              {[10,20,30,40].map(n => (
                <button key={n} onClick={() => handleQuickAdd('proteinG', n)}
                  className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-lg hover:bg-brand-100">+{n}g</button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-700">Water</span>
              <span className="text-xs text-gray-500">{todayRecord?.waterOz ?? 0} / {WATER_GOAL} oz</span>
            </div>
            <ProgressBar value={todayRecord?.waterOz ?? 0} max={WATER_GOAL}
              color={(todayRecord?.waterOz ?? 0) >= WATER_GOAL ? 'green' : 'blue'} />
            <div className="flex gap-2 mt-2">
              {[8,12,16,24].map(n => (
                <button key={n} onClick={() => handleQuickAdd('waterOz', n)}
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-100">+{n}oz</button>
              ))}
            </div>
          </div>
          {(() => {
            const carbGoal = settings?.carbGoalG ?? 20
            const carbs    = todayRecord?.carbsG ?? 0
            const carbColor = carbs > carbGoal ? 'red' : carbs > carbGoal * 0.75 ? 'orange' : 'green'
            return (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">Net Carbs</span>
                  <span className="text-xs text-gray-500">{carbs} / {carbGoal} g goal</span>
                </div>
                <ProgressBar value={carbs} max={carbGoal} color={carbColor} />
                {carbs > carbGoal && (
                  <p className="text-[10px] text-red-500 mt-1">Over carb goal by {carbs - carbGoal}g</p>
                )}
              </div>
            )
          })()}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: 'Calories', value: todayRecord?.caloriesKcal, unit: 'kcal' },
              { label: 'Carbs',    value: todayRecord?.carbsG,       unit: 'g' },
              { label: 'Fat',      value: todayRecord?.fatG,         unit: 'g' },
            ].map(({ label, value, unit }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-2 text-center">
                <p className="text-lg font-bold text-gray-800">{value ?? 0}</p>
                <p className="text-[10px] text-gray-500">{unit} {label}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="7-Day Nutrition Trends" />
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="protein" name="Protein (g)" fill="#0ea5e9" radius={[4,4,0,0]} />
              <Bar dataKey="water"   name="Water (oz)"  fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardHeader title="Meals Today" action={
          <Button size="xs" onClick={() => setShowMealModal(true)}><Plus size={12} /> Add Meal</Button>
        } />
        {!meals?.length ? (
          <p className="text-sm text-gray-400 text-center py-4">No meals logged today</p>
        ) : (
          <ul className="space-y-2">
            {meals.map(meal => (
              <li key={meal.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <span className="text-sm font-medium text-gray-800">{meal.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{meal.mealType}</span>
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  {meal.proteinG     ? <span>{meal.proteinG}g P</span> : null}
                  {meal.caloriesKcal ? <span>{meal.caloriesKcal} kcal</span> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <NutritionGlucoseInsight
        nutrition={todayRecord}
        meals={meals ?? []}
        glucoseReadings={todayGlucose ?? []}
      />

      <EditDayModal isOpen={showDayModal} onClose={() => setShowDayModal(false)}
        record={todayRecord} onSaved={refetchToday} />
      <AddMealModal isOpen={showMealModal} onClose={() => setShowMealModal(false)}
        onSaved={() => { refetchMeals(); refetchToday() }} />
    </div>
  )
}

function EditDayModal({ isOpen, onClose, record, onSaved }) {
  const [form, setForm] = useState({ proteinG:'', carbsG:'', fatG:'', caloriesKcal:'', waterOz:'', notes:'' })
  useMemo(() => {
    if (record) setForm({ proteinG: record.proteinG??'', carbsG: record.carbsG??'', fatG: record.fatG??'',
      caloriesKcal: record.caloriesKcal??'', waterOz: record.waterOz??'', notes: record.notes??'' })
  }, [record?.id])
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    await api.updateNutrition(toDateStr(), {
      proteinG: Number(form.proteinG)||0, carbsG: Number(form.carbsG)||0,
      fatG: Number(form.fatG)||0, caloriesKcal: Number(form.caloriesKcal)||0,
      waterOz: Number(form.waterOz)||0, notes: form.notes,
    })
    toast.success('Nutrition updated!')
    onSaved()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Today's Nutrition">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {[['Protein (g)','proteinG'],['Carbs (g)','carbsG'],['Fat (g)','fatG'],
            ['Calories (kcal)','caloriesKcal'],['Water (oz)','waterOz']].map(([label, key]) => (
            <FormField key={key} label={label} htmlFor={key}>
              <Input id={key} type="number" min="0" value={form[key]}
                onChange={e => set(key, e.target.value)} placeholder="0" />
            </FormField>
          ))}
        </div>
        <FormField label="Notes" htmlFor="ntnotes">
          <Textarea id="ntnotes" rows={2} value={form.notes}
            onChange={e => set('notes', e.target.value)} placeholder="Optional notes..." />
        </FormField>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  )
}

function AddMealModal({ isOpen, onClose, onSaved }) {
  const [form, setForm] = useState({ name:'', mealType:'Breakfast', proteinG:'', carbsG:'', fatG:'', caloriesKcal:'', notes:'' })
  const [scanning, setScanning] = useState(false)
  const fileInputRef = useRef(null)
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      // dataUrl = "data:<mediaType>;base64,<data>"
      const [header, imageBase64] = dataUrl.split(',')
      const mediaType = header.match(/data:([^;]+)/)[1]
      const result = await api.analyzeMealPhoto({ imageBase64, mediaType })
      setForm(f => ({
        ...f,
        name:         result.name        ?? f.name,
        proteinG:     result.proteinG    != null ? String(result.proteinG)    : f.proteinG,
        carbsG:       result.carbsG      != null ? String(result.carbsG)      : f.carbsG,
        fatG:         result.fatG        != null ? String(result.fatG)        : f.fatG,
        caloriesKcal: result.caloriesKcal != null ? String(result.caloriesKcal) : f.caloriesKcal,
      }))
      toast.success('Meal identified — review and save!')
    } catch {
      toast.error('Could not analyze photo. Fill in manually.')
    } finally {
      setScanning(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const today = toDateStr()
    await api.addMeal({ ...form, date: today,
      proteinG: Number(form.proteinG)||0, carbsG: Number(form.carbsG)||0,
      fatG: Number(form.fatG)||0, caloriesKcal: Number(form.caloriesKcal)||0 })
    const rec = await api.getTodayNutrition()
    await api.updateNutrition(today, {
      proteinG:     (rec.proteinG??0)     + (Number(form.proteinG)||0),
      carbsG:       (rec.carbsG??0)       + (Number(form.carbsG)||0),
      fatG:         (rec.fatG??0)         + (Number(form.fatG)||0),
      caloriesKcal: (rec.caloriesKcal??0) + (Number(form.caloriesKcal)||0),
    })
    toast.success('Meal logged!')
    setForm({ name:'', mealType:'Breakfast', proteinG:'', carbsG:'', fatG:'', caloriesKcal:'', notes:'' })
    onSaved()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log a Meal">
      {/* hidden file input — accepts camera or gallery */}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={handlePhotoChange} />

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* AI scan button */}
        <button type="button" disabled={scanning}
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50 py-3 text-sm font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-60 transition-colors">
          {scanning
            ? <><Loader size={16} className="animate-spin" /> Analyzing photo…</>
            : <><Camera size={16} /> Scan Food Photo</>}
        </button>

        <FormField label="Meal Name" htmlFor="mname" required>
          <Input id="mname" value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. Grilled Chicken Salad" required />
        </FormField>
        <FormField label="Meal Type" htmlFor="mtype">
          <Select id="mtype" value={form.mealType} onChange={e => set('mealType', e.target.value)}>
            {['Breakfast','Lunch','Dinner','Snack'].map(t => <option key={t}>{t}</option>)}
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          {[['Protein (g)','proteinG'],['Carbs (g)','carbsG'],['Fat (g)','fatG'],['Calories','caloriesKcal']].map(([label, key]) => (
            <FormField key={key} label={label} htmlFor={`m${key}`}>
              <Input id={`m${key}`} type="number" min="0" value={form[key]}
                onChange={e => set(key, e.target.value)} placeholder="0" />
            </FormField>
          ))}
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Meal</Button>
        </div>
      </form>
    </Modal>
  )
}

function NutritionGlucoseInsight({ nutrition, meals, glucoseReadings }) {
  const [insight, setInsight]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const hasCarbs   = (nutrition?.carbsG ?? 0) > 0
  const hasGlucose = glucoseReadings.length > 0

  if (!hasCarbs || !hasGlucose) return null

  async function fetchInsight() {
    setLoading(true)
    setError(null)
    try {
      const result = await api.getNutritionGlucoseInsight({ nutrition, meals, glucoseReadings })
      setInsight(result.insight)
    } catch {
      setError('Could not load AI insight. Check that ANTHROPIC_API_KEY is configured.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="AI Insight" subtitle="How your carbs affected glucose today" />
      {insight ? (
        <div className="bg-purple-50 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <Sparkles size={16} className="text-purple-600 mt-0.5 shrink-0" />
            <p className="text-sm text-purple-900">{insight}</p>
          </div>
          <button onClick={() => setInsight(null)}
            className="mt-2 text-xs text-purple-500 hover:text-purple-700">
            Refresh
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-2">
          <p className="text-xs text-gray-500">
            You logged <strong>{nutrition?.carbsG ?? 0}g carbs</strong> and have{' '}
            <strong>{glucoseReadings.length}</strong> glucose reading{glucoseReadings.length !== 1 ? 's' : ''} today.
            Get AI feedback on how this meal affected your levels.
          </p>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button size="xs" onClick={fetchInsight} disabled={loading}>
            <Sparkles size={12} />
            {loading ? 'Analyzing…' : 'Get AI Insight'}
          </Button>
        </div>
      )}
    </Card>
  )
}
