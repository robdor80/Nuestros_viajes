import { useState } from 'react'

import {
  placeBestTimeLabels,
  placeCategoryLabels,
  placePriorityLabels,
  type Place,
} from '../model/place'
import { PlaceActionsMenu } from './PlaceActionsMenu'
import { PlaceStatusBadge } from './PlaceStatusBadge'
import styles from './CompletedPlaceCard.module.css'

type CompletedPlaceCardProps = {
  place: Place
  disabled?: boolean
  onEdit: (place: Place) => void
  onChangeStatus: PlaceActionsMenuProps['onChangeStatus']
  onDelete: (place: Place) => void
}

type PlaceActionsMenuProps = Parameters<typeof PlaceActionsMenu>[0]

export function CompletedPlaceCard({
  place,
  disabled = false,
  onEdit,
  onChangeStatus,
  onDelete,
}: CompletedPlaceCardProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const showImage =
    Boolean(place.imageUrl) && failedImageUrl !== place.imageUrl
  const facts = [
    place.address && { label: 'Dirección', value: place.address },
    place.openingHours && { label: 'Horario', value: place.openingHours },
    place.price && { label: 'Precio', value: place.price },
    place.estimatedDuration && {
      label: 'Duración',
      value: place.estimatedDuration,
    },
    place.bestTime && {
      label: 'Mejor momento',
      value: placeBestTimeLabels[place.bestTime],
    },
    place.requiresReservation !== null && {
      label: 'Reserva',
      value: place.requiresReservation ? 'Necesaria' : 'No necesaria',
    },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact))

  return (
    <article className={styles.card}>
      {showImage && (
        <div className={styles.imageWrap}>
          <img
            src={place.imageUrl}
            alt={place.name}
            loading="lazy"
            onError={() => setFailedImageUrl(place.imageUrl)}
          />
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.topRow}>
          <div className={styles.badges}>
            <PlaceStatusBadge status={place.contentStatus} />
            {place.priority && (
              <span className={styles.priorityBadge}>
                {placePriorityLabels[place.priority]}
              </span>
            )}
          </div>
          <PlaceActionsMenu
            place={place}
            disabled={disabled}
            onEdit={onEdit}
            onChangeStatus={onChangeStatus}
            onDelete={onDelete}
          />
        </div>

        <div className={styles.heading}>
          <h3>{place.name}</h3>
          {place.category && <p>{placeCategoryLabels[place.category]}</p>}
        </div>

        {place.description && (
          <p className={styles.description}>{place.description}</p>
        )}

        {facts.length > 0 && (
          <dl className={styles.facts}>
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {place.notes && (
          <div className={styles.notes}>
            <h4>Notas</h4>
            <p>{place.notes}</p>
          </div>
        )}

        {(place.mapsUrl || place.websiteUrl) && (
          <div className={styles.links}>
            {place.mapsUrl && (
              <a href={place.mapsUrl} target="_blank" rel="noreferrer">
                Abrir en Maps
              </a>
            )}
            {place.websiteUrl && (
              <a href={place.websiteUrl} target="_blank" rel="noreferrer">
                Página web
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
