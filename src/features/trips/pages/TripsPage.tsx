import { TripCard } from '../components/TripCard'
import type {
  BaseTrip,
  TripsLoadStatus,
} from '../model/trip'
import styles from './TripsPage.module.css'

type TripsPageProps = {
  activeTrip: BaseTrip | null
  trips: BaseTrip[]
  tripsStatus: TripsLoadStatus
  tripsError: string | null
  onOpenTrip: (trip: BaseTrip) => void
  onRetry: () => void
}

export function TripsPage({
  activeTrip,
  trips,
  tripsStatus,
  tripsError,
  onOpenTrip,
  onRetry,
}: TripsPageProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Mis viajes</p>
        <h1 className={styles.title}>Todos nuestros viajes.</h1>
        <p className={styles.description}>
          Los viajes que estamos preparando y aquellos que queremos conservar.
        </p>
      </header>

      {tripsStatus === 'loading' && (
        <section className={styles.state} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <div>
            <h2>Cargando viajes…</h2>
            <p>Estamos recuperando los viajes guardados.</p>
          </div>
        </section>
      )}

      {tripsStatus === 'error' && (
        <section className={styles.state} role="alert">
          <div>
            <h2>No se han podido cargar los viajes.</h2>
            <p>{tripsError}</p>
          </div>
          <button type="button" onClick={onRetry}>
            Reintentar
          </button>
        </section>
      )}

      {tripsStatus === 'ready' && trips.length === 0 && (
        <section className={styles.emptyState}>
          <h2>Aún no hay viajes disponibles.</h2>
          <p>
            Cuando creemos el primero, aparecerá aquí para poder abrirlo
            cuando lo necesitemos.
          </p>
        </section>
      )}

      {tripsStatus === 'ready' && trips.length > 0 && (
        <section
          className={styles.tripsGrid}
          aria-label="Viajes guardados"
        >
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              isActive={trip.id === activeTrip?.id}
              onOpen={onOpenTrip}
            />
          ))}
        </section>
      )}
    </div>
  )
}
