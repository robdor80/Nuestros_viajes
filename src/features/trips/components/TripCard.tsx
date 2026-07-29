import {
  tripStatusLabels,
  type BaseTrip,
} from '../model/trip'
import styles from './TripCard.module.css'

type TripCardProps = {
  trip: BaseTrip
  isActive: boolean
  onOpen: (trip: BaseTrip) => void
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

export function TripCard({
  trip,
  isActive,
  onOpen,
}: TripCardProps) {
  return (
    <article
      className={`${styles.card} ${isActive ? styles.activeCard : ''}`}
    >
      <div className={styles.meta}>
        <span className={styles.cardLabel}>
          {isActive ? 'Viaje activo' : 'Viaje guardado'}
        </span>
        <span className={styles.statusBadge}>
          {tripStatusLabels[trip.status]}
        </span>
      </div>

      <h3 className={styles.title}>{trip.name}</h3>
      <p className={styles.destination}>
        {trip.destination}, {trip.country}
      </p>

      <dl className={styles.facts}>
        <div>
          <dt>Fechas</dt>
          <dd>
            {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
          </dd>
        </div>
        <div>
          <dt>Viajeros</dt>
          <dd>{trip.participants.join(' · ')}</dd>
        </div>
      </dl>

      <button
        className={styles.openButton}
        type="button"
        aria-label={`Abrir viaje ${trip.name}`}
        onClick={() => onOpen(trip)}
      >
        Abrir viaje
      </button>
    </article>
  )
}
