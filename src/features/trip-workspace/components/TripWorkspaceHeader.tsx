import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'

import {
  tripStatusLabels,
  type BaseTrip,
} from '../../trips/model/trip'
import styles from './TripWorkspaceHeader.module.css'

type TripWorkspaceHeaderProps = {
  trip: BaseTrip
  onPrint: () => void
}

type TripWorkspaceHeaderStyle = CSSProperties & {
  '--trip-color': string
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

export function TripWorkspaceHeader({
  trip,
  onPrint,
}: TripWorkspaceHeaderProps) {
  return (
    <header
      className={styles.header}
      style={{ '--trip-color': trip.color } as TripWorkspaceHeaderStyle}
    >
      <div className={styles.topRow}>
        <Link className={styles.homeLink} to="/">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Inicio
        </Link>

        {trip.status === 'archived' && (
          <span className={styles.archivedBadge}>Viaje archivado</span>
        )}

        <button className={styles.printButton} type="button" onClick={onPrint}>
          PDF / Imprimir
        </button>
      </div>

      <div className={styles.heading}>
        <span className={styles.colorMarker} aria-hidden="true" />
        <div>
          <p className={styles.eyebrow}>Espacio del viaje</p>
          <h1>{trip.name}</h1>
          <p className={styles.destination}>
            {trip.destination}, {trip.country}
          </p>
        </div>
      </div>

      <dl className={styles.facts}>
        <div>
          <dt>Fechas</dt>
          <dd>
            {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
          </dd>
        </div>
        <div>
          <dt>Participantes</dt>
          <dd>
            {trip.participants.length > 0
              ? trip.participants.join(' · ')
              : 'Sin participantes'}
          </dd>
        </div>
        <div>
          <dt>Estado del viaje</dt>
          <dd>
            <span className={styles.statusBadge}>
              {tripStatusLabels[trip.status]}
            </span>
          </dd>
        </div>
      </dl>
    </header>
  )
}
