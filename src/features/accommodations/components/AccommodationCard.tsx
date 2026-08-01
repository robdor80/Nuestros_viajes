import { useMemo, useState } from 'react'

import { PlaceStatusBadge } from '../../places/components/PlaceStatusBadge'
import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import {
  accommodationTypeLabels,
  bookingPlatformLabels,
  type Accommodation,
} from '../model/accommodation'
import { AccommodationActionsMenu } from './AccommodationActionsMenu'
import styles from './AccommodationCard.module.css'

type AccommodationCardProps = {
  accommodation: Accommodation
  disabled?: boolean
  onEdit: (accommodation: Accommodation) => void
  onChangeStatus: (
    accommodation: Accommodation,
    status: TripContentStatus,
  ) => void
  onDelete: (accommodation: Accommodation) => void
}

function formatDate(date: string) {
  if (!date) return ''
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00.000Z`))
}

export function AccommodationCard({
  accommodation,
  disabled = false,
  onEdit,
  onChangeStatus,
  onDelete,
}: AccommodationCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const hasImage = Boolean(accommodation.imageUrl)
  const showImage = hasImage && !imageFailed
  const isCompleted = accommodation.contentStatus === 'completed'
  const featureFacts = [
    accommodation.breakfastIncluded && 'Desayuno incluido',
    accommodation.parkingIncluded && 'Parking incluido',
    accommodation.freeCancellation && 'Cancelación gratuita',
    accommodation.pool && 'Piscina',
  ].filter((fact): fact is string => Boolean(fact))
  const facts = useMemo(
    () =>
      [
        accommodation.type && {
          label: 'Tipo',
          value: accommodationTypeLabels[accommodation.type],
        },
        (accommodation.checkInDate || accommodation.checkOutDate) && {
          label: 'Fechas',
          value: [formatDate(accommodation.checkInDate), formatDate(accommodation.checkOutDate)]
            .filter(Boolean)
            .join(' → '),
        },
        accommodation.nights && {
          label: 'Noches',
          value: accommodation.nights,
        },
        accommodation.totalPrice && {
          label: 'Precio total',
          value: accommodation.totalPrice,
        },
        accommodation.pricePerNight && {
          label: 'Precio por noche',
          value: accommodation.pricePerNight,
        },
        accommodation.isPaid !== null && {
          label: 'Pagado',
          value: accommodation.isPaid ? 'Sí' : 'No',
        },
        accommodation.freeCancellationDeadline && {
          label: 'Cancelación gratuita hasta',
          value: formatDate(accommodation.freeCancellationDeadline),
        },
        accommodation.checkInTime && {
          label: 'Check-in',
          value: accommodation.checkInTime,
        },
        accommodation.checkOutTime && {
          label: 'Check-out',
          value: accommodation.checkOutTime,
        },
        accommodation.reservationCode && {
          label: 'Código de reserva',
          value: accommodation.reservationCode,
        },
        accommodation.bookingPlatform && {
          label: 'Plataforma',
          value: bookingPlatformLabels[accommodation.bookingPlatform],
        },
        accommodation.address && {
          label: 'Dirección',
          value: accommodation.address,
        },
      ].filter((fact): fact is { label: string; value: string } =>
        Boolean(fact),
      ),
    [accommodation],
  )

  return (
    <article
      className={`${styles.card} ${
        isCompleted ? styles.completed : styles.pending
      }`}
    >
      {showImage && (
        <div className={styles.imageWrap}>
          <img
            src={accommodation.imageUrl}
            alt={accommodation.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        </div>
      )}
      {hasImage && imageFailed && (
        <div className={styles.imagePlaceholder} role="img" aria-label="">
          Imagen no disponible
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.topRow}>
          <PlaceStatusBadge status={accommodation.contentStatus} />
          <AccommodationActionsMenu
            accommodation={accommodation}
            disabled={disabled}
            onEdit={onEdit}
            onChangeStatus={onChangeStatus}
            onDelete={onDelete}
          />
        </div>

        <div className={styles.heading}>
          <h3>{accommodation.name}</h3>
          {accommodation.type && (
            <p>{accommodationTypeLabels[accommodation.type]}</p>
          )}
        </div>

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

        {featureFacts.length > 0 && (
          <ul className={styles.features} aria-label="Servicios incluidos">
            {featureFacts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        )}

        {accommodation.notes && (
          <div className={styles.notes}>
            <h4>Notas</h4>
            <p>{accommodation.notes}</p>
          </div>
        )}

        {(accommodation.mapsUrl || accommodation.websiteUrl) && (
          <div className={styles.links}>
            {accommodation.mapsUrl && (
              <a
                href={accommodation.mapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir en Maps
              </a>
            )}
            {accommodation.websiteUrl && (
              <a
                href={accommodation.websiteUrl}
                target="_blank"
                rel="noreferrer"
              >
                Página web
              </a>
            )}
          </div>
        )}

        {!isCompleted && (
          <button
            className={styles.continueButton}
            type="button"
            onClick={() => onEdit(accommodation)}
          >
            {accommodation.contentStatus === 'draft'
              ? 'Completar'
              : 'Continuar'}
          </button>
        )}
      </div>
    </article>
  )
}
