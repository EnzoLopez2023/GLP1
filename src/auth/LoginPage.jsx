import { useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { Syringe } from 'lucide-react'
import { loginRequest } from './msalConfig'

export default function LoginPage() {
  const { instance } = useMsal()
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async () => {
    setError(null)
    setIsSubmitting(true)
    try {
      await instance.loginRedirect(loginRequest)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in right now.')
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="flex flex-col min-h-dvh bg-wood-50 text-wood-900 items-center justify-center px-6"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
      }}
    >
      <div className="w-full max-w-xs text-center">
        <div className="w-20 h-20 rounded-3xl bg-brand-500 flex items-center justify-center mb-4 mx-auto shadow-xl shadow-brand-500/30">
          <Syringe size={36} className="text-white" />
        </div>
        <h1 className="display text-5xl font-bold mb-2 tracking-tight">Tare</h1>
        <p className="text-wood-700 text-sm mb-2">Reset to baseline. Every week.</p>
        <p className="text-wood-500 text-xs mb-10 leading-relaxed">
          Sign in with your Microsoft account to access your health data.
        </p>

        <button
          className="w-full py-4 bg-white text-gray-800 rounded-2xl text-base font-bold shadow-lg border border-gray-200 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
          onClick={handleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
              </svg>
              Redirecting…
            </>
          ) : (
            <>
              <svg viewBox="0 0 21 21" className="w-5 h-5 flex-shrink-0">
                <rect x="1"  y="1"  width="9" height="9" rx="0.5" fill="#F25022" />
                <rect x="11" y="1"  width="9" height="9" rx="0.5" fill="#7FBA00" />
                <rect x="1"  y="11" width="9" height="9" rx="0.5" fill="#00A4EF" />
                <rect x="11" y="11" width="9" height="9" rx="0.5" fill="#FFB900" />
              </svg>
              Sign in with Microsoft
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
