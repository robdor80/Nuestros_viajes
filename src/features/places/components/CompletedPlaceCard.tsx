import { useEffect, useId, useRef, useState } from 'react'

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
  const [expandedDescription, setExpandedDescription] = useState<
    string | null
  >(null)
  const [canExpandDescription, setCanExpandDescription] = useState(false)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const descriptionId = useId()
  const isDescriptionExpanded = expandedDescription === place.description
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

  useEffect(() => {
    const description = descriptionRef.current

    if (!description || !place.description) {
      return
    }

    let animationFrame: number | null = null
    const measureOverflow = () => {
      if (expandedDescription === place.description) {
        return
      }

      setCanExpandDescription(
        description.scrollHeight > description.clientHeight + 1,
      )
    }
    const scheduleMeasurement = () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame)
      }

      animationFrame = window.requestAnimationFrame(measureOverflow)
    }
    const resizeObserver = new ResizeObserver(scheduleMeasurement)

    resizeObserver.observe(description)
    window.addEventListener('resize', scheduleMeasurement)
    scheduleMeasurement()

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame)
      }
      resizeObserver.disconnect()
      window.removeEventListener('resize', scheduleMeasurement)
    }
  }, [expandedDescription, place.description])

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
          <div className={styles.descriptionBlock}>
            <p
              ref={descriptionRef}
              id={descriptionId}
              className={`${styles.description} ${
                isDescriptionExpanded ? '' : styles.descriptionCollapsed
              }`}
            >
              {place.description}
            </p>
            {canExpandDescription && (
              <button
                className={styles.descriptionToggle}
                type="button"
                aria-expanded={isDescriptionExpanded}
                aria-controls={descriptionId}
                onClick={() =>
                  setExpandedDescription((currentDescription) =>
                    currentDescription === place.description
                      ? null
                      : place.description,
                  )
                }
              >
                {isDescriptionExpanded
                  ? 'Mostrar menos'
                  : 'Ver descripción completa'}
              </button>
            )}
          </div>
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
