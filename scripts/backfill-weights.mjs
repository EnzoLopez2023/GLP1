const BASE = 'http://localhost:3004/api'

const entries = [
  { date: '2026-01-04', weightLbs: 280.5, notes: 'estimated' },
  { date: '2026-01-11', weightLbs: 277.9, notes: 'estimated' },
  { date: '2026-01-18', weightLbs: 275.4, notes: 'estimated' },
  { date: '2026-01-25', weightLbs: 273.0, notes: 'estimated' },
  { date: '2026-02-01', weightLbs: 270.7, notes: 'estimated' },
  { date: '2026-02-08', weightLbs: 268.5, notes: 'estimated' },
  { date: '2026-02-15', weightLbs: 266.3, notes: 'estimated' },
  { date: '2026-02-22', weightLbs: 264.2, notes: 'estimated' },
  { date: '2026-03-01', weightLbs: 262.2, notes: 'estimated' },
  { date: '2026-03-08', weightLbs: 260.3, notes: 'estimated' },
  { date: '2026-03-15', weightLbs: 258.4, notes: 'estimated' },
  { date: '2026-03-22', weightLbs: 256.6, notes: 'estimated' },
  { date: '2026-03-29', weightLbs: 254.9, notes: 'estimated' },
]

const existing = await fetch(`${BASE}/weightlog`).then(r => r.json())
const existingDates = new Set(existing.map(e => e.date))

for (const entry of entries) {
  if (existingDates.has(entry.date)) {
    console.log(`SKIP (exists): ${entry.date} — ${entry.weightLbs} lbs`)
    continue
  }
  const res = await fetch(`${BASE}/weightlog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  })
  const saved = await res.json()
  console.log(`ADDED: ${saved.date} — ${saved.weightLbs} lbs (id=${saved.id})`)
}

console.log('Done.')
