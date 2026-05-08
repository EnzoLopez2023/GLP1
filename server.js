import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync, renameSync } from 'node:fs'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'

dotenv.config()

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

// ── Config ────────────────────────────────────────────────────────────────────
const PORT             = process.env.PORT             ?? 3004
const USERS_DIR        = process.env.USERS_DIR        ?? join(__dirname, 'data', 'users')
const LEGACY_DB_PATH   = process.env.LEGACY_DB_PATH   ?? process.env.DB_PATH ?? join(__dirname, 'glp1.db')
const AAD_TENANT_ID    = process.env.AAD_TENANT_ID
const AAD_CLIENT_ID    = process.env.AAD_CLIENT_ID
if (!AAD_TENANT_ID || !AAD_CLIENT_ID) {
  console.error('AAD_TENANT_ID and AAD_CLIENT_ID must be set in environment')
  process.exit(1)
}
const PRIMARY_USER_OID = process.env.PRIMARY_USER_OID ?? null

// ── Schema (shared by every per-user DB created lazily) ──────────────────────
const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS profile (
    id                  INTEGER PRIMARY KEY DEFAULT 1,
    name                TEXT    DEFAULT '',
    age                 INTEGER,
    weightLbs           REAL,
    heightIn            REAL,
    goalWeightLbs       REAL,
    medicationName      TEXT    DEFAULT 'Ozempic',
    startingDoseMg      REAL    DEFAULT 0.25,
    currentDoseMg       REAL    DEFAULT 0.25,
    escalationSchedule  TEXT    DEFAULT 'standard',
    startDate           TEXT,
    diagnosisDate       TEXT,
    ketoStartDate       TEXT,
    appointmentDate     TEXT,
    injectionDay        TEXT    DEFAULT 'Sunday',
    injectionTime       TEXT    DEFAULT '09:00',
    notes               TEXT    DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS settings (
    id               INTEGER PRIMARY KEY DEFAULT 1,
    weightUnit       TEXT DEFAULT 'lbs',
    glucoseUnit      TEXT DEFAULT 'mg/dL',
    heightUnit       TEXT DEFAULT 'in',
    waterUnit        TEXT DEFAULT 'oz',
    theme            TEXT DEFAULT 'light',
    notifications    INTEGER DEFAULT 0,
    notificationTime TEXT DEFAULT '09:00',
    injectionDay     TEXT DEFAULT 'Sunday',
    injectionTime    TEXT DEFAULT '09:00'
  );

  CREATE TABLE IF NOT EXISTS injections (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    injectedAt     TEXT NOT NULL,
    medicationName TEXT NOT NULL,
    doseMg         REAL NOT NULL,
    site           TEXT NOT NULL,
    notes          TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS sideEffects (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    loggedAt  TEXT NOT NULL,
    symptom   TEXT NOT NULL,
    severity  INTEGER NOT NULL,
    notes     TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS nutrition (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    date         TEXT NOT NULL UNIQUE,
    proteinG     REAL DEFAULT 0,
    carbsG       REAL DEFAULT 0,
    fatG         REAL DEFAULT 0,
    caloriesKcal REAL DEFAULT 0,
    waterOz      REAL DEFAULT 0,
    notes        TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS meals (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    date         TEXT NOT NULL,
    mealType     TEXT NOT NULL,
    name         TEXT NOT NULL,
    proteinG     REAL DEFAULT 0,
    carbsG       REAL DEFAULT 0,
    fatG         REAL DEFAULT 0,
    caloriesKcal REAL DEFAULT 0,
    notes        TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS glucose (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    readingAt   TEXT NOT NULL,
    readingType TEXT NOT NULL,
    value       REAL NOT NULL,
    notes       TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS weightLog (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    date      TEXT NOT NULL UNIQUE,
    weightLbs REAL NOT NULL,
    notes     TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS measurements (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    date       TEXT NOT NULL,
    waist      REAL,
    hips       REAL,
    chest      REAL,
    neck       REAL,
    leftArm    REAL,
    rightArm   REAL,
    leftThigh  REAL,
    rightThigh REAL,
    notes      TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS wellbeing (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    date         TEXT NOT NULL UNIQUE,
    mood         INTEGER,
    energy       INTEGER,
    hunger       INTEGER,
    sleepHours   REAL,
    sleepQuality INTEGER,
    notes        TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS photos (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    date    TEXT NOT NULL,
    label   TEXT DEFAULT '',
    dataUrl TEXT NOT NULL
  );

  -- Seed singleton rows if missing
  INSERT OR IGNORE INTO profile  (id) VALUES (1);
  INSERT OR IGNORE INTO settings (id) VALUES (1);
`

// Additive migrations for existing DBs (safe to re-run on every open).
function applyMigrations(db) {
  ;['diagnosisDate TEXT', 'ketoStartDate TEXT', 'appointmentDate TEXT'].forEach(col => {
    try { db.exec(`ALTER TABLE profile ADD COLUMN ${col}`) } catch { /* already exists */ }
  })
  try { db.exec('ALTER TABLE settings ADD COLUMN carbGoalG REAL DEFAULT 20') } catch { /* already exists */ }
}

// ── Per-user DB resolution ───────────────────────────────────────────────────
const OID_RE   = /^[0-9a-f-]{36}$/i
const dbHandles = new Map()  // oid → Database

function getUserDb(oid) {
  if (dbHandles.has(oid)) return dbHandles.get(oid)
  if (!OID_RE.test(oid)) throw new Error('invalid oid')

  mkdirSync(USERS_DIR, { recursive: true })
  const target = join(USERS_DIR, `${oid}.db`)

  // One-shot legacy DB migration for the primary user.
  if (
    PRIMARY_USER_OID && oid === PRIMARY_USER_OID &&
    !existsSync(target) && existsSync(LEGACY_DB_PATH)
  ) {
    try {
      renameSync(LEGACY_DB_PATH, target)
      // Move WAL siblings if present so WAL state stays consistent.
      for (const ext of ['-shm', '-wal']) {
        const from = LEGACY_DB_PATH + ext
        if (existsSync(from)) {
          try { renameSync(from, target + ext) } catch { /* tolerated */ }
        }
      }
      console.log(`[migrate] moved legacy DB → ${target}`)
    } catch (err) {
      // If the legacy file vanished between the check and rename (e.g. another
      // request raced us), recheck existence and continue without aborting.
      if (existsSync(target)) {
        // someone else won the race, we can use the moved file
      } else {
        throw err
      }
    }
  }

  const db = new Database(target)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA_SQL)
  applyMigrations(db)

  dbHandles.set(oid, db)
  return db
}

// ── Auth (Microsoft AAD ID token validation) ─────────────────────────────────
const JWKS = createRemoteJWKSet(
  new URL(`https://login.microsoftonline.com/${AAD_TENANT_ID}/discovery/v2.0/keys`)
)
const ISSUER = `https://login.microsoftonline.com/${AAD_TENANT_ID}/v2.0`

async function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  const m = /^Bearer (.+)$/i.exec(header)
  if (!m) return res.status(401).json({ error: 'unauthorized' })
  try {
    const { payload } = await jwtVerify(m[1], JWKS, {
      issuer:   ISSUER,
      audience: AAD_CLIENT_ID,
      clockTolerance: '60s',
    })
    if (payload.tid !== AAD_TENANT_ID) return res.status(401).json({ error: 'unauthorized' })
    if (!payload.oid)                  return res.status(401).json({ error: 'unauthorized' })
    req.userId = payload.oid
    next()
  } catch {
    res.status(401).json({ error: 'unauthorized' })
  }
}

function withUserDb(req, res, next) {
  try {
    req.db = getUserDb(req.userId)
    next()
  } catch (err) {
    console.error('[withUserDb]', err.message)
    res.status(500).json({ error: 'db unavailable' })
  }
}

// Graceful shutdown — close every cached handle.
function closeAllDbs() {
  for (const db of dbHandles.values()) {
    try { db.close() } catch { /* ignore */ }
  }
  dbHandles.clear()
}
process.on('SIGTERM', closeAllDbs)
process.on('SIGINT',  () => { closeAllDbs(); process.exit(0) })

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express()
app.use(cors({
  origin: true,
  credentials: false,
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '20mb' })) // photos need larger limit
app.use(express.static(join(__dirname, 'dist')))

// ── Health (public) ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', usersDir: USERS_DIR, ts: new Date().toISOString() })
})

// ── Auth gate for everything else under /api ─────────────────────────────────
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next()
  requireAuth(req, res, () => withUserDb(req, res, next))
})

// ── Profile ───────────────────────────────────────────────────────────────────
app.get('/api/profile', (req, res) => {
  res.json(req.db.prepare('SELECT * FROM profile WHERE id=1').get() ?? {})
})

app.put('/api/profile', (req, res) => {
  const cols = ['name','age','weightLbs','heightIn','goalWeightLbs','medicationName',
                'startingDoseMg','currentDoseMg','escalationSchedule','startDate',
                'diagnosisDate','ketoStartDate','appointmentDate','injectionDay','injectionTime','notes']
  const sets = cols.map(c => `${c}=@${c}`).join(',')
  req.db.prepare(`UPDATE profile SET ${sets} WHERE id=1`).run(pick(req.body, cols))
  res.json(req.db.prepare('SELECT * FROM profile WHERE id=1').get())
})

// ── Settings ──────────────────────────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  res.json(req.db.prepare('SELECT * FROM settings WHERE id=1').get() ?? {})
})

app.put('/api/settings', (req, res) => {
  const cols = ['weightUnit','glucoseUnit','heightUnit','waterUnit','theme',
                'notifications','notificationTime','injectionDay','injectionTime','carbGoalG']
  const sets = cols.map(c => `${c}=@${c}`).join(',')
  req.db.prepare(`UPDATE settings SET ${sets} WHERE id=1`).run(pick(req.body, cols))
  res.json(req.db.prepare('SELECT * FROM settings WHERE id=1').get())
})

// ── Injections ────────────────────────────────────────────────────────────────
app.get('/api/injections', (req, res) => {
  const limit = parseInt(req.query.limit) || 50
  res.json(req.db.prepare('SELECT * FROM injections ORDER BY injectedAt DESC LIMIT ?').all(limit))
})

app.post('/api/injections', (req, res) => {
  const { injectedAt, medicationName, doseMg, site, notes = '' } = req.body
  const r = req.db.prepare(
    'INSERT INTO injections (injectedAt,medicationName,doseMg,site,notes) VALUES (?,?,?,?,?)'
  ).run(injectedAt, medicationName, doseMg, site, notes)
  res.json(req.db.prepare('SELECT * FROM injections WHERE id=?').get(r.lastInsertRowid))
})

app.delete('/api/injections/:id', (req, res) => {
  req.db.prepare('DELETE FROM injections WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// ── Side effects ──────────────────────────────────────────────────────────────
app.get('/api/sideeffects', (req, res) => {
  const limit = parseInt(req.query.limit) || 100
  res.json(req.db.prepare('SELECT * FROM sideEffects ORDER BY loggedAt DESC LIMIT ?').all(limit))
})

app.post('/api/sideeffects', (req, res) => {
  const { loggedAt, symptom, severity, notes = '' } = req.body
  const r = req.db.prepare(
    'INSERT INTO sideEffects (loggedAt,symptom,severity,notes) VALUES (?,?,?,?)'
  ).run(loggedAt, symptom, severity, notes)
  res.json(req.db.prepare('SELECT * FROM sideEffects WHERE id=?').get(r.lastInsertRowid))
})

app.delete('/api/sideeffects/:id', (req, res) => {
  req.db.prepare('DELETE FROM sideEffects WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// ── Nutrition ─────────────────────────────────────────────────────────────────
app.get('/api/nutrition/today', (req, res) => {
  const date = today()
  let rec = req.db.prepare('SELECT * FROM nutrition WHERE date=?').get(date)
  if (!rec) {
    req.db.prepare('INSERT OR IGNORE INTO nutrition (date) VALUES (?)').run(date)
    rec = req.db.prepare('SELECT * FROM nutrition WHERE date=?').get(date)
  }
  res.json(rec)
})

app.get('/api/nutrition', (req, res) => {
  const { from, to } = req.query
  if (from && to) {
    res.json(req.db.prepare('SELECT * FROM nutrition WHERE date>=? AND date<=? ORDER BY date').all(from, to))
  } else {
    res.json(req.db.prepare('SELECT * FROM nutrition ORDER BY date DESC LIMIT 90').all())
  }
})

app.put('/api/nutrition/:date', (req, res) => {
  const { date } = req.params
  req.db.prepare('INSERT OR IGNORE INTO nutrition (date) VALUES (?)').run(date)
  const cols = ['proteinG','carbsG','fatG','caloriesKcal','waterOz','notes']
  const sets = cols.map(c => `${c}=@${c}`).join(',')
  req.db.prepare(`UPDATE nutrition SET ${sets} WHERE date=@date`).run({ date, ...pick(req.body, cols) })
  res.json(req.db.prepare('SELECT * FROM nutrition WHERE date=?').get(date))
})

// ── Meals ─────────────────────────────────────────────────────────────────────
app.get('/api/meals', (req, res) => {
  const { date } = req.query
  if (date) {
    res.json(req.db.prepare('SELECT * FROM meals WHERE date=? ORDER BY id').all(date))
  } else {
    res.json(req.db.prepare('SELECT * FROM meals ORDER BY id DESC LIMIT 50').all())
  }
})

app.post('/api/meals', (req, res) => {
  const { date, mealType, name, proteinG=0, carbsG=0, fatG=0, caloriesKcal=0, notes='' } = req.body
  const r = req.db.prepare(
    'INSERT INTO meals (date,mealType,name,proteinG,carbsG,fatG,caloriesKcal,notes) VALUES (?,?,?,?,?,?,?,?)'
  ).run(date, mealType, name, proteinG, carbsG, fatG, caloriesKcal, notes)
  res.json(req.db.prepare('SELECT * FROM meals WHERE id=?').get(r.lastInsertRowid))
})

app.delete('/api/meals/:id', (req, res) => {
  req.db.prepare('DELETE FROM meals WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// ── Glucose ───────────────────────────────────────────────────────────────────
app.get('/api/glucose', (req, res) => {
  const { from, to, type } = req.query
  let sql  = 'SELECT * FROM glucose WHERE 1=1'
  const p  = []
  if (from) { sql += ' AND readingAt>=?'; p.push(from) }
  if (to)   { sql += ' AND readingAt<=?'; p.push(to) }
  if (type) { sql += ' AND readingType=?'; p.push(type) }
  sql += ' ORDER BY readingAt DESC'
  res.json(req.db.prepare(sql).all(...p))
})

app.post('/api/glucose', (req, res) => {
  const { readingAt, readingType, value, notes = '' } = req.body
  const r = req.db.prepare(
    'INSERT INTO glucose (readingAt,readingType,value,notes) VALUES (?,?,?,?)'
  ).run(readingAt, readingType, value, notes)
  res.json(req.db.prepare('SELECT * FROM glucose WHERE id=?').get(r.lastInsertRowid))
})

app.delete('/api/glucose/:id', (req, res) => {
  req.db.prepare('DELETE FROM glucose WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// ── Weight log ────────────────────────────────────────────────────────────────
app.get('/api/weightlog', (req, res) => {
  res.json(req.db.prepare('SELECT * FROM weightLog ORDER BY date ASC').all())
})

app.post('/api/weightlog', (req, res) => {
  const { date, weightLbs, notes = '' } = req.body
  req.db.prepare('INSERT OR REPLACE INTO weightLog (date,weightLbs,notes) VALUES (?,?,?)').run(date, weightLbs, notes)
  res.json(req.db.prepare('SELECT * FROM weightLog WHERE date=?').get(date))
})

app.delete('/api/weightlog/:id', (req, res) => {
  req.db.prepare('DELETE FROM weightLog WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// ── Measurements ──────────────────────────────────────────────────────────────
app.get('/api/measurements', (req, res) => {
  res.json(req.db.prepare('SELECT * FROM measurements ORDER BY date DESC LIMIT 20').all())
})

app.post('/api/measurements', (req, res) => {
  const cols = ['date','waist','hips','chest','neck','leftArm','rightArm','leftThigh','rightThigh','notes']
  const placeholders = cols.map(() => '?').join(',')
  const vals = cols.map(c => req.body[c] ?? null)
  const r = req.db.prepare(`INSERT INTO measurements (${cols.join(',')}) VALUES (${placeholders})`).run(...vals)
  res.json(req.db.prepare('SELECT * FROM measurements WHERE id=?').get(r.lastInsertRowid))
})

app.delete('/api/measurements/:id', (req, res) => {
  req.db.prepare('DELETE FROM measurements WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// ── Well-being ────────────────────────────────────────────────────────────────
app.get('/api/wellbeing/today', (req, res) => {
  const date = today()
  let rec = req.db.prepare('SELECT * FROM wellbeing WHERE date=?').get(date)
  if (!rec) {
    req.db.prepare('INSERT OR IGNORE INTO wellbeing (date) VALUES (?)').run(date)
    rec = req.db.prepare('SELECT * FROM wellbeing WHERE date=?').get(date)
  }
  res.json(rec)
})

app.get('/api/wellbeing', (req, res) => {
  const { from, to } = req.query
  if (from && to) {
    res.json(req.db.prepare('SELECT * FROM wellbeing WHERE date>=? AND date<=? ORDER BY date').all(from, to))
  } else {
    res.json(req.db.prepare('SELECT * FROM wellbeing ORDER BY date DESC LIMIT 90').all())
  }
})

app.put('/api/wellbeing/:date', (req, res) => {
  const { date } = req.params
  req.db.prepare('INSERT OR IGNORE INTO wellbeing (date) VALUES (?)').run(date)
  const cols = ['mood','energy','hunger','sleepHours','sleepQuality','notes']
  const sets = cols.map(c => `${c}=@${c}`).join(',')
  req.db.prepare(`UPDATE wellbeing SET ${sets} WHERE date=@date`).run({ date, ...pick(req.body, cols) })
  res.json(req.db.prepare('SELECT * FROM wellbeing WHERE date=?').get(date))
})

// ── Photos ────────────────────────────────────────────────────────────────────
app.get('/api/photos', (req, res) => {
  // Return metadata only (no dataUrl) for the list
  res.json(req.db.prepare('SELECT id,date,label FROM photos ORDER BY date DESC').all())
})

app.get('/api/photos/:id/image', (req, res) => {
  const row = req.db.prepare('SELECT dataUrl FROM photos WHERE id=?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json({ dataUrl: row.dataUrl })
})

app.post('/api/photos', (req, res) => {
  const { date, label = '', dataUrl } = req.body
  const r = req.db.prepare('INSERT INTO photos (date,label,dataUrl) VALUES (?,?,?)').run(date, label, dataUrl)
  res.json({ id: r.lastInsertRowid, date, label })
})

app.delete('/api/photos/:id', (req, res) => {
  req.db.prepare('DELETE FROM photos WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// ── Export / Import ───────────────────────────────────────────────────────────
app.get('/api/export', (req, res) => {
  const data = {
    exportedAt:  new Date().toISOString(),
    version:     1,
    profile:     req.db.prepare('SELECT * FROM profile').all(),
    settings:    req.db.prepare('SELECT * FROM settings').all(),
    injections:  req.db.prepare('SELECT * FROM injections').all(),
    sideEffects: req.db.prepare('SELECT * FROM sideEffects').all(),
    nutrition:   req.db.prepare('SELECT * FROM nutrition').all(),
    meals:       req.db.prepare('SELECT * FROM meals').all(),
    glucose:     req.db.prepare('SELECT * FROM glucose').all(),
    weightLog:   req.db.prepare('SELECT * FROM weightLog').all(),
    measurements:req.db.prepare('SELECT * FROM measurements').all(),
    wellbeing:   req.db.prepare('SELECT * FROM wellbeing').all(),
    photos:      req.db.prepare('SELECT * FROM photos').all(),
  }
  res.setHeader('Content-Disposition', `attachment; filename="glp1-export-${today()}.json"`)
  res.json(data)
})

app.post('/api/import', (req, res) => {
  const t = req.body

  const importAll = req.db.transaction(() => {
    const tables = [
      'injections','sideEffects','nutrition','meals','glucose',
      'weightLog','measurements','wellbeing','photos',
    ]
    for (const tbl of tables) req.db.prepare(`DELETE FROM ${tbl}`).run()

    const tableMap = {
      injections:   t.injections,
      sideEffects:  t.sideEffects,
      nutrition:    t.nutrition,
      meals:        t.meals,
      glucose:      t.glucose,
      weightLog:    t.weightLog,
      measurements: t.measurements,
      wellbeing:    t.wellbeing,
      photos:       t.photos,
    }

    for (const [tbl, rows] of Object.entries(tableMap)) {
      if (!rows?.length) continue
      // Build INSERT from the actual keys present in the first row
      const cols  = Object.keys(rows[0])
      const ph    = cols.map(() => '?').join(',')
      const stmt  = req.db.prepare(`INSERT OR REPLACE INTO ${tbl} (${cols.join(',')}) VALUES (${ph})`)
      for (const row of rows) stmt.run(cols.map(c => row[c] ?? null))
    }

    // Singleton rows
    if (t.profile?.[0]) {
      const row  = t.profile[0]
      const cols = Object.keys(row)
      const ph   = cols.map(() => '?').join(',')
      req.db.prepare(`INSERT OR REPLACE INTO profile (${cols.join(',')}) VALUES (${ph})`).run(cols.map(c => row[c] ?? null))
    }
    if (t.settings?.[0]) {
      const row  = t.settings[0]
      const cols = Object.keys(row)
      const ph   = cols.map(() => '?').join(',')
      req.db.prepare(`INSERT OR REPLACE INTO settings (${cols.join(',')}) VALUES (${ph})`).run(cols.map(c => row[c] ?? null))
    }
  })

  try {
    importAll()
    res.json({ ok: true })
  } catch (err) {
    console.error('Import error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── AI: Nutrition + Glucose Insight ──────────────────────────────────────────
app.post('/api/ai/nutrition-glucose-insight', async (req, res) => {
  if (!anthropic) return res.status(503).json({ error: 'AI not configured — set ANTHROPIC_API_KEY in .env' })

  const { nutrition, meals, glucoseReadings } = req.body
  if (!nutrition || !glucoseReadings?.length) {
    return res.status(400).json({ error: 'nutrition and glucoseReadings are required' })
  }

  const carbsG    = nutrition.carbsG ?? 0
  const caloriesK = nutrition.caloriesKcal ?? 0
  const proteinG  = nutrition.proteinG ?? 0
  const fatG      = nutrition.fatG ?? 0

  const sortedGlucose = [...glucoseReadings].sort((a, b) => a.readingAt.localeCompare(b.readingAt))
  const minGlucose    = Math.min(...sortedGlucose.map(r => r.value))
  const maxGlucose    = Math.max(...sortedGlucose.map(r => r.value))
  const glucoseSwing  = maxGlucose - minGlucose

  const mealSummary = (meals ?? []).map(m =>
    `${m.name} (${m.mealType}): ${m.carbsG ?? 0}g carbs, ${m.proteinG ?? 0}g protein, ${m.caloriesKcal ?? 0} kcal`
  ).join('\n') || 'No individual meals logged'

  const glucoseSummary = sortedGlucose.map(r =>
    `${r.readingAt.slice(11, 16)} – ${r.value} mg/dL (${r.readingType})`
  ).join('\n')

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `You are a health coach reviewing glucose and nutrition data for a GLP-1 medication user introducing carbs/sugars.

Today's nutrition:
- Carbs: ${carbsG}g | Protein: ${proteinG}g | Fat: ${fatG}g | Calories: ${caloriesK} kcal

Meals logged:
${mealSummary}

Glucose readings today:
${glucoseSummary}
(Range: ${minGlucose}–${maxGlucose} mg/dL, swing of ${glucoseSwing} mg/dL)

Give a brief, practical insight about how today's carb intake appears to have affected glucose levels.
${glucoseSwing < 20 ? 'The glucose change was minor — keep your response short (1-2 sentences).' : 'Provide helpful context on the glucose response (2-4 sentences).'}
Be encouraging and specific to the numbers. No markdown formatting, plain sentences only.`,
      }],
    })

    const text = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
    res.json({ insight: text })
  } catch (err) {
    console.error('AI nutrition-glucose-insight error:', err)
    res.status(500).json({ error: 'AI request failed' })
  }
})

// ── AI: Knowledge Base Q&A ────────────────────────────────────────────────────
app.post('/api/ai/ask', async (req, res) => {
  if (!anthropic) return res.status(503).json({ error: 'AI not configured — set ANTHROPIC_API_KEY in .env' })

  const { question, userContext } = req.body
  if (!question?.trim()) return res.status(400).json({ error: 'question is required' })

  const {
    diagnosisDate, ketoStartDate, glp1StartDate,
    medication, currentDose,
    weeksSinceDiagnosis, weeksOnKeto, weeksOnGLP1,
    avgGlucose, fastingAvg, estimatedA1C,
    recentWeightLbs, totalLostLbs,
  } = userContext ?? {}

  const contextLines = [
    diagnosisDate    && `- Diagnosed with Type 2 diabetes: ${diagnosisDate} (${weeksSinceDiagnosis ?? '?'} weeks ago)`,
    ketoStartDate    && `- Started keto/low-carb diet: ${ketoStartDate} (${weeksOnKeto ?? '?'} weeks ago)`,
    glp1StartDate    && `- Started GLP-1 medication: ${glp1StartDate} (${weeksOnGLP1 ?? '?'} weeks ago)`,
    medication       && `- Current medication: ${medication} ${currentDose ?? ''}mg`,
    avgGlucose       && `- Average glucose (all readings): ${avgGlucose} mg/dL`,
    fastingAvg       && `- Average fasting glucose: ${fastingAvg} mg/dL`,
    estimatedA1C     && `- Estimated A1C: ${estimatedA1C}%`,
    recentWeightLbs  && `- Current weight: ${recentWeightLbs} lbs`,
    totalLostLbs     && `- Total weight lost: ${totalLostLbs} lbs`,
  ].filter(Boolean).join('\n')

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: `You are a knowledgeable, encouraging health educator who specializes in Type 2 diabetes, GLP-1 medications, and ketogenic diets. You give clear, plain-English explanations grounded in science, tailored to someone who is newly diagnosed and learning. You are warm and supportive, never alarmist. You do not give medical advice or recommend specific medications — you educate and explain the science. When relevant, connect your answer to the user's specific situation using the context provided. Keep answers focused and practical, under 150 words. No markdown formatting, plain paragraphs only.`,
      messages: [{
        role: 'user',
        content: `Here is the user's health context:\n${contextLines || '(no context available)'}\n\nTheir question: ${question.trim()}`,
      }],
    })

    const answer = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
    res.json({ answer })
  } catch (err) {
    console.error('AI ask error:', err)
    res.status(500).json({ error: 'AI request failed' })
  }
})

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message)
  res.status(500).json({ error: err.message })
})

app.listen(PORT, () => {
  console.log(`Tare/GLP-1 Tracker running on port ${PORT}`)
  console.log(`Per-user DBs at: ${USERS_DIR}`)
  console.log(`Tenant: ${AAD_TENANT_ID}, Client: ${AAD_CLIENT_ID}`)
  if (PRIMARY_USER_OID) console.log(`Legacy migration armed for oid ${PRIMARY_USER_OID}`)
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10)
}

function pick(obj, keys) {
  return Object.fromEntries(keys.map(k => [k, obj[k] ?? null]))
}
