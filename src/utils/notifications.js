/** Request notification permission */
export async function requestPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

/** Show a browser notification */
export function notify(title, body, icon = '/favicon.svg') {
  if (Notification.permission !== 'granted') return
  new Notification(title, { body, icon })
}

/** Schedule an injection reminder.
 *  Stores a setTimeout handle — clears on HMR. For production use
 *  a ServiceWorker; this covers the local use-case well. */
const handles = {}

export function scheduleInjectionReminder(injectionDay, timeStr) {
  clearAllReminders()
  const [h, m] = timeStr.split(':').map(Number)
  const now = new Date()
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const targetDay = days.indexOf(injectionDay)

  function getNextOccurrence() {
    const next = new Date()
    next.setHours(h, m, 0, 0)
    let diff = targetDay - now.getDay()
    if (diff < 0 || (diff === 0 && next <= now)) diff += 7
    next.setDate(next.getDate() + diff)
    return next
  }

  const next = getNextOccurrence()
  const msUntil = next - now

  handles['injection'] = setTimeout(() => {
    notify('💉 Injection Reminder', `Time for your weekly GLP-1 injection!`)
    scheduleInjectionReminder(injectionDay, timeStr) // reschedule
  }, msUntil)
}

export function scheduleHydrationReminder(intervalHours = 2) {
  clearInterval(handles['hydration'])
  handles['hydration'] = setInterval(() => {
    notify('💧 Hydration Reminder', 'Have you had water recently? Stay hydrated!')
  }, intervalHours * 3600 * 1000)
}

export function clearAllReminders() {
  Object.values(handles).forEach(h => { clearTimeout(h); clearInterval(h) })
}
