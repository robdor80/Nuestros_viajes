import type { CSSProperties } from 'react'

import {
  tripStatusLabels,
  type BaseTrip,
} from '../model/trip'
import { TripActionsMenu } from './TripActionsMenu'
import styles from './TripCard.module.css'

type TripCardProps = {
  trip: BaseTrip
  isActive: boolean
  onOpen?: (trip: BaseTrip) => void
  onEdit: (trip: BaseTrip) => void
  onArchive?: (trip: BaseTrip) => void
  onRestore?: (trip: BaseTrip) => void
  onDelete: (trip: BaseTrip) => void
  actionsDisabled?: boolean
  contextLabel?: string
}

type TripCardStyle = CSSProperties & {
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

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function TripCard({
  trip,
  isActive,
  onOpen,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  actionsDisabled = false,
  contextLabel = 'Viaje guardado',
}: TripCardProps) {
  const isArchived = trip.status === 'archived'

  return (
    <article
      className={`${styles.card} ${isActive ? styles.activeCard : ''}`}
      style={{ '--trip-color': trip.color } as TripCardStyle}
      aria-current={isActive ? 'true' : undefined}
    >
      <div className={styles.meta}>
        <span className={styles.cardLabel}>{contextLabel}</span>
        <div className={styles.metaActions}>
          <span className={styles.statusBadge}>
            {tripStatusLabels[trip.status]}
          </span>
          <TripActionsMenu
            trip={trip}
            disabled={actionsDisabled}
            onEdit={onEdit}
            onArchive={onArchive}
            onRestore={onRestore}
            onDelete={onDelete}
          />
        </div>
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
        {isArchived && trip.archivedAt && (
          <div>
            <dt>Archivado</dt>
            <dd>{formatDateTime(trip.archivedAt)}</dd>
          </div>
        )}
      </dl>

      {isArchived && onRestore ? (
        <button
          className={styles.openButton}
          type="button"
          disabled={actionsDisabled}
          aria-label={`Restaurar viaje ${trip.name}`}
          onClick={() => onRestore(trip)}
        >
          {actionsDisabled ? 'Restaurando…' : 'Restaurar'}
        </button>
      ) : (
        onOpen && (
          <button
            className={styles.openButton}
            type="button"
            aria-label={`Abrir viaje ${trip.name}`}
            onClick={() => onOpen(trip)}
          >
            Abrir viaje
          </button>
        )
      )}
    </article>
  )
}
