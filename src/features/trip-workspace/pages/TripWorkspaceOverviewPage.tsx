import { useParams } from 'react-router-dom'

import { usePlaces } from '../../places/hooks/usePlaces'
import { TripSectionCard } from '../components/TripSectionCard'
import {
  getTripWorkspacePath,
  tripWorkspaceSections,
} from '../model/trip-workspace-section'
import styles from './TripWorkspaceOverviewPage.module.css'

export function TripWorkspaceOverviewPage() {
  const { tripId } = useParams()
  const {
    places,
    status: placesStatus,
  } = usePlaces(tripId ?? '')

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
              section.id === 'places' ? placesSummary : undefined
            }
          />
        ))}
      </div>
    </section>
  )
}
