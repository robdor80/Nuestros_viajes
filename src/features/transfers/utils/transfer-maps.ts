import type { TransferFormData } from '../model/transfer'

export function buildGoogleMapsDirectionsUrl(values: TransferFormData) {
  const origin = values.origin.trim()
  const destination = values.destination.trim()
  if (!origin || !destination) return ''

  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  url.searchParams.set('origin', origin)
  url.searchParams.set('destination', destination)
  url.searchParams.set('travelmode', 'driving')

  const waypoints = values.plannedStops
    .slice()
    .sort((first, second) => first.order - second.order)
    .map((stop) => stop.location.trim())
    .filter(Boolean)

  if (waypoints.length > 0) {
    url.searchParams.set('waypoints', waypoints.join('|'))
  }

  return url.toString()
}

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function isValidMapsEmbedUrl(value: string) {
  if (!isValidHttpUrl(value)) return false

  const url = new URL(value)
  const hostname = url.hostname.replace(/^www\./, '')

  return (
    (hostname === 'google.com' || hostname === 'maps.google.com') &&
    url.pathname.includes('/maps/embed')
  )
}
