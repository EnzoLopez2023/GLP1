/** Download an object as a JSON file */
export function downloadJSON(data, filename = 'glp1-export.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Convert array of objects to CSV string */
export function toCSV(rows) {
  if (!rows?.length) return ''
  const headers = Object.keys(rows[0])
  const lines   = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const v = row[h] ?? ''
        return typeof v === 'string' && (v.includes(',') || v.includes('"'))
          ? `"${v.replace(/"/g, '""')}"`
          : v
      }).join(',')
    ),
  ]
  return lines.join('\n')
}

/** Download CSV */
export function downloadCSV(rows, filename = 'glp1-export.csv') {
  const csv  = toCSV(rows)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Read a file as text (Promise) */
export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

/** Read file as base64 DataURL */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
