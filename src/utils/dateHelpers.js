import { format, parseISO, differenceInDays, startOfWeek, endOfWeek,
         subDays, isToday, isYesterday, formatDistanceToNow } from 'date-fns'

/** Returns "YYYY-MM-DDThh:mm" in the device's local timezone — safe for datetime-local inputs */
export const localDateTimeStr = (date = new Date()) => {
  const d   = date instanceof Date ? date : new Date(date)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const toDateStr = (date = new Date()) =>
  format(date instanceof Date ? date : parseISO(date), 'yyyy-MM-dd')

export const toDisplayDate = (iso) =>
  format(parseISO(iso), 'MMM d, yyyy')

export const toDisplayDateTime = (iso) =>
  format(parseISO(iso), 'MMM d, yyyy h:mm a')

export const toTimeStr = (iso) =>
  format(parseISO(iso), 'h:mm a')

export const daysSince = (iso) =>
  differenceInDays(new Date(), parseISO(iso))

export const humanRelative = (iso) =>
  formatDistanceToNow(parseISO(iso), { addSuffix: true })

export const weekRange = (date = new Date()) => ({
  start: startOfWeek(date, { weekStartsOn: 0 }),
  end:   endOfWeek(date,   { weekStartsOn: 0 }),
})

/** Returns array of ISO date strings for the last N days (today first) */
export function lastNDays(n) {
  return Array.from({ length: n }, (_, i) =>
    toDateStr(subDays(new Date(), i))
  )
}

export { isToday, isYesterday, format, parseISO, differenceInDays, subDays }
