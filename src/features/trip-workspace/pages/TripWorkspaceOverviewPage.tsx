import { useParams } from 'react-router-dom'

import { TripSectionCard } from '../components/TripSectionCard'
import {
  getTripWorkspacePath,
  tripWorkspaceSections,
} from '../model/trip-workspace-section'
import styles from './TripWorkspaceOverviewPage.module.css'

export function TripWorkspaceOverviewPage() {
  const { tripId } = useParams()

  if (!tripId) {
    return null
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
          />
        ))}
      </div>
    </section>
  )
}
