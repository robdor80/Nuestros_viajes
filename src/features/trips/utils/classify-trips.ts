import type { BaseTrip } from '../model/trip'

export type ClassifiedTrips = {
  upcomingTrips: BaseTrip[]
  completedTrips: BaseTrip[]
  archivedTrips: BaseTrip[]
}

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function classifyTrips(
  trips: readonly BaseTrip[],
  today = getLocalDateString(),
): ClassifiedTrips {
  const upcomingTrips: BaseTrip[] = []
  const completedTrips: BaseTrip[] = []
  const archivedTrips: BaseTrip[] = []

  trips.forEach((trip) => {
    if (trip.status === 'archived') {
      archivedTrips.push(trip)
      return
    }

    const isCompleted =
      trip.status === 'completed' || trip.endDate < today

    if (isCompleted) {
      completedTrips.push(trip)
      return
    }

    if (trip.endDate >= today) {
      upcomingTrips.push(trip)
    }
  })

  upcomingTrips.sort((firstTrip, secondTrip) =>
    firstTrip.startDate.localeCompare(secondTrip.startDate),
  )
  completedTrips.sort((firstTrip, secondTrip) =>
    secondTrip.endDate.localeCompare(firstTrip.endDate),
  )
  archivedTrips.sort((firstTrip, secondTrip) =>
    (secondTrip.archivedAt ?? secondTrip.updatedAt).localeCompare(
      firstTrip.archivedAt ?? firstTrip.updatedAt,
    ),
  )

  return { upcomingTrips, completedTrips, archivedTrips }
}
