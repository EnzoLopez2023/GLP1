import { useState, useMemo, useEffect } from 'react'
import { api } from '../api/client'
import { useQuery } from '../hooks/useQuery'
import { toDateStr, lastNDays } from '../utils/dateHelpers'
import { format, parseISO } from 'date-fns'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import Card, { CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { FormField, ScaleInput, Input, Textarea } from '../components/ui/FormField'
import { Zap, Moon, Smile, Utensils, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Wellbeing() {
  const { data: todayRecord, refetch } = useQuery(api.getTodayWellbeing)
  const { data: weekRecords } = useQuery(() => {
    const dates = lastNDays(14)
    return api.getWellbeingRange(dates[dates.length - 1], dates[0])
  })

  const trendData = useMemo(() => {
    const dates = lastNDays(14).reverse()
    const byDate = Object.fromEntries((weekRecords ?? []).map(r => [r.date, r]))
    return dates.map(date => ({
      label:        format(parseISO(date), 'MM/dd'),
      mood:         byDate[date]?.mood         ?? null,
      energy:       byDate[date]?.energy       ?? null,
      hunger:       byDate[date]?.hunger       ?? null,
      sleepQuality: byDate[date]?.sleepQuality ?? null,
    }))
  }, [weekRecords])

  const radarData = todayRecord ? [
    { metric: 'Mood',   value: todayRecord.mood         ?? 0 },
    { metric: 'Energy', value: todayRecord.energy       ?? 0 },
    { metric: 'Hunger', value: todayRecord.hunger       ?? 0 },
    { metric: 'Sleep',  value: todayRecord.sleepQuality ?? 0 },
  ] : []

  return (
    <div className="space-y-5">
      <TodayCheckin record={todayRecord} onSaved={refetch} />

      {radarData.length > 0 && radarData.some(d => d.value > 0) && (
        <Card>
          <CardHeader title="Today's Overview" />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <Radar name="Today" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="14-Day Trends" />
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top:4, right:8, bottom:4, left:-20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
              <YAxis tick={{ fontSize: 10 }} domain={[0,10]} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="mood"         name="Mood"   stroke="#f59e0b" dot={false} connectNulls />
              <Line type="monotone" dataKey="energy"       name="Energy" stroke="#10b981" dot={false} connectNulls />
              <Line type="monotone" dataKey="hunger"       name="Hunger" stroke="#ef4444" dot={false} connectNulls />
              <Line type="monotone" dataKey="sleepQuality" name="Sleep"  stroke="#6366f1" dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

function TodayCheckin({ record, onSaved }) {
  const [form, setForm] = useState({ mood:5, energy:5, hunger:5, sleepHours:'', sleepQuality:5, notes:'' })

  useEffect(() => {
    if (record) setForm({
      mood:         record.mood         ?? 5,
      energy:       record.energy       ?? 5,
      hunger:       record.hunger       ?? 5,
      sleepHours:   record.sleepHours   ?? '',
      sleepQuality: record.sleepQuality ?? 5,
      notes:        record.notes        ?? '',
    })
  }, [record?.id])

  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    await api.updateWellbeing(toDateStr(), {
      mood: form.mood, energy: form.energy, hunger: form.hunger,
      sleepHours: Number(form.sleepHours) || null,
      sleepQuality: form.sleepQuality, notes: form.notes,
    })
    toast.success("Today's well-being saved!")
    onSaved()
  }

  return (
    <Card>
      <CardHeader title="Today's Check-in" />
      <div className="space-y-5">
        {[
          { key:'mood',         label:'Mood',          icon: Smile,    iconClass:'text-yellow-500', labels:['😔 Low','😊 Great'] },
          { key:'energy',       label:'Energy',        icon: Zap,      iconClass:'text-green-500',  labels:['😴 Drained','⚡ Full energy'] },
          { key:'hunger',       label:'Hunger',        icon: Utensils, iconClass:'text-red-400',    labels:['😌 Not hungry','🍽️ Very hungry'] },
          { key:'sleepQuality', label:'Sleep Quality', icon: Moon,     iconClass:'text-indigo-500', labels:['😩 Poor','😴 Excellent'] },
        ].map(({ key, label, icon: Icon, iconClass, labels }) => (
          <div key={key}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className={iconClass} />
              <span className="text-sm font-medium text-gray-700">{label}: {form[key]}/10</span>
            </div>
            <ScaleInput value={form[key]} onChange={v => set(key, v)} labels={labels} />
          </div>
        ))}
        <div>
          <Input type="number" step="0.5" min="0" max="24" placeholder="Hours slept (optional)"
            value={form.sleepHours} onChange={e => set('sleepHours', e.target.value)} />
        </div>
        <FormField label="Notes" htmlFor="wbnotes">
          <Textarea id="wbnotes" rows={2} placeholder="How are you feeling today?"
            value={form.notes} onChange={e => set('notes', e.target.value)} />
        </FormField>
        <Button fullWidth onClick={handleSave}><Save size={16} /> Save Today's Log</Button>
      </div>
    </Card>
  )
}
