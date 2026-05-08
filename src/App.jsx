import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Layout from './components/layout/Layout'
import Dashboard    from './pages/Dashboard'
import Medication   from './pages/Medication'
import BloodGlucose from './pages/BloodGlucose'
import Nutrition    from './pages/Nutrition'
import Progress     from './pages/Progress'
import SideEffects  from './pages/SideEffects'
import Wellbeing    from './pages/Wellbeing'
import Insights     from './pages/Insights'
import Reports      from './pages/Reports'
import KnowledgeBase   from './pages/KnowledgeBase'
import MedicalRecords  from './pages/MedicalRecords'
import Settings        from './pages/Settings'
import IntroAnimation from './components/motion/IntroAnimation'
import OnboardingWizard from './components/onboarding/OnboardingWizard'
import { ease } from './components/motion/primitives'
import { api } from './api/client'

const INTRO_KEY = 'tare:introSeen'

// A profile is "complete" once the five required fields are populated.
// This drives the onboarding gate: empty profile → wizard, populated → app.
function isProfileComplete(p) {
  return !!(
    p && p.name && p.age != null &&
    p.heightIn != null && p.weightLbs != null && p.goalWeightLbs != null
  )
}

export default function App() {
  const [introDone, setIntroDone] = useState(() => {
    try { return Boolean(sessionStorage.getItem(INTRO_KEY)) } catch { return false }
  })

  // Profile completeness state — fetched once intro is done. Re-fetched on
  // wizard completion to flip needsOnboarding to false and unmount wizard.
  const [profile, setProfile]               = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (introDone) {
      try { sessionStorage.setItem(INTRO_KEY, '1') } catch { /* noop */ }
    }
  }, [introDone])

  useEffect(() => {
    if (!introDone) return
    setProfileLoading(true)
    api.getProfile()
      .then(p => setProfile(p))
      .catch(err => {
        // 401 is expected during the brief window before MSAL session is
        // hydrated — getIdToken in client.js will redirect on its own.
        // For other errors (e.g. server down), surface a sane fallback.
        console.error('[onboarding gate] getProfile failed', err)
      })
      .finally(() => setProfileLoading(false))
  }, [introDone])

  const needsOnboarding = introDone && !profileLoading && !isProfileComplete(profile)

  async function handleOnboardingComplete() {
    try {
      const fresh = await api.getProfile()
      setProfile(fresh)
    } catch (err) {
      console.error('[onboarding gate] refetch failed', err)
    }
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'text-sm font-medium',
          duration: 3000,
          style: {
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(82,58,37,0.12)',
            background: '#fffaf3',
            color: '#352719',
            border: '1px solid #e8d9b6',
          },
        }}
      />

      <AnimatePresence mode="wait">
        {!introDone && (
          <IntroAnimation key="intro" onDone={() => setIntroDone(true)} />
        )}
      </AnimatePresence>

      {/* Onboarding wizard takes over the screen for first-time users.
          We deliberately don't render <Layout> beneath it so route-mounted
          pages don't fire data fetches against an empty profile. */}
      {introDone && needsOnboarding && (
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      )}

      {introDone && !needsOnboarding && (
        <Layout>
          <AnimatedRoutes />
        </Layout>
      )}
    </BrowserRouter>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.22, ease: ease.outCubic }}
      >
        <Routes location={location}>
          <Route path="/"            element={<Dashboard />} />
          <Route path="/medication"  element={<Medication />} />
          <Route path="/glucose"     element={<BloodGlucose />} />
          <Route path="/nutrition"   element={<Nutrition />} />
          <Route path="/progress"    element={<Progress />} />
          <Route path="/sideeffects" element={<SideEffects />} />
          <Route path="/wellbeing"   element={<Wellbeing />} />
          <Route path="/insights"    element={<Insights />} />
          <Route path="/reports"     element={<Reports />} />
          <Route path="/knowledge"   element={<KnowledgeBase />} />
          <Route path="/medical"     element={<MedicalRecords />} />
          <Route path="/settings"    element={<Settings />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}
