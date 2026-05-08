import { LogLevel } from '@azure/msal-browser'

// Set VITE_AAD_CLIENT_ID and VITE_AAD_TENANT_ID in your .env file.
// These are baked in at build time by Vite — not present at runtime.
const clientId = import.meta.env.VITE_AAD_CLIENT_ID
const tenantId = import.meta.env.VITE_AAD_TENANT_ID

export const msalConfig = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
  },
  system: {
    loggerOptions: {
      loggerCallback(level, message, containsPii) {
        if (containsPii) return
        console.debug(`[MSAL:${LogLevel[level]}] ${message}`)
      },
      logLevel: LogLevel.Warning,
    },
  },
}

// Scopes for interactive login (acquireTokenRedirect / loginRedirect).
// Microsoft Graph User.Read is included so existing flows that use the access
// token continue to work.
export const loginRequest = {
  scopes: ['openid', 'profile', 'User.Read'],
}

// Scopes for silent ID-token renewal — `openid profile` is sufficient and
// returns a fresh idToken without prompting for additional consent.
export const idTokenRequest = {
  scopes: ['openid', 'profile'],
}
