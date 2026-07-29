import { TripCard } from '../../trips/components/TripCard'
import type {
  BaseTrip,
  TripsLoadStatus,
} from '../../trips/model/trip'
import styles from './HomePage.module.css'

type HomePageProps = {
  activeTrip: BaseTrip | null
  trips: BaseTrip[]
  tripsStatus: TripsLoadStatus
  tripsError: string | null
  confirmation: string | null
  onDismissConfirmation: () => void
  onOpenTrip: (trip: BaseTrip) => void
  onRetryTrips: () => void
}

export function HomePage({
  activeTrip,
  trips,
  tripsStatus,
  tripsError,
  confirmation,
  onDismissConfirmation,
  onOpenTrip,
  onRetryTrips,
}: HomePageProps) {
  const activeTripYear = activeTrip?.startDate.slice(0, 4)

  return (
    <div className={styles.page}>
      {confirmation && (
        <div
          className={styles.confirmation}
          role="status"
          aria-atomic="true"
        >
          <span className={styles.confirmationMark} aria-hidden="true">
            ✓
          </span>
          <p>{confirmation}</p>
          <button
            type="button"
            aria-label="Cerrar confirmación"
            onClick={onDismissConfirmation}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      )}

      <section className={styles.welcome} aria-labelledby="welcome-title">
        <p className={styles.eyebrow}>
          {activeTrip ? 'Viaje activo' : 'Inicio'}
        </p>
        <h1 id="welcome-title" className={styles.title}>
          {activeTrip
            ? `${activeTrip.destination} · ${activeTripYear}`
            : 'Bienvenido a Nuestros viajes.'}
        </h1>
        <p className={styles.introduction}>
          {activeTrip
            ? `${activeTrip.name} ya tiene su espacio preparado. A partir de aquí iremos completándolo paso a paso.`
            : 'Aquí aparecerán tus próximos viajes y los viajes que quieras conservar para siempre.'}
        </p>
      </section>

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
          <button type="button" onClick={onRetryTrips}>
            Reintentar
          </button>
        </section>
      )}

      {tripsStatus === 'ready' && trips.length === 0 && (
        <section
          className={styles.emptyState}
          aria-labelledby="empty-state-title"
        >
          <div className={styles.emptyStateMark} aria-hidden="true">
            <span />
          </div>
          <div>
            <p className={styles.emptyStateLabel}>Tu espacio de viaje</p>
            <h2 id="empty-state-title" className={styles.emptyStateTitle}>
              Aún no hay viajes disponibles.
            </h2>
            <p className={styles.emptyStateDescription}>
              Cuando creemos el primero, aparecerá aquí con todo lo necesario
              para empezar a prepararlo.
            </p>
          </div>
        </section>
      )}

      {tripsStatus === 'ready' && trips.length > 0 && (
        <section
          className={styles.tripsSection}
          aria-labelledby="home-trips-title"
        >
          <div className={styles.tripsHeading}>
            <p className={styles.emptyStateLabel}>Tus viajes</p>
            <h2 id="home-trips-title" className={styles.emptyStateTitle}>
              Viajes guardados
            </h2>
          </div>
          <div className={styles.tripsGrid}>
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                isActive={trip.id === activeTrip?.id}
                onOpen={onOpenTrip}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
