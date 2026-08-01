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

export function buildGoogleMapsEmbedDirectionsUrl(
  values: TransferFormData,
  apiKey: string,
) {
  const origin = values.origin.trim()
  const destination = values.destination.trim()
  const key = apiKey.trim()

  if (!origin || !destination || !key) return ''

  const url = new URL('https://www.google.com/maps/embed/v1/directions')
  url.searchParams.set('key', key)
  url.searchParams.set('origin', origin)
  url.searchParams.set('destination', destination)
  url.searchParams.set('mode', 'driving')
  url.searchParams.set('units', 'metric')
  url.searchParams.set('language', 'es')

  const waypoints = values.plannedStops
    .slice()
    .sort((first, second) => first.order - second.order)
    .map((stop) => stop.location.trim() || stop.description.trim())
    .filter(Boolean)
    .slice(0, 20)

  if (waypoints.length > 0) {
    url.searchParams.set('waypoints', waypoints.join('|'))
  }

  const avoids = [
    values.hasTolls === false && 'tolls',
    values.viaMotorway === false && 'highways',
  ].filter((avoid): avoid is string => Boolean(avoid))

  if (avoids.length > 0) {
    url.searchParams.set('avoid', avoids.join('|'))
  }

  return url.toString()
}

export function buildGoogleMapsPublicEmbedDirectionsUrl(
  values: TransferFormData,
) {
  const origin = values.origin.trim()
  const destination = values.destination.trim()

  if (!origin || !destination) return ''

  const waypoints = values.plannedStops
    .slice()
    .sort((first, second) => first.order - second.order)
    .map((stop) => stop.location.trim() || stop.description.trim())
    .filter(Boolean)

  const routePoints = [origin, ...waypoints, destination]
  const url = new URL('https://www.google.com/maps/dir/')
  url.pathname = `/maps/dir/${routePoints.map(encodeURIComponent).join('/')}/`
  url.searchParams.set('output', 'embed')
  url.searchParams.set('hl', 'es')

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
    (url.pathname.includes('/maps/embed') ||
      url.searchParams.get('output') === 'embed')
  )
}
