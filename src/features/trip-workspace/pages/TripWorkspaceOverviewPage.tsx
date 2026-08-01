import { useOutletContext, useParams } from 'react-router-dom'

import { useAccommodations } from '../../accommodations/hooks/useAccommodations'
import { usePlaces } from '../../places/hooks/usePlaces'
import { usePlanningDays } from '../../planning/hooks/usePlanningDays'
import { getTripDates } from '../../planning/utils/planning-dates'
import type { BaseTrip } from '../../trips/model/trip'
import { TripSectionCard } from '../components/TripSectionCard'
import {
  getTripWorkspacePath,
  tripWorkspaceSections,
} from '../model/trip-workspace-section'
import styles from './TripWorkspaceOverviewPage.module.css'

export function TripWorkspaceOverviewPage() {
  const { tripId } = useParams()
  const trip = useOutletContext<BaseTrip>()
  const {
    places,
    status: placesStatus,
  } = usePlaces(tripId ?? '')
  const {
    days: planningDays,
    status: planningStatus,
  } = usePlanningDays(tripId ?? '')
  const {
    accommodations,
    status: accommodationsStatus,
  } = useAccommodations(tripId ?? '')

  if (!tripId) {
    return null
  }

  const placesSummary = {
    status: placesStatus,
    total: places.length,
    completed: places.filter(
      (place) => place.contentStatus === 'completed',
    ).length,
    inProgress: places.filter(
      (place) => place.contentStatus === 'in_progress',
    ).length,
    draft: places.filter((place) => place.contentStatus === 'draft').length,
  }
  const tripDates = getTripDates(trip.startDate, trip.endDate)
  const currentPlanningDays = planningDays.filter((day) =>
    tripDates.includes(day.date),
  )
  const planningSummary = {
    kind: 'planning' as const,
    status: planningStatus,
    total: tripDates.length,
    contentCount: planningDays.length,
    completed: currentPlanningDays.filter(
      (day) => day.contentStatus === 'completed',
    ).length,
    inProgress: currentPlanningDays.filter(
      (day) => day.contentStatus === 'in_progress',
    ).length,
    draft: currentPlanningDays.filter(
      (day) => day.contentStatus === 'draft',
    ).length,
    notStarted: Math.max(0, tripDates.length - currentPlanningDays.length),
  }
  const accommodationsSummary = {
    kind: 'accommodations' as const,
    status: accommodationsStatus,
    total: accommodations.length,
    completed: accommodations.filter(
      (accommodation) => accommodation.contentStatus === 'completed',
    ).length,
    inProgress: accommodations.filter(
      (accommodation) => accommodation.contentStatus === 'in_progress',
    ).length,
    draft: accommodations.filter(
      (accommodation) => accommodation.contentStatus === 'draft',
    ).length,
  }

  return (
    <section aria-labelledby="trip-summary-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Vista general</p>
        <h2 id="trip-summary-title">Resumen del viaje</h2>
        <p>
          Accede a cada apartado para preparar y consultar la información del
          viaje.
        </p>
      </header>

      <div className={styles.grid}>
        {tripWorkspaceSections.map((section) => (
          <TripSectionCard
            key={section.id}
            section={section}
            to={getTripWorkspacePath(tripId, section.slug)}
            contentSummary={
              section.id === 'places'
                ? placesSummary
                : section.id === 'planning'
                  ? planningSummary
                  : section.id === 'accommodation'
                    ? accommodationsSummary
                  : undefined
            }
          />
        ))}
      </div>
    </section>
  )
}
