import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useQuery } from '../hooks/useQuery'
import { MEDICATIONS, DAYS_OF_WEEK } from '../utils/constants'
import { requestPermission, scheduleInjectionReminder } from '../utils/notifications'
import Card, { CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { FormField, Input, Select, Textarea } from '../components/ui/FormField'
import {
  Shield, Database, Download, Upload, AlertTriangle, CheckCircle,
  Zap, LineChart, FileText, BookOpen, Salad, Activity, ChevronRight, Stethoscope,
  Clock, Server,
} from 'lucide-react'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'
import { Stagger, StaggerItem, FadeUp } from '../components/motion/primitives'
import { motion } from 'framer-motion'

const EMPTY = {
  // Profile
  name: '', age: '', weightLbs: '', heightIn: '', goalWeightLbs: '', notes: '',
  diagnosisDate: '', ketoStartDate: '', appointmentDate: '',
  // Medication
  medicationName: 'Mounjaro', startingDoseMg: '', currentDoseMg: '',
  startDate: '', injectionDay: 'Sunday', injectionTime: '09:00',
  // Units / Settings
  weightUnit: 'lbs', glucoseUnit: 'mg/dL', waterUnit: 'oz',
  carbGoalG: 20,
  notifications: false,
}

// "More" sections — navigation cards in the You hub.
const HUB_SECTIONS = [
  {
    label: 'Tracking',
    items: [
      { to: '/wellbeing',   label: 'Well-being',   sub: 'Mood, energy, hunger, sleep',         icon: Zap,      tone: '#dde9d3', color: '#365314' },
      { to: '/nutrition',   label: 'Nutrition',    sub: 'Protein, water, daily intake',        icon: Salad,    tone: '#dceef7', color: '#0c4a6e' },
      { to: '/sideeffects', label: 'Side Effects', sub: 'Track GI, fatigue, headaches',        icon: Activity, tone: '#fce4d8', color: '#9a3412' },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { to: '/insights',    label: 'Insights',         sub: 'Stage analysis, trends, predictions', icon: LineChart,    tone: '#ede5f4', color: '#4c1d95' },
      { to: '/reports',     label: 'Reports',          sub: '30-day summary, exports',             icon: FileText,     tone: '#fce4d8', color: '#9a3412' },
      { to: '/medical',     label: 'Medical Records',  sub: 'Labs, vitals, diagnoses, history',    icon: Stethoscope,  tone: '#dbeafe', color: '#1e40af' },
      { to: '/knowledge',   label: 'Learn',            sub: 'Knowledge base for GLP-1s',           icon: BookOpen,     tone: '#fbeed8', color: '#92521b' },
    ],
  },
]

export default function Settings() {
  const { data: profile,  refetch: refetchProfile  } = useQuery(api.getProfile)
  const { data: settings, refetch: refetchSettings } = useQuery(api.getSettings)

  const [form,  setForm]  = useState(EMPTY)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  // Populate form once both records load (id-based guard prevents reset on refetch)
  useEffect(() => {
    if (!profile || !settings) return
    setForm({
      name:           profile.name           ?? '',
      age:            profile.age            ?? '',
      weightLbs:      profile.weightLbs      ?? '',
      heightIn:       profile.heightIn       ?? '',
      goalWeightLbs:  profile.goalWeightLbs  ?? '',
      notes:          profile.notes          ?? '',
      diagnosisDate:   profile.diagnosisDate   ?? '',
      ketoStartDate:   profile.ketoStartDate   ?? '',
      appointmentDate: profile.appointmentDate ?? '',
      medicationName: profile.medicationName ?? 'Mounjaro',
      startingDoseMg: profile.startingDoseMg ?? '',
      currentDoseMg:  profile.currentDoseMg  ?? '',
      startDate:      profile.startDate      ?? '',
      injectionDay:   profile.injectionDay   ?? 'Sunday',
      injectionTime:  profile.injectionTime  ?? '09:00',
      weightUnit:     settings.weightUnit    ?? 'lbs',
      glucoseUnit:    settings.glucoseUnit   ?? 'mg/dL',
      waterUnit:      settings.waterUnit     ?? 'oz',
      carbGoalG:      settings.carbGoalG     ?? 20,
      notifications:  Boolean(settings.notifications),
    })
    setDirty(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, settings?.id])

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setDirty(true) }

  async function handleNotificationToggle() {
    const next = !form.notifications
    if (next) {
      const granted = await requestPermission()
      if (!granted) { toast.error('Notification permission denied'); return }
      if (form.injectionDay && form.injectionTime) {
        scheduleInjectionReminder(form.injectionDay, form.injectionTime)
      }
    }
    set('notifications', next)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await Promise.all([
        api.saveProfile({
          ...profile,
          name:           form.name,
          age:            Number(form.age)           || null,
          weightLbs:      Number(form.weightLbs)     || null,
          heightIn:       Number(form.heightIn)      || null,
          goalWeightLbs:  Number(form.goalWeightLbs) || null,
          notes:          form.notes,
          diagnosisDate:   form.diagnosisDate   || null,
          ketoStartDate:   form.ketoStartDate   || null,
          appointmentDate: form.appointmentDate || null,
          medicationName: form.medicationName,
          startingDoseMg: Number(form.startingDoseMg) || null,
          currentDoseMg:  Number(form.currentDoseMg)  || null,
          startDate:      form.startDate,
          injectionDay:   form.injectionDay,
          injectionTime:  form.injectionTime,
        }),
        api.saveSettings({
          ...settings,
          weightUnit:    form.weightUnit,
          glucoseUnit:   form.glucoseUnit,
          waterUnit:     form.waterUnit,
          carbGoalG:     Number(form.carbGoalG) || 20,
          notifications: form.notifications ? 1 : 0,
        }),
      ])
      await Promise.all([refetchProfile(), refetchSettings()])
      toast.success('Settings saved!')
      setDirty(false)
    } catch (err) {
      toast.error('Save failed — ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const medDef = MEDICATIONS[form.medicationName] ?? MEDICATIONS.Ozempic
  const navigate = useNavigate()

  return (
    <div className="space-y-6">

      {/* ── Hub: links to non-primary tracking & analysis pages ─────────── */}
      {HUB_SECTIONS.map((section, sIdx) => (
        <FadeUp key={section.label} delay={0.05 + sIdx * 0.06}>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-wood-600 mb-2 px-1">
            {section.label}
          </p>
          <Stagger className="space-y-2">
            {section.items.map(item => (
              <StaggerItem key={item.to}>
                <HubRow {...item} onClick={() => navigate(item.to)} />
              </StaggerItem>
            ))}
          </Stagger>
        </FadeUp>
      ))}

      <FadeUp delay={0.25}>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-wood-600 mb-2 px-1">
          Settings
        </p>
      </FadeUp>

      {/* ── Profile ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader title="Profile" />
        <div className="space-y-3">
          <FormField label="Name" htmlFor="pname">
            <Input id="pname" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Your name" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            {[['Age', 'age', 'Years'], ['Height (in)', 'heightIn', 'e.g. 67'],
              ['Starting Weight (lbs)', 'weightLbs', 'lbs'], ['Goal Weight (lbs)', 'goalWeightLbs', 'lbs'],
            ].map(([label, key, ph]) => (
              <FormField key={key} label={label} htmlFor={`p${key}`}>
                <Input id={`p${key}`} type="number" step="0.1" value={form[key]}
                  onChange={e => set(key, e.target.value)} placeholder={ph} />
              </FormField>
            ))}
          </div>
          <FormField label="Notes / Goals" htmlFor="pnotes">
            <Textarea id="pnotes" rows={2} value={form.notes}
              onChange={e => set('notes', e.target.value)} placeholder="Personal goals, notes..." />
          </FormField>
          <div className="pt-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Health Journey Dates</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Diagnosis Date" htmlFor="diagDate">
                <Input id="diagDate" type="date" value={form.diagnosisDate}
                  onChange={e => set('diagnosisDate', e.target.value)} />
              </FormField>
              <FormField label="Keto / Diet Start" htmlFor="ketoDate">
                <Input id="ketoDate" type="date" value={form.ketoStartDate}
                  onChange={e => set('ketoStartDate', e.target.value)} />
              </FormField>
            </div>
            <FormField label="Next Doctor Appointment" htmlFor="apptDate">
              <Input id="apptDate" type="date" value={form.appointmentDate}
                onChange={e => set('appointmentDate', e.target.value)} />
            </FormField>
            <p className="text-xs text-gray-400 mt-1.5">Used to anchor charts, insight timelines, and show appointment countdown.</p>
          </div>
        </div>
      </Card>

      {/* ── Medication ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader title="Medication" />
        <div className="space-y-3">
          <FormField label="Medication" htmlFor="smed">
            <Select id="smed" value={form.medicationName}
              onChange={e => set('medicationName', e.target.value)}>
              {Object.keys(MEDICATIONS).map(m => <option key={m}>{m}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            {[['Starting Dose (mg)', 'startingDoseMg'], ['Current Dose (mg)', 'currentDoseMg']].map(([label, key]) => (
              <FormField key={key} label={label} htmlFor={`s${key}`}>
                {medDef.doses.length ? (
                  <Select id={`s${key}`} value={form[key]} onChange={e => set(key, e.target.value)}>
                    {medDef.doses.map(d => <option key={d} value={d}>{d} mg</option>)}
                  </Select>
                ) : (
                  <Input id={`s${key}`} type="number" step="0.01" value={form[key]}
                    onChange={e => set(key, e.target.value)} />
                )}
              </FormField>
            ))}
          </div>
          <FormField label="Start Date" htmlFor="sdate">
            <Input id="sdate" type="date" value={form.startDate}
              onChange={e => set('startDate', e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Injection Day" htmlFor="sday">
              <Select id="sday" value={form.injectionDay}
                onChange={e => set('injectionDay', e.target.value)}>
                {DAYS_OF_WEEK.map(d => <option key={d}>{d}</option>)}
              </Select>
            </FormField>
            <FormField label="Injection Time" htmlFor="stime">
              <Input id="stime" type="time" value={form.injectionTime}
                onChange={e => set('injectionTime', e.target.value)} />
            </FormField>
          </div>
          {medDef.escalation?.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-blue-700 mb-2">
                Standard Escalation — {form.medicationName}
              </p>
              <div className="space-y-1">
                {medDef.escalation.map(e => (
                  <p key={e.week} className="text-xs text-blue-700">Week {e.week}: {e.dose} mg</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Units ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader title="Units" />
        <div className="space-y-3">
          <FormField label="Weight" htmlFor="uwt">
            <Select id="uwt" value={form.weightUnit}
              onChange={e => set('weightUnit', e.target.value)}>
              <option value="lbs">Pounds (lbs)</option>
              <option value="kg">Kilograms (kg)</option>
            </Select>
          </FormField>
          <FormField label="Glucose" htmlFor="ugl">
            <Select id="ugl" value={form.glucoseUnit}
              onChange={e => set('glucoseUnit', e.target.value)}>
              <option value="mg/dL">mg/dL</option>
              <option value="mmol/L">mmol/L</option>
            </Select>
          </FormField>
          <FormField label="Water" htmlFor="uwt2">
            <Select id="uwt2" value={form.waterUnit}
              onChange={e => set('waterUnit', e.target.value)}>
              <option value="oz">Fluid ounces (oz)</option>
              <option value="ml">Milliliters (ml)</option>
            </Select>
          </FormField>
          <FormField label="Daily Carb Limit (g)" htmlFor="carbgoal">
            <Input id="carbgoal" type="number" min="5" max="300" value={form.carbGoalG}
              onChange={e => set('carbGoalG', e.target.value)} placeholder="20" />
          </FormField>
          <p className="text-xs text-gray-400 -mt-1">Strict keto = 20 g · Moderate keto = 50 g · Low-carb = 100 g</p>
        </div>
      </Card>

      {/* ── Notifications ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader title="Notifications" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Browser Notifications</p>
            <p className="text-xs text-gray-500">Injection reminders, hydration alerts</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Permission:{' '}
              {typeof Notification !== 'undefined'
                ? Notification.permission === 'granted' ? '✅ Granted'
                  : Notification.permission === 'denied' ? '❌ Denied'
                  : '⏳ Not set'
                : 'Not supported'}
            </p>
          </div>
          <button onClick={handleNotificationToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${form.notifications ? 'bg-brand-500' : 'bg-gray-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
              ${form.notifications ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </Card>

      {/* ── Single Save ───────────────────────────────────────────────────── */}
      <Button onClick={handleSave} fullWidth disabled={!dirty || saving}>
        {saving ? 'Saving…' : dirty ? 'Save All Settings' : 'All Settings Saved'}
      </Button>

      {/* ── Backup & Restore ──────────────────────────────────────────────── */}
      <BackupRestoreSection
        lastBackupAt={settings?.lastBackupAt}
        onBackupComplete={refetchSettings}
      />

      {/* ── Privacy ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader title="Privacy & Data" />
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <Shield size={16} className="text-green-600 mt-0.5 shrink-0" />
            <p>All data is stored in SQLite on your private server. Nothing is sent to third-party services.</p>
          </div>
          <div className="flex items-start gap-2">
            <Database size={16} className="text-blue-600 mt-0.5 shrink-0" />
            <p>The database file lives in a Docker volume at{' '}
              <code className="text-xs bg-gray-100 px-1 rounded">/data/glp1.db</code>.
              Use Backup below for portable exports.
            </p>
          </div>
        </div>
      </Card>

    </div>
  )
}

// ── Backup & Restore ──────────────────────────────────────────────────────────

function BackupRestoreSection({ lastBackupAt, onBackupComplete }) {
  const [restoreModal,   setRestoreModal]   = useState(false)
  const [restoreFile,    setRestoreFile]    = useState(null)
  const [restoring,      setRestoring]      = useState(false)
  const [downloading,    setDownloading]    = useState(false)
  const [serverBackups,  setServerBackups]  = useState(null)   // null = not loaded yet
  const [loadingBackups, setLoadingBackups] = useState(false)

  const daysSinceBackup = useMemo(() => {
    if (!lastBackupAt) return null
    return Math.floor((Date.now() - new Date(lastBackupAt).getTime()) / 86_400_000)
  }, [lastBackupAt])

  // 'loading' while settings haven't arrived, then 'never' | 'ok' | 'warn' | 'overdue'
  const backupStatus = lastBackupAt === undefined ? 'loading'
    : !lastBackupAt                               ? 'never'
    : daysSinceBackup < 7                         ? 'ok'
    : daysSinceBackup < 14                        ? 'warn'
    :                                               'overdue'

  async function handleBackup() {
    setDownloading(true)
    try {
      const data = await api.exportData()
      triggerDownload(data, `glp1-backup-${new Date().toISOString().slice(0, 10)}.json`)
      toast.success('Backup downloaded — all 16 tables included!')
      onBackupComplete?.()
    } catch (err) {
      toast.error('Backup failed — ' + err.message)
    } finally {
      setDownloading(false)
    }
  }

  async function loadServerBackups() {
    setLoadingBackups(true)
    try {
      setServerBackups(await api.listServerBackups())
    } catch {
      setServerBackups([])
    } finally {
      setLoadingBackups(false)
    }
  }

  async function downloadServerBackup(date) {
    try {
      const data = await api.downloadServerBackup(date)
      triggerDownload(data, `glp1-backup-${date}.json`)
      toast.success(`Server backup ${date} downloaded!`)
    } catch (err) {
      toast.error('Download failed — ' + err.message)
    }
  }

  function triggerDownload(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.json')) { toast.error('Select a .json backup file'); return }
    setRestoreFile(file)
    setRestoreModal(true)
    e.target.value = ''
  }

  async function confirmRestore() {
    if (!restoreFile) return
    setRestoring(true)
    try {
      const data   = JSON.parse(await restoreFile.text())
      const result = await api.importData(data)
      if (result.warning) {
        toast.error(result.warning, { duration: 7000 })
      } else {
        toast.success('Data restored! Reload to see your data.')
      }
      if (!result.medicalRestored) {
        toast('Medical records not in this backup — existing records kept.', { icon: 'ℹ️', duration: 5000 })
      }
      setRestoreModal(false)
      setRestoreFile(null)
    } catch (err) {
      toast.error('Restore failed — ' + (err.message ?? 'invalid file'))
    } finally {
      setRestoring(false)
    }
  }

  // Color scheme per backup freshness
  const scheme = {
    ok:      { banner: 'bg-green-50 border border-green-200',  title: 'text-green-800', sub: 'text-green-600'  },
    warn:    { banner: 'bg-amber-50 border border-amber-200',  title: 'text-amber-800', sub: 'text-amber-700'  },
    never:   { banner: 'bg-red-50   border border-red-200',    title: 'text-red-800',   sub: 'text-red-700'    },
    overdue: { banner: 'bg-red-50   border border-red-200',    title: 'text-red-800',   sub: 'text-red-700'    },
    loading: { banner: 'bg-gray-50  border border-gray-200',   title: 'text-gray-600',  sub: 'text-gray-400'   },
  }[backupStatus]

  const reminderMsg = {
    loading: ['Checking backup status…',                                       ''],
    ok:      [`Last backup: ${daysSinceBackup === 0 ? 'today' : `${daysSinceBackup}d ago`}`, 'You\'re within the weekly window.'],
    warn:    [`Last backup: ${daysSinceBackup} days ago`,                      'Recommended: download a fresh backup weekly.'],
    never:   ['No backup downloaded yet',                                      'Download a backup now to protect your health data.'],
    overdue: [`Backup overdue — ${daysSinceBackup} days since last`,           'Download a backup now to protect your health data.'],
  }[backupStatus]

  return (
    <>
      <Card>
        <CardHeader title="Backup & Restore" subtitle="All 16 tables — glucose, injections, weight, photos, medical records" />
        <div className="space-y-3">

          {/* Backup reminder banner */}
          <div className={`flex items-center gap-3 p-3 rounded-xl ${scheme.banner}`}>
            <Clock size={16} className={`shrink-0 ${scheme.title}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${scheme.title}`}>{reminderMsg[0]}</p>
              {reminderMsg[1] && <p className={`text-xs mt-0.5 ${scheme.sub}`}>{reminderMsg[1]}</p>}
            </div>
          </div>

          {/* Manual backup */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-green-900">Download Backup</p>
              <p className="text-xs text-green-700 mt-0.5">
                Exports all 16 tables — glucose, injections, nutrition, weight, photos, medical records, and settings.
              </p>
            </div>
            <Button size="sm" onClick={handleBackup} disabled={downloading} className="shrink-0 ml-3">
              <Download size={14} />
              {downloading ? 'Exporting…' : 'Backup'}
            </Button>
          </div>

          {/* Restore from file */}
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-orange-900">Restore from Backup</p>
              <p className="text-xs text-orange-700 mt-0.5">
                Replaces ALL current data with a backup file. This cannot be undone.
              </p>
            </div>
            <label className="shrink-0 ml-3 cursor-pointer">
              <input type="file" accept=".json" className="hidden" onChange={handleFileChange} />
              <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5
                bg-orange-100 text-orange-800 border border-orange-200 rounded-lg
                hover:bg-orange-200 transition-colors">
                <Upload size={14} />
                Restore
              </span>
            </label>
          </div>

          {/* Server-side backup list */}
          <div className="border-t border-wood-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Server size={13} className="text-gray-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Daily Server Backups</p>
              </div>
              <button onClick={loadServerBackups} disabled={loadingBackups}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50">
                {loadingBackups ? 'Loading…' : serverBackups === null ? 'Show' : 'Refresh'}
              </button>
            </div>

            {serverBackups !== null && (
              serverBackups.length === 0
                ? <p className="text-xs text-gray-400 text-center py-2 italic">No server backups yet. First backup runs 10 s after container starts.</p>
                : <div className="space-y-1">
                    {serverBackups.map(b => (
                      <div key={b.date} className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-700">{b.date}</span>
                          <span className="text-[10px] text-gray-400">{(b.size / 1024).toFixed(0)} KB</span>
                        </div>
                        <button onClick={() => downloadServerBackup(b.date)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-semibold">
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
            )}
            <p className="text-xs text-gray-400 mt-2">Server keeps 14 rolling daily backups, separate from manual downloads.</p>
          </div>

        </div>
      </Card>

      {/* Restore confirmation modal */}
      <Modal isOpen={restoreModal} onClose={() => { setRestoreModal(false); setRestoreFile(null) }}
        title="Restore from Backup?" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
            <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">This will replace ALL your data</p>
              <p className="text-xs text-red-700 mt-1">
                Every glucose reading, injection, weight log, meal, photo, and setting will be
                overwritten by the contents of <strong>{restoreFile?.name}</strong>.
                This cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
            <CheckCircle size={16} className="text-gray-500 shrink-0" />
            <p className="text-xs text-gray-600">
              Tip: download a fresh backup first so you can roll back if needed.
            </p>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="secondary" onClick={() => { setRestoreModal(false); setRestoreFile(null) }}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmRestore} disabled={restoring}>
              {restoring ? 'Restoring…' : 'Yes, Restore Everything'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ── Hub row — large icon-tile link, used for navigation in the You hub ────
function HubRow({ icon: Icon, label, sub, tone, color, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.12 }}
      className="w-full text-left flex items-center gap-3 p-3.5 rounded-2xl bg-[#fffaf3] shadow-tile hover:bg-[#fff7eb] transition-colors"
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: tone, color }}
      >
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-wood-900">{label}</p>
        <p className="text-[11px] text-wood-600 mt-0.5 truncate">{sub}</p>
      </div>
      <ChevronRight size={16} className="text-wood-400 shrink-0" />
    </motion.button>
  )
}
