import { useMemo, useState } from 'react'

import { PlaceStatusBadge } from '../../places/components/PlaceStatusBadge'
import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import {
  mealTypeLabels,
  reservationStatusLabels,
  restaurantStatusLabels,
  venueTypeLabels,
  type Restaurant,
} from '../model/restaurant'
import { formatRestaurantDate } from '../utils/restaurant-presentation'
import { isValidHttpUrl } from '../utils/restaurant-validation'
import { RestaurantActionsMenu } from './RestaurantActionsMenu'
import styles from './RestaurantCard.module.css'

type RestaurantCardProps = {
  restaurant: Restaurant
  disabled?: boolean
  onEdit: (restaurant: Restaurant) => void
  onChangeStatus: (
    restaurant: Restaurant,
    status: TripContentStatus,
  ) => void
  onDelete: (restaurant: Restaurant) => void
}

function boolLabel(value: boolean | null, yes: string, no: string) {
  if (value === true) return yes
  if (value === false) return no
  return ''
}

function ratingLabel(label: string, value: string) {
  return value ? `${label}: ${value}/5` : ''
}

function LinkButton({
  href,
  children,
}: {
  href: string
  children: string
}) {
  if (!href || !isValidHttpUrl(href)) return null

  return (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  )
}

export function RestaurantCard({
  restaurant,
  disabled = false,
  onEdit,
  onChangeStatus,
  onDelete,
}: RestaurantCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(restaurant.imageUrl) && !imageFailed
  const isCompleted = restaurant.contentStatus === 'completed'
  const title = restaurant.name || 'Restaurante'
  const mealLabels = restaurant.mealTypes.map(
    (mealType) => mealTypeLabels[mealType],
  )
  const planningFacts = useMemo(
    () =>
      [
        restaurant.tripDay && {
          label: 'Día',
          value: `Día ${restaurant.tripDay}`,
        },
        restaurant.plannedDate && {
          label: 'Fecha',
          value: formatRestaurantDate(restaurant.plannedDate),
        },
        restaurant.plannedTime && {
          label: 'Hora',
          value: restaurant.plannedTime,
        },
        restaurant.peopleCount && {
          label: 'Personas',
          value: restaurant.peopleCount,
        },
      ].filter((fact): fact is { label: string; value: string } =>
        Boolean(fact),
      ),
    [restaurant],
  )
  const locationFacts = [
    restaurant.locality && { label: 'Localidad', value: restaurant.locality },
    restaurant.area && { label: 'Zona', value: restaurant.area },
    restaurant.address && { label: 'Dirección', value: restaurant.address },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact))
  const reservationFacts =
    restaurant.requiresReservation === true
      ? [
          restaurant.reservationStatus && {
            label: 'Estado',
            value: reservationStatusLabels[restaurant.reservationStatus],
          },
          restaurant.reservationDate && {
            label: 'Fecha',
            value: formatRestaurantDate(restaurant.reservationDate),
          },
          restaurant.reservationTime && {
            label: 'Hora',
            value: restaurant.reservationTime,
          },
          restaurant.reservationPeople && {
            label: 'Personas',
            value: restaurant.reservationPeople,
          },
          restaurant.reservationName && {
            label: 'A nombre de',
            value: restaurant.reservationName,
          },
          restaurant.reservationPhone && {
            label: 'Teléfono reserva',
            value: restaurant.reservationPhone,
          },
          restaurant.reservationReference && {
            label: 'Referencia',
            value: restaurant.reservationReference,
          },
        ].filter((fact): fact is { label: string; value: string } =>
          Boolean(fact),
        )
      : []
  const priceFacts = [
    restaurant.priceLevel && {
      label: 'Nivel de precio',
      value: restaurant.priceLevel,
    },
    restaurant.estimatedPricePerPerson && {
      label: 'Precio/persona',
      value: `${restaurant.estimatedPricePerPerson} €`,
    },
    restaurant.estimatedTotalPrice && {
      label: 'Total estimado',
      value: `${restaurant.estimatedTotalPrice} €`,
    },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact))
  const practicalFacts = [
    restaurant.phone && { label: 'Teléfono', value: restaurant.phone },
    restaurant.openingHours && {
      label: 'Horario',
      value: restaurant.openingHours,
    },
    restaurant.closingDay && {
      label: 'Cierre',
      value: restaurant.closingDay,
    },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact))
  const practicalChips = [
    boolLabel(restaurant.hasTerrace, 'Terraza', 'Sin terraza'),
    boolLabel(
      restaurant.hasNearbyParking,
      'Parking cercano',
      'Sin parking cercano',
    ),
    boolLabel(restaurant.isAccessible, 'Accesible', 'No accesible'),
    boolLabel(restaurant.acceptsCard, 'Acepta tarjeta', 'Solo efectivo'),
  ].filter(Boolean)
  const visitFacts = [
    restaurant.visitedDate && {
      label: 'Visitado',
      value: formatRestaurantDate(restaurant.visitedDate),
    },
    ratingLabel('Fati', restaurant.fatyRating) && {
      label: 'Nota Fati',
      value: ratingLabel('Fati', restaurant.fatyRating),
    },
    ratingLabel('Roberto', restaurant.robertoRating) && {
      label: 'Nota Roberto',
      value: ratingLabel('Roberto', restaurant.robertoRating),
    },
    ratingLabel('Conjunta', restaurant.jointRating) && {
      label: 'Nota conjunta',
      value: ratingLabel('Conjunta', restaurant.jointRating),
    },
    restaurant.wouldReturn !== null && {
      label: 'Volveríamos',
      value: restaurant.wouldReturn ? 'Sí' : 'No',
    },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact))
  const hasVisitBlock =
    restaurant.visited ||
    visitFacts.length > 0 ||
    restaurant.orderedItems.length > 0 ||
    restaurant.visitComments

  return (
    <article
      className={`${styles.card} ${
        isCompleted ? styles.completed : styles.pending
      }`}
    >
      {showImage && (
        <img
          className={styles.image}
          src={restaurant.imageUrl}
          alt={`Imagen de ${title}`}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      )}

      <div className={styles.body}>
        <div className={styles.topRow}>
          <div className={styles.badges}>
            <PlaceStatusBadge status={restaurant.contentStatus} />
            <span className={styles.statusBadge}>
              {restaurantStatusLabels[restaurant.restaurantStatus]}
            </span>
          </div>
          <RestaurantActionsMenu
            restaurant={restaurant}
            disabled={disabled}
            onEdit={onEdit}
            onChangeStatus={onChangeStatus}
            onDelete={onDelete}
          />
        </div>

        <div className={styles.heading}>
          <h3>{title}</h3>
          {(restaurant.venueType || restaurant.locality) && (
            <p>
              {[restaurant.venueType && venueTypeLabels[restaurant.venueType], restaurant.locality]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>

        {(mealLabels.length > 0 || restaurant.cuisineTypes.length > 0) && (
          <ul className={styles.tags} aria-label="Tipo de comida">
            {[...mealLabels, ...restaurant.cuisineTypes].map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}

        {[planningFacts, locationFacts, priceFacts, practicalFacts].map(
          (facts, index) =>
            facts.length > 0 && (
              <dl className={styles.facts} key={index}>
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            ),
        )}

        {restaurant.requiresReservation === true &&
          (reservationFacts.length > 0 ||
            restaurant.reservationNotes ||
            restaurant.reservationConfirmationUrl) && (
            <section className={styles.block}>
              <h4>Reserva</h4>
              {reservationFacts.length > 0 && (
                <dl className={styles.facts}>
                  {reservationFacts.map((fact) => (
                    <div key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {restaurant.reservationNotes && <p>{restaurant.reservationNotes}</p>}
            </section>
          )}

        {practicalChips.length > 0 && (
          <ul className={styles.tags} aria-label="Datos prácticos">
            {practicalChips.map((chip) => (
              <li key={chip}>{chip}</li>
            ))}
          </ul>
        )}

        {restaurant.recommendedDishes.length > 0 && (
          <section className={styles.block}>
            <h4>Platos recomendados</h4>
            <ol className={styles.list}>
              {restaurant.recommendedDishes.map((dish) => (
                <li key={dish.id}>
                  <span>{dish.name}</span>
                  {dish.notes && <small>{dish.notes}</small>}
                </li>
              ))}
            </ol>
          </section>
        )}

        {restaurant.notes && (
          <section className={styles.block}>
            <h4>Notas</h4>
            <p>{restaurant.notes}</p>
          </section>
        )}

        {hasVisitBlock && (
          <section className={styles.block}>
            <h4>Después de la visita</h4>
            {visitFacts.length > 0 && (
              <dl className={styles.facts}>
                {visitFacts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {restaurant.orderedItems.length > 0 && (
              <ol className={styles.list}>
                {restaurant.orderedItems.map((item) => (
                  <li key={item.id}>
                    <span>{item.name}</span>
                    {item.notes && <small>{item.notes}</small>}
                  </li>
                ))}
              </ol>
            )}
            {restaurant.visitComments && <p>{restaurant.visitComments}</p>}
          </section>
        )}

        {(restaurant.mapsUrl ||
          restaurant.websiteUrl ||
          restaurant.menuUrl ||
          restaurant.reservationConfirmationUrl ||
          restaurant.phone) && (
          <div className={styles.links}>
            <LinkButton href={restaurant.mapsUrl}>Abrir en Maps</LinkButton>
            <LinkButton href={restaurant.websiteUrl}>Página web</LinkButton>
            <LinkButton href={restaurant.menuUrl}>Carta o menú</LinkButton>
            <LinkButton href={restaurant.reservationConfirmationUrl}>
              Confirmación
            </LinkButton>
            {restaurant.phone && <a href={`tel:${restaurant.phone}`}>Llamar</a>}
          </div>
        )}

        {!isCompleted && (
          <button
            className={styles.continueButton}
            type="button"
            onClick={() => onEdit(restaurant)}
          >
            {restaurant.contentStatus === 'draft' ? 'Completar' : 'Continuar'}
          </button>
        )}
      </div>
    </article>
  )
}
