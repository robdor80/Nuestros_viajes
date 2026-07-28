import { ComingSoonPage } from '../../../shared/components/ComingSoonPage/ComingSoonPage'
import { tripStatusLabels, type BaseTrip } from '../model/trip'
import styles from './TripsPage.module.css'

type TripsPageProps = {
  activeTrip: BaseTrip | null
  onOpenTrip: (trip: BaseTrip) => void
}

export function TripsPage({ activeTrip, onOpenTrip }: TripsPageProps) {
  return (
    <ComingSoonPage
      eyebrow="Mis viajes"
      title="Todos nuestros viajes, en un mismo lugar."
      description="Esta sección reunirá los viajes que preparemos y aquellos que queramos conservar. La desarrollaremos en un próximo paso."
    >
      {activeTrip && (
        <div className={styles.currentTrip}>
          <div className={styles.cardMeta}>
            <span className={styles.cardLabel}>Viaje activo</span>
            <span className={styles.statusBadge}>
              {tripStatusLabels[activeTrip.status]}
            </span>
          </div>
          <strong>{activeTrip.name}</strong>
          <p>
            {activeTrip.destination}, {activeTrip.country}
          </p>
          <button type="button" onClick={() => onOpenTrip(activeTrip)}>
            Abrir viaje
          </button>
        </div>
      )}
    </ComingSoonPage>
  )
}
