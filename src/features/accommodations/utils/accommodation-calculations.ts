const datePattern = /^\d{4}-\d{2}-\d{2}$/

function parseUtcDate(date: string) {
  if (!datePattern.test(date)) return null
  const [year, month, day] = date.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))

  return parsed.toISOString().slice(0, 10) === date ? parsed : null
}

export function calculateNights(checkInDate: string, checkOutDate: string) {
  const checkIn = parseUtcDate(checkInDate)
  const checkOut = parseUtcDate(checkOutDate)
  if (!checkIn || !checkOut || checkOut <= checkIn) return ''

  const millisecondsPerDay = 24 * 60 * 60 * 1000
  return String(Math.round((checkOut.getTime() - checkIn.getTime()) / millisecondsPerDay))
}

function parsePrice(value: string) {
  const normalized = value
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '')
  const parsed = Number(normalized)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function calculatePricePerNight(totalPrice: string, nights: string) {
  const parsedTotal = parsePrice(totalPrice)
  const parsedNights = Number(nights)
  if (!parsedTotal || !Number.isFinite(parsedNights) || parsedNights <= 0) {
    return ''
  }

  return `${new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(parsedTotal / parsedNights)} €`
}
