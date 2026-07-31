const datePattern = /^\d{4}-\d{2}-\d{2}$/

function parseDate(date: string) {
  if (!datePattern.test(date)) return null

  const [year, month, day] = date.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))

  return parsed.toISOString().slice(0, 10) === date ? parsed : null
}

export function getTripDates(startDate: string, endDate: string) {
  const start = parseDate(startDate)
  const end = parseDate(endDate)

  if (!start || !end || start > end) return []

  const dates: string[] = []
  const current = new Date(start)

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10))
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return dates
}

export function formatPlanningDate(date: string) {
  const parsed = parseDate(date)
  if (!parsed) return date

  const formatted = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(parsed)

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function isDateInTrip(date: string, tripDates: string[]) {
  return tripDates.includes(date)
}
