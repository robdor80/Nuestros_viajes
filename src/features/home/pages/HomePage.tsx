import { Link, useLocation } from 'react-router-dom'
import type { CSSProperties } from 'react'

import { TripCalendar } from '../../trips/components/TripCalendar'
import { TripCard } from '../../trips/components/TripCard'
import type {
  BaseTrip,
  TripsLoadStatus,
} from '../../trips/model/trip'
import { classifyTrips } from '../../trips/utils/classify-trips'
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

type CompletedTripStyle = CSSProperties & {
  '--trip-color': string
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
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
  const location = useLocation()
  const { upcomingTrips, completedTrips } = classifyTrips(trips)
  const calendarTrips = [...upcomingTrips, ...completedTrips]
  const recentCompletedTrips = completedTrips.slice(0, 5)
  const hasUpcomingTrips = upcomingTrips.length > 0
  const hasTrips = trips.length > 0

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

      {tripsStatus === 'loading' && (
        <section className={styles.state} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <div>
            <h1>Cargando viajes…</h1>
            <p>Estamos recuperando los viajes guardados.</p>
          </div>
        </section>
      )}

      {tripsStatus === 'error' && (
        <section className={styles.state} role="alert">
          <div>
            <h1>No se han podido cargar los viajes.</h1>
            <p>{tripsError}</p>
          </div>
          <button type="button" onClick={onRetryTrips}>
            Reintentar
          </button>
        </section>
      )}

      {tripsStatus === 'ready' && (
        <div
          className={`${styles.dashboard} ${
            hasUpcomingTrips
              ? styles.withUpcoming
              : styles.withoutUpcoming
          } ${!hasTrips ? styles.emptyDashboard : ''}`}
        >
          {hasUpcomingTrips && (
            <section
              className={styles.upcomingSection}
              aria-labelledby="upcoming-title"
            >
              <header className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>En el horizonte</p>
                  <h1 id="upcoming-title">Próximos viajes</h1>
                </div>
                <span className={styles.tripCount}>
                  {upcomingTrips.length}
                </span>
              </header>

              <div className={styles.upcomingGrid}>
                {upcomingTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    isActive={trip.id === activeTrip?.id}
                    contextLabel="Próximo viaje"
                    onOpen={onOpenTrip}
                  />
                ))}
              </div>
            </section>
          )}

          <div className={styles.calendarArea}>
            <TripCalendar
              trips={calendarTrips}
              onOpenTrip={onOpenTrip}
            />

            {!hasUpcomingTrips && hasTrips && (
              <p className={styles.mobileEmptyMessage}>
                No hay viajes próximos por ahora.
              </p>
            )}
          </div>

          {hasTrips ? (
            <aside
              className={styles.completedPanel}
              aria-labelledby="completed-title"
            >
              <header className={styles.completedHeader}>
                <div>
                  <p className={styles.eyebrow}>Recuerdos</p>
                  <h2 id="completed-title">Viajes realizados</h2>
                </div>
                {completedTrips.length > 0 && (
                  <span className={styles.tripCount}>
                    {completedTrips.length}
                  </span>
                )}
              </header>

              {recentCompletedTrips.length > 0 ? (
                <>
                  <div className={styles.completedList}>
                    {recentCompletedTrips.map((trip) => (
                      <article
                        className={styles.completedTrip}
                        key={trip.id}
                        style={
                          {
                            '--trip-color': trip.color,
                          } as CompletedTripStyle
                        }
                      >
                        <div>
                          <h3>{trip.name}</h3>
                          <p>
                            {trip.destination}, {trip.country}
                          </p>
                          <time>
                            {formatShortDate(trip.startDate)} —{' '}
                            {formatShortDate(trip.endDate)}
                          </time>
                        </div>
                        <button
                          type="button"
                          aria-label={`Abrir viaje ${trip.name}`}
                          onClick={() => onOpenTrip(trip)}
                        >
                          Abrir
                        </button>
                      </article>
                    ))}
                  </div>

                  <Link className={styles.libraryLink} to="/mis-viajes">
                    Ver todos en Mis viajes
                  </Link>
                </>
              ) : (
                <p className={styles.completedEmpty}>
                  Aún no hay viajes realizados.
                </p>
              )}
            </aside>
          ) : (
            <section className={styles.noTrips} aria-labelledby="no-trips">
              <p className={styles.eyebrow}>El próximo destino</p>
              <h1 id="no-trips">
                Todavía no hay ningún viaje preparado.
              </h1>
              <p>
                Crea el primero y empezará a ocupar su lugar en el
                calendario.
              </p>
              <Link
                to="/nuevo-viaje"
                state={{ backgroundLocation: location }}
              >
                Crear nuevo viaje
              </Link>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
