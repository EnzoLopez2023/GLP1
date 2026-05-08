import React from 'react'
import ReactDOM from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance, msalReady } from './auth/msalInstance'
import AuthGuard from './auth/AuthGuard'
import App from './App'
import './index.css'

const rootEl = document.getElementById('root')

function renderFatal(err) {
  rootEl.innerHTML = `
    <div style="font-family:system-ui;padding:24px;max-width:640px;margin:40px auto;
                background:#fee2e2;border:1px solid #fca5a5;border-radius:12px;color:#7f1d1d">
      <h2 style="margin:0 0 8px 0">Startup error</h2>
      <pre style="white-space:pre-wrap;font-size:12px">${String(err?.stack || err)}</pre>
    </div>`
  // eslint-disable-next-line no-console
  console.error('App startup failed', err)
}

msalReady
  .then(() => {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <AuthGuard>
            <App />
          </AuthGuard>
        </MsalProvider>
      </React.StrictMode>
    )
  })
  .catch(renderFatal)
