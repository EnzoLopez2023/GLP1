import { useEffect } from 'react'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { InteractionStatus } from '@azure/msal-browser'
import { Syringe } from 'lucide-react'
import LoginPage from './LoginPage'

export default function AuthGuard({ children }) {
  const isAuthenticated = useIsAuthenticated()
  const { instance, inProgress } = useMsal()

  useEffect(() => {
    const accounts = instance.getAllAccounts()
    if (!instance.getActiveAccount() && accounts.length > 0) {
      instance.setActiveAccount(accounts[0])
    }
  }, [instance, isAuthenticated])

  if (
    inProgress === InteractionStatus.HandleRedirect ||
    inProgress === InteractionStatus.AcquireToken
  ) {
    return (
      <div
        className="flex flex-col min-h-dvh bg-gray-50 text-gray-800 items-center justify-center px-6"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="w-20 h-20 rounded-3xl bg-brand-500 flex items-center justify-center mb-5 shadow-xl shadow-brand-500/30">
          <Syringe size={36} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Signing you in…</h1>
        <p className="text-gray-500 text-sm">Please wait while we complete authentication.</p>
      </div>
    )
  }

  if (!isAuthenticated) return <LoginPage />

  return <>{children}</>
}
