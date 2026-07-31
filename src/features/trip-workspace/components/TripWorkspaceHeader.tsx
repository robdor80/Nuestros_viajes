import type { CSSProperties } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import {
  tripStatusLabels,
  type BaseTrip,
} from '../../trips/model/trip'
import styles from './TripWorkspaceHeader.module.css'

type TripWorkspaceHeaderProps = {
  trip: BaseTrip
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

export function TripWorkspaceHeader({ trip }: TripWorkspaceHeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const goBack = () => {
    const hasApplicationHistory =
      location.key !== 'default' && window.history.length > 1

    if (hasApplicationHistory) {
      void navigate(-1)
      return
    }

    void navigate('/')
  }

  return (
    <header
      className={styles.header}
      style={{ '--trip-color': trip.color } as TripWorkspaceHeaderStyle}
    >
      <div className={styles.topRow}>
        <div className={styles.navigationActions}>
          <button className={styles.backButton} type="button" onClick={goBack}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Volver
          </button>
          <Link className={styles.homeLink} to="/">
            Inicio
          </Link>
        </div>

        {trip.status === 'archived' && (
          <span className={styles.archivedBadge}>Viaje archivado</span>
        )}
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
