/**
 * Tare — REST API client
 * Every request carries a fresh AAD ID token so the server can resolve the
 * caller's per-user database. acquireTokenSilent uses MSAL's cache; if silent
 * acquisition fails (interaction required, expired refresh token), we fall
 * back to a redirect so the user logs in again.
 */

import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { msalInstance } from '../auth/msalInstance'
import { idTokenRequest, loginRequest } from '../auth/msalConfig'

const BASE = '/api'

async function getIdToken() {
  const account =
    msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0] ?? null

  if (!account) {
    // No session at all — kick the user to login.
    await msalInstance.loginRedirect(loginRequest)
    throw new Error('redirecting to login')
  }

  try {
    const result = await msalInstance.acquireTokenSilent({ account, ...idTokenRequest })
    return result.idToken
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect({ account, ...idTokenRequest })
      throw new Error('redirecting to renew session')
    }
    throw err
  }
}

async function request(method, path, body) {
  const token = await getIdToken()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    // Token rejected by the server — force a fresh redirect-login.
    const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0]
    if (account) await msalInstance.acquireTokenRedirect({ account, ...idTokenRequest })
    else         await msalInstance.loginRedirect(loginRequest)
    throw new Error(`API ${method} ${path} → 401 (re-authenticating)`)
  }
  if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`)
  return res.json()
}

const get  = (path, params) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return request('GET', path + qs)
}
const post = (path, body)   => request('POST',   path, body)
const put  = (path, body)   => request('PUT',    path, body)
const del  = (path)         => request('DELETE', path)

// ── Profile ───────────────────────────────────────────────────────────────────
export const api = {
  getProfile:    ()     => get('/profile'),
  saveProfile:   (data) => put('/profile', data),

  // ── Settings ─────────────────────────────────────────────────────────────
  getSettings:   ()     => get('/settings'),
  saveSettings:  (data) => put('/settings', data),

  // ── Injections ───────────────────────────────────────────────────────────
  getInjections:    (limit = 50) => get('/injections', { limit }),
  addInjection:     (data)       => post('/injections', data),
  deleteInjection:  (id)         => del(`/injections/${id}`),

  // ── Side effects ─────────────────────────────────────────────────────────
  getSideEffects:   (limit = 100) => get('/sideeffects', { limit }),
  addSideEffect:    (data)        => post('/sideeffects', data),
  deleteSideEffect: (id)          => del(`/sideeffects/${id}`),

  // ── Nutrition ─────────────────────────────────────────────────────────────
  getTodayNutrition: ()          => get('/nutrition/today'),
  getNutritionRange: (from, to)  => get('/nutrition', { from, to }),
  updateNutrition:   (date, data)=> put(`/nutrition/${date}`, data),

  // ── Meals ─────────────────────────────────────────────────────────────────
  getMeals:    (date) => get('/meals', { date }),
  addMeal:     (data) => post('/meals', data),
  deleteMeal:  (id)   => del(`/meals/${id}`),

  // ── Glucose ───────────────────────────────────────────────────────────────
  getGlucose:    (params = {}) => get('/glucose', params),
  addGlucose:    (data)        => post('/glucose', data),
  deleteGlucose: (id)          => del(`/glucose/${id}`),

  // ── Weight log ────────────────────────────────────────────────────────────
  getWeightLog:    ()     => get('/weightlog'),
  addWeight:       (data) => post('/weightlog', data),
  deleteWeight:    (id)   => del(`/weightlog/${id}`),

  // ── Measurements ──────────────────────────────────────────────────────────
  getMeasurements:    ()     => get('/measurements'),
  addMeasurement:     (data) => post('/measurements', data),
  deleteMeasurement:  (id)   => del(`/measurements/${id}`),

  // ── Well-being ────────────────────────────────────────────────────────────
  getTodayWellbeing:  ()           => get('/wellbeing/today'),
  getWellbeingRange:  (from, to)   => get('/wellbeing', { from, to }),
  updateWellbeing:    (date, data) => put(`/wellbeing/${date}`, data),

  // ── Photos ────────────────────────────────────────────────────────────────
  getPhotos:    ()     => get('/photos'),
  getPhotoData: (id)   => get(`/photos/${id}/image`),
  addPhoto:     (data) => post('/photos', data),
  deletePhoto:  (id)   => del(`/photos/${id}`),

  // ── Export / Import ───────────────────────────────────────────────────────
  exportData: () => get('/export'),
  importData: (data) => post('/import', data),

  // ── Medical Records ───────────────────────────────────────────────────────
  getMedicalVitals:      ()       => get('/medical/vitals'),
  getMedicalLabs:        (panel)  => get('/medical/labs', panel ? { panel } : undefined),
  getMedicalDiagnoses:   ()       => get('/medical/diagnoses'),
  getMedicalMedications: ()       => get('/medical/medications'),
  getMedicalProcedures:  ()       => get('/medical/procedures'),
  seedMedicalRecords:    (data)   => post('/medical/seed', data),

  // ── AI ────────────────────────────────────────────────────────────────────
  getNutritionGlucoseInsight: (data) => post('/ai/nutrition-glucose-insight', data),
  askQuestion:                (data) => post('/ai/ask', data),
}
