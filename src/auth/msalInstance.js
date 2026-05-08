// Single MSAL PublicClientApplication shared by main.jsx (which mounts the
// MsalProvider) and api/client.js (which attaches the ID token to every API
// request). Construction happens at module load; initialize() must be awaited
// before the first acquireTokenSilent / loginRedirect call.

import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from './msalConfig'

export const msalInstance = new PublicClientApplication(msalConfig)

// Single shared promise so callers can `await msalReady` instead of racing
// the initialize() call. main.jsx awaits this before rendering the tree.
export const msalReady = msalInstance.initialize()
