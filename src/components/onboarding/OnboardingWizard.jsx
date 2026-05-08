// First-launch profile wizard. Shown when the user's per-user DB is fresh
// (every required field is null/empty). Captures the 5 required fields plus
// an optional medication step. Once submitted via api.saveProfile, the gate
// in App.jsx unmounts the wizard and routes the user to the dashboard.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Check, Droplets, Syringe, Scale, BookOpen, Sparkles } from 'lucide-react'
import { api } from '../../api/client'
import { MEDICATIONS } from '../../utils/constants'
import { FormField, Input, Select } from '../ui/FormField'
import Button from '../ui/Button'
import { ease } from '../motion/primitives'
import toast from 'react-hot-toast'

const TOTAL_STEPS = 4

const EMPTY_FORM = {
  name:           '',
  age:            '',
  heightFt:       '',
  heightIn:       '',
  weightLbs:      '',
  goalWeightLbs:  '',
  medicationName: 'Ozempic',
  startDate:      '',
  currentDoseMg:  '',
}

// Per-step required-field validation. Returns { ok, error }.
function validateStep(step, form) {
  const num = (v) => Number(v)
  switch (step) {
    case 1: {
      if (!form.name.trim()) return { ok: false, error: 'Please enter your name.' }
      return { ok: true }
    }
    case 2: {
      const age = num(form.age)
      if (!age || age < 13 || age > 120) return { ok: false, error: 'Age should be between 13 and 120.' }
      const ft  = num(form.heightFt) || 0
      const inc = num(form.heightIn) || 0
      const total = ft * 12 + inc
      if (total < 36 || total > 96) return { ok: false, error: 'Height should be between 3′0″ and 8′0″.' }
      return { ok: true }
    }
    case 3: {
      const w = num(form.weightLbs)
      const g = num(form.goalWeightLbs)
      if (!w || w < 50 || w > 1000) return { ok: false, error: 'Starting weight should be between 50 and 1000 lb.' }
      if (!g || g < 50 || g > 1000) return { ok: false, error: 'Goal weight should be between 50 and 1000 lb.' }
      return { ok: true }
    }
    case 4:
      // Step 4 is fully optional — both Skip and Finish always submit.
      return { ok: true }
    default:
      return { ok: true }
  }
}

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep]       = useState(1)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [saving, setSaving]   = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const goNext = () => {
    const v = validateStep(step, form)
    if (!v.ok) { toast.error(v.error); return }
    setStep(s => Math.min(TOTAL_STEPS, s + 1))
  }

  const goBack = () => setStep(s => Math.max(1, s - 1))

  async function submit({ skipMedication = false } = {}) {
    // Re-validate every prior step before submitting, in case the user used
    // Back to skip past one without filling it.
    for (let s = 1; s <= 3; s++) {
      const v = validateStep(s, form)
      if (!v.ok) { setStep(s); toast.error(v.error); return }
    }
    setSaving(true)
    try {
      const heightIn = (Number(form.heightFt) || 0) * 12 + (Number(form.heightIn) || 0)
      const payload = {
        name:          form.name.trim(),
        age:           Number(form.age),
        heightIn,
        weightLbs:     Number(form.weightLbs),
        goalWeightLbs: Number(form.goalWeightLbs),
      }
      if (!skipMedication && form.medicationName && form.startDate) {
        payload.medicationName = form.medicationName
        payload.startDate      = form.startDate
        if (form.currentDoseMg) payload.currentDoseMg = Number(form.currentDoseMg)
      }
      await api.saveProfile(payload)
      toast.success(`Welcome, ${payload.name.split(' ')[0]}!`)
      onComplete?.()
    } catch (err) {
      toast.error('Could not save profile — ' + (err.message ?? 'try again'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-wood-50 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 flex items-center justify-between">
        <Wordmark />
        <StepPips step={step} total={TOTAL_STEPS} />
      </div>

      {/* Scrollable body — step content + nav buttons inline */}
      <div className="flex-1 overflow-y-auto px-5">
        <div className="max-w-md mx-auto pt-6 pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: ease.outCubic }}
            >
              {step === 1 && <StepWelcome form={form} set={set} />}
              {step === 2 && <StepAboutYou form={form} set={set} />}
              {step === 3 && <StepNumbers form={form} set={set} />}
              {step === 4 && <StepMedication form={form} set={set} />}
            </motion.div>
          </AnimatePresence>

          {/* Nav buttons sit right below the step fields, inside the scroll area */}
          <div className="flex items-center justify-between gap-3 mt-8">
            {step > 1 ? (
              <Button variant="ghost" size="md" onClick={goBack} disabled={saving}>
                <ArrowLeft size={16} /> Back
              </Button>
            ) : <span />}

            {step < TOTAL_STEPS ? (
              <Button onClick={goNext} disabled={saving}>
                Continue <ArrowRight size={16} />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => submit({ skipMedication: true })} disabled={saving}>
                  Skip for now
                </Button>
                <Button onClick={() => submit()} disabled={saving}>
                  {saving ? 'Saving…' : <>Finish <Check size={16} /></>}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Steps ──────────────────────────────────────────────────────────────────
function StepWelcome({ form, set }) {
  const features = [
    { Icon: Droplets, label: 'Blood Glucose',   desc: 'Log readings, spot trends, estimate A1C' },
    { Icon: Syringe,  label: 'Injections',       desc: 'Track doses, dates, and titration stages' },
    { Icon: Scale,    label: 'Weight Journey',   desc: 'Chart your progress from day one' },
    { Icon: BookOpen, label: 'Knowledge Base',   desc: 'The science behind GLP-1s and keto' },
  ]

  return (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-wood-600 mb-1.5">Welcome</p>
      <h2 className="display text-3xl font-bold text-wood-900 leading-tight mb-2">
        Your GLP-1 health companion
      </h2>
      <p className="text-sm text-wood-700 mb-5 leading-relaxed">
        Tare is built for people navigating GLP-1 treatment — tracking glucose,
        weight, injections, side effects, and the science behind it all,
        in one place designed just for this journey.
      </p>

      {/* Feature grid */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {features.map(({ Icon, label, desc }) => (
          <div key={label} className="bg-[#fffaf3] border border-wood-200/60 rounded-xl p-3">
            <Icon size={16} className="text-brand-500 mb-1.5" />
            <p className="text-xs font-semibold text-wood-900 leading-snug">{label}</p>
            <p className="text-[11px] text-wood-500 leading-snug mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      {/* Why Tare */}
      <div className="flex gap-2.5 bg-brand-50 border border-brand-100 rounded-xl px-3 py-3 mb-6">
        <Sparkles size={14} className="text-brand-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-brand-800 mb-0.5">Why "Tare"?</p>
          <p className="text-[12px] text-brand-700 leading-relaxed">
            In measurement, <em>tare</em> means resetting the scale to zero — so you
            only measure what actually changed. Every injection day is a new baseline.
            Tare helps you see real progress, not noise.
          </p>
        </div>
      </div>

      <FormField label="What should we call you?" htmlFor="ob-name" required>
        <Input
          id="ob-name"
          autoFocus
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="Your name"
        />
      </FormField>
    </>
  )
}

function StepAboutYou({ form, set }) {
  return (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-wood-600 mb-1.5">About you</p>
      <h2 className="display text-3xl font-bold text-wood-900 leading-tight mb-2">
        Tell us a little about yourself
      </h2>
      <p className="text-sm text-wood-700 mb-6 leading-relaxed">
        We'll use this to size your charts and personalize estimates.
      </p>

      <div className="space-y-4">
        <FormField label="Age" htmlFor="ob-age" required>
          <Input
            id="ob-age"
            type="number"
            inputMode="numeric"
            min={13}
            max={120}
            value={form.age}
            onChange={e => set('age', e.target.value)}
            placeholder="Years"
          />
        </FormField>

        <div>
          <label className="block text-sm font-medium text-wood-800 mb-1">
            Height <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              inputMode="numeric"
              min={3}
              max={8}
              value={form.heightFt}
              onChange={e => set('heightFt', e.target.value)}
              placeholder="ft"
            />
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={11}
              value={form.heightIn}
              onChange={e => set('heightIn', e.target.value)}
              placeholder="in"
            />
          </div>
        </div>
      </div>
    </>
  )
}

function StepNumbers({ form, set }) {
  return (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-wood-600 mb-1.5">Your numbers</p>
      <h2 className="display text-3xl font-bold text-wood-900 leading-tight mb-2">
        Where you're starting, where you're going
      </h2>
      <p className="text-sm text-wood-700 mb-6 leading-relaxed">
        Both numbers anchor your progress charts and goal-tracking.
      </p>

      <div className="space-y-4">
        <FormField label="Starting weight (lbs)" htmlFor="ob-start" required>
          <Input
            id="ob-start"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={50}
            max={1000}
            value={form.weightLbs}
            onChange={e => set('weightLbs', e.target.value)}
            placeholder="e.g. 220"
          />
        </FormField>

        <FormField label="Goal weight (lbs)" htmlFor="ob-goal" required>
          <Input
            id="ob-goal"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={50}
            max={1000}
            value={form.goalWeightLbs}
            onChange={e => set('goalWeightLbs', e.target.value)}
            placeholder="e.g. 180"
          />
        </FormField>
      </div>
    </>
  )
}

function StepMedication({ form, set }) {
  const meds = Object.keys(MEDICATIONS)
  const medDef = MEDICATIONS[form.medicationName] ?? MEDICATIONS.Ozempic
  return (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-wood-600 mb-1.5">Medication · optional</p>
      <h2 className="display text-3xl font-bold text-wood-900 leading-tight mb-2">
        Are you on a GLP-1 yet?
      </h2>
      <p className="text-sm text-wood-700 mb-6 leading-relaxed">
        Telling us now lights up the dashboard's dose timeline, journey widget, and stage insights.
        Don't have it nailed down? Tap <span className="font-medium">Skip for now</span> — you can fill this in later from Settings.
      </p>

      <div className="space-y-4">
        <FormField label="Medication" htmlFor="ob-med">
          <Select id="ob-med" value={form.medicationName} onChange={e => set('medicationName', e.target.value)}>
            {meds.map(m => <option key={m}>{m}</option>)}
          </Select>
        </FormField>

        <FormField label="First-dose date" htmlFor="ob-startdate">
          <Input
            id="ob-startdate"
            type="date"
            value={form.startDate}
            onChange={e => set('startDate', e.target.value)}
          />
        </FormField>

        <FormField label="Current dose (mg)" htmlFor="ob-dose">
          {medDef.doses?.length ? (
            <Select id="ob-dose" value={form.currentDoseMg} onChange={e => set('currentDoseMg', e.target.value)}>
              <option value="">Choose a dose</option>
              {medDef.doses.map(d => <option key={d} value={d}>{d} mg</option>)}
            </Select>
          ) : (
            <Input
              id="ob-dose"
              type="number"
              step="0.01"
              value={form.currentDoseMg}
              onChange={e => set('currentDoseMg', e.target.value)}
              placeholder="e.g. 0.5"
            />
          )}
        </FormField>
      </div>
    </>
  )
}

// ── Decoration ─────────────────────────────────────────────────────────────
function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 32 32" className="shrink-0">
        <defs>
          <linearGradient id="obLogo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#e6a44d" />
            <stop offset="100%" stopColor="#b86c1e" />
          </linearGradient>
        </defs>
        <rect x="3" y="9" width="26" height="14" rx="7" fill="url(#obLogo)" />
        <rect x="3" y="9" width="13" height="14" rx="7" fill="#fdf8f1" />
      </svg>
      <span className="display font-bold text-wood-900 text-base leading-none">Tare</span>
    </div>
  )
}

function StepPips({ step, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const idx = i + 1
        const active = idx === step
        const done   = idx <  step
        return (
          <span
            key={idx}
            className={`h-1.5 rounded-full transition-all ${
              active ? 'w-6 bg-brand-500' :
              done   ? 'w-1.5 bg-brand-400' :
                       'w-1.5 bg-wood-200'
            }`}
          />
        )
      })}
    </div>
  )
}
