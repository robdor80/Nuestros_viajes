import { ComingSoonPage } from '../../../shared/components/ComingSoonPage/ComingSoonPage'
import type { BaseTrip } from '../model/trip'
import styles from './TripsPage.module.css'

type TripsPageProps = {
  activeTrip: BaseTrip | null
}

export function TripsPage({ activeTrip }: TripsPageProps) {
  return (
    <ComingSoonPage
      eyebrow="Mis viajes"
      title="Todos nuestros viajes, en un mismo lugar."
      description="Esta sección reunirá los viajes que preparemos y aquellos que queramos conservar. La desarrollaremos en un próximo paso."
    >
      {activeTrip && (
        <div className={styles.currentTrip}>
          <span>Viaje activo</span>
          <strong>{activeTrip.name}</strong>
          <p>
            {activeTrip.destination}, {activeTrip.country}
          </p>
        </div>
      )}
    </ComingSoonPage>
  )
}
