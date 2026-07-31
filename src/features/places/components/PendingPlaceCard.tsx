import { useState } from 'react'

import type { Place } from '../model/place'
import { getPlaceInformationSummary } from '../utils/place-presentation'
import { PlaceActionsMenu } from './PlaceActionsMenu'
import { PlaceStatusBadge } from './PlaceStatusBadge'
import styles from './PendingPlaceCard.module.css'

type PlaceActionsMenuProps = Parameters<typeof PlaceActionsMenu>[0]

type PendingPlaceCardProps = {
  place: Place
  disabled?: boolean
  onEdit: (place: Place) => void
  onChangeStatus: PlaceActionsMenuProps['onChangeStatus']
  onDelete: (place: Place) => void
}

export function PendingPlaceCard({
  place,
  disabled = false,
  onEdit,
  onChangeStatus,
  onDelete,
}: PendingPlaceCardProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)

  const details = getPlaceInformationSummary(place)
  const isNameOnlyDraft =
    place.contentStatus === 'draft' && details.length === 0

  return (
    <article className={styles.card}>
      {place.imageUrl && failedImageUrl !== place.imageUrl && (
        <img
          className={styles.thumbnail}
          src={place.imageUrl}
          alt=""
          loading="lazy"
          onError={() => setFailedImageUrl(place.imageUrl)}
        />
      )}

      <div className={styles.content}>
        <div className={styles.topRow}>
          <PlaceStatusBadge status={place.contentStatus} />
          <PlaceActionsMenu
            place={place}
            disabled={disabled}
            onEdit={onEdit}
            onChangeStatus={onChangeStatus}
            onDelete={onDelete}
          />
        </div>
        <h3>{place.name}</h3>
        <p>
          {isNameOnlyDraft
            ? 'Solo se ha indicado el nombre.'
            : details.slice(0, 4).join(' · ')}
        </p>
        <button type="button" onClick={() => onEdit(place)}>
          {place.contentStatus === 'draft' ? 'Completar' : 'Continuar'}
        </button>
      </div>
    </article>
  )
}
