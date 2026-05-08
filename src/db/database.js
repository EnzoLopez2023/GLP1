/**
 * GLP-1 Tracker — IndexedDB schema via Dexie.js
 *
 * All data lives 100 % in the browser's IndexedDB.
 * No network calls, no cloud sync.
 */
import Dexie from 'dexie'

export const db = new Dexie('GLP1TrackerDB')

db.version(1).stores({
  // ── User profile (single row, id always = 1) ─────────────────────────────
  profile: '++id, name',

  // ── Medication injections ─────────────────────────────────────────────────
  // injectedAt: ISO string | site: string (e.g. "abdomen-left")
  injections: '++id, injectedAt, site, medicationName',

  // ── Side effects ─────────────────────────────────────────────────────────
  // symptom: string | severity: 0-10 | loggedAt: ISO
  sideEffects: '++id, loggedAt, symptom',

  // ── Nutrition daily logs ──────────────────────────────────────────────────
  // date: YYYY-MM-DD (unique per day)
  nutrition: '++id, date',

  // ── Individual meal entries ───────────────────────────────────────────────
  meals: '++id, date, mealType',

  // ── Custom food library ───────────────────────────────────────────────────
  foods: '++id, name',

  // ── Progress: weight / measurements / photos ──────────────────────────────
  weightLog: '++id, date',
  measurements: '++id, date',
  photos: '++id, date',

  // ── Well-being daily log ──────────────────────────────────────────────────
  wellbeing: '++id, date',

  // ── Blood glucose readings ────────────────────────────────────────────────
  // readingType: 'fasting' | 'pre-meal' | 'post-meal' | 'bedtime' | 'random'
  glucose: '++id, readingAt, readingType',

  // ── Reminders / notification schedules ───────────────────────────────────
  reminders: '++id, type, enabled',

  // ── App settings (single row, id always = 1) ─────────────────────────────
  settings: '++id',
})

// ── Default seed data ─────────────────────────────────────────────────────────
db.on('populate', async () => {
  await db.settings.add({
    id: 1,
    weightUnit: 'lbs',
    glucoseUnit: 'mg/dL',
    heightUnit: 'in',
    waterUnit: 'oz',
    theme: 'light',
    notifications: true,
    notificationTime: '08:00',
    injectionDay: 'Sunday',
    injectionTime: '09:00',
  })

  await db.profile.add({
    id: 1,
    name: '',
    age: null,
    weightLbs: null,
    heightIn: null,
    goalWeightLbs: null,
    medicationName: 'Ozempic',
    startingDoseMg: 0.25,
    currentDoseMg: 0.25,
    escalationSchedule: 'standard', // standard | custom
    startDate: null,
    notes: '',
  })
})

// ── Convenience helpers ───────────────────────────────────────────────────────

export async function getProfile() {
  return db.profile.get(1)
}

export async function saveProfile(data) {
  return db.profile.put({ ...data, id: 1 })
}

export async function getSettings() {
  return db.settings.get(1)
}

export async function saveSettings(data) {
  return db.settings.put({ ...data, id: 1 })
}

/** Return today's nutrition record, creating a blank one if needed */
export async function getTodayNutrition() {
  const date = new Date().toISOString().split('T')[0]
  let rec = await db.nutrition.where('date').equals(date).first()
  if (!rec) {
    const id = await db.nutrition.add({
      date,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      caloriesKcal: 0,
      waterOz: 0,
      notes: '',
    })
    rec = await db.nutrition.get(id)
  }
  return rec
}

/** Return today's well-being record, creating a blank one if needed */
export async function getTodayWellbeing() {
  const date = new Date().toISOString().split('T')[0]
  let rec = await db.wellbeing.where('date').equals(date).first()
  if (!rec) {
    const id = await db.wellbeing.add({
      date,
      mood: null,         // 1-10
      energy: null,       // 1-10
      hunger: null,       // 1-10
      sleepHours: null,
      sleepQuality: null, // 1-10
      notes: '',
    })
    rec = await db.wellbeing.get(id)
  }
  return rec
}

/** Last injection record */
export async function getLastInjection() {
  return db.injections.orderBy('injectedAt').last()
}

/** Latest glucose reading */
export async function getLatestGlucose() {
  return db.glucose.orderBy('readingAt').last()
}

/** Glucose readings for a date range (ISO strings) */
export async function getGlucoseRange(fromISO, toISO) {
  return db.glucose
    .where('readingAt')
    .between(fromISO, toISO, true, true)
    .toArray()
}

/** All injections sorted newest-first */
export async function getInjectionHistory(limit = 50) {
  return db.injections.orderBy('injectedAt').reverse().limit(limit).toArray()
}

/** Export entire database as JSON */
export async function exportAllData() {
  const [
    profile, settings, injections, sideEffects,
    nutrition, meals, foods, weightLog,
    measurements, wellbeing, glucose, reminders,
  ] = await Promise.all([
    db.profile.toArray(),
    db.settings.toArray(),
    db.injections.toArray(),
    db.sideEffects.toArray(),
    db.nutrition.toArray(),
    db.meals.toArray(),
    db.foods.toArray(),
    db.weightLog.toArray(),
    db.measurements.toArray(),
    db.wellbeing.toArray(),
    db.glucose.toArray(),
    db.reminders.toArray(),
  ])
  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    profile, settings, injections, sideEffects,
    nutrition, meals, foods, weightLog,
    measurements, wellbeing, glucose, reminders,
  }
}

/** Import data exported by exportAllData() — clears existing data first */
export async function importAllData(json) {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear()
    }
    const t = json
    if (t.profile?.length)      await db.profile.bulkAdd(t.profile)
    if (t.settings?.length)     await db.settings.bulkAdd(t.settings)
    if (t.injections?.length)   await db.injections.bulkAdd(t.injections)
    if (t.sideEffects?.length)  await db.sideEffects.bulkAdd(t.sideEffects)
    if (t.nutrition?.length)    await db.nutrition.bulkAdd(t.nutrition)
    if (t.meals?.length)        await db.meals.bulkAdd(t.meals)
    if (t.foods?.length)        await db.foods.bulkAdd(t.foods)
    if (t.weightLog?.length)    await db.weightLog.bulkAdd(t.weightLog)
    if (t.measurements?.length) await db.measurements.bulkAdd(t.measurements)
    if (t.wellbeing?.length)    await db.wellbeing.bulkAdd(t.wellbeing)
    if (t.glucose?.length)      await db.glucose.bulkAdd(t.glucose)
    if (t.reminders?.length)    await db.reminders.bulkAdd(t.reminders)
  })
}
