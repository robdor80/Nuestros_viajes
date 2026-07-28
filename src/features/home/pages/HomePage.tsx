import type { BaseTrip } from '../../trips/model/trip'
import styles from './HomePage.module.css'

type HomePageProps = {
  activeTrip: BaseTrip | null
  confirmation: string | null
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

export function HomePage({ activeTrip, confirmation }: HomePageProps) {
  const activeTripYear = activeTrip?.startDate.slice(0, 4)

  return (
    <div className={styles.page}>
      {confirmation && (
        <div className={styles.confirmation} role="status">
          <span aria-hidden="true">✓</span>
          {confirmation}
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

      {activeTrip ? (
        <section
          className={styles.activeTrip}
          aria-labelledby="active-trip-title"
        >
          <div className={styles.activeTripHeading}>
            <p className={styles.emptyStateLabel}>Tu próximo viaje</p>
            <h2 id="active-trip-title" className={styles.emptyStateTitle}>
              {activeTrip.name}
            </h2>
            {activeTrip.description && (
              <p className={styles.emptyStateDescription}>
                {activeTrip.description}
              </p>
            )}
          </div>

          <dl className={styles.tripFacts}>
            <div>
              <dt>Destino</dt>
              <dd>
                {activeTrip.destination}, {activeTrip.country}
              </dd>
            </div>
            <div>
              <dt>Fechas</dt>
              <dd>
                {formatDate(activeTrip.startDate)} —{' '}
                {formatDate(activeTrip.endDate)}
              </dd>
            </div>
            <div>
              <dt>Viajeros</dt>
              <dd>{activeTrip.participants.join(', ')}</dd>
            </div>
          </dl>
        </section>
      ) : (
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
    </div>
  )
}
