import { useState } from 'react'

import headerImage from '../../../assets/images/header-fati-rober.webp'
import { useAccommodations } from '../../accommodations/hooks/useAccommodations'
import { accommodationTypeLabels } from '../../accommodations/model/accommodation'
import { useBudget } from '../../budget/hooks/useBudget'
import {
  calculateBudget,
  calculateBudgetAutomaticCosts,
  formatBudgetAmount,
} from '../../budget/utils/budget-calculations'
import { usePlaces } from '../../places/hooks/usePlaces'
import {
  placeCategoryLabels,
  placePriorityLabels,
} from '../../places/model/place'
import { usePhotos } from '../../photos/hooks/usePhotos'
import { usePlanningDays } from '../../planning/hooks/usePlanningDays'
import { useRestaurants } from '../../restaurants/hooks/useRestaurants'
import { mealTypeLabels, venueTypeLabels } from '../../restaurants/model/restaurant'
import { useTransfers } from '../../transfers/hooks/useTransfers'
import {
  transferDirections,
  transferDirectionLabels,
} from '../../transfers/model/transfer'
import type { BaseTrip, TripTransport } from '../../trips/model/trip'
import { budgetToFormData } from '../../budget/model/budget'
import styles from './TripPrintDialog.module.css'

const printSections = [
  ['general', 'Información general'],
  ['dates', 'Fechas'],
  ['participants', 'Participantes'],
  ['transport', 'Transporte'],
  ['places', 'Lugares y visitas'],
  ['planning', 'Planning diario'],
  ['accommodations', 'Alojamiento'],
  ['transfers', 'Trayectos'],
  ['restaurants', 'Restaurantes'],
  ['budget', 'Presupuesto'],
  ['photos', 'Fotos'],
] as const

type PrintSectionId = (typeof printSections)[number][0]

const transportLabels: Record<TripTransport, string> = {
  car: 'Coche',
  plane: 'Avión',
  train: 'Tren',
  bus: 'Autobús',
  boat: 'Barco',
  other: 'Otro',
}

function formatDate(date: string) {
  if (!date) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

function DetailList({ items }: { items: Array<[string, string]> }) {
  const visibleItems = items.filter(([, value]) => value)

  if (visibleItems.length === 0) return null

  return (
    <dl className={styles.details}>
      {visibleItems.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function TripPrintDialog({
  trip,
  onClose,
}: {
  trip: BaseTrip
  onClose: () => void
}) {
  const [selectedSections, setSelectedSections] = useState<PrintSectionId[]>(
    () => printSections.map(([id]) => id),
  )
  const { places, status: placesStatus } = usePlaces(trip.id)
  const { days, status: planningStatus } = usePlanningDays(trip.id)
  const { accommodations, status: accommodationsStatus } = useAccommodations(trip.id)
  const { restaurants, status: restaurantsStatus } = useRestaurants(trip.id)
  const { transfers, status: transfersStatus } = useTransfers(trip.id)
  const { budget, status: budgetStatus } = useBudget(trip.id)
  const { photos, isLoading: photosLoading } = usePhotos(trip.id)

  const isLoading =
    placesStatus === 'loading' ||
    planningStatus === 'loading' ||
    accommodationsStatus === 'loading' ||
    restaurantsStatus === 'loading' ||
    transfersStatus === 'loading' ||
    budgetStatus === 'loading' ||
    photosLoading
  const automaticCosts = calculateBudgetAutomaticCosts(
    accommodations,
    places,
    trip.participants.length,
  )
  const budgetCalculations = budget
    ? calculateBudget(budgetToFormData(budget), automaticCosts)
    : null
  const includes = (section: PrintSectionId) =>
    selectedSections.includes(section)

  const toggleSection = (section: PrintSectionId) => {
    setSelectedSections((currentSections) =>
      currentSections.includes(section)
        ? currentSections.filter((currentSection) => currentSection !== section)
        : [...currentSections, section],
    )
  }

  const handlePrint = () => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.print())
    })
  }

  return (
    <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="trip-print-title">
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div className={styles.panel}>
        <header className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Documento del viaje</p>
            <h2 id="trip-print-title">Generar PDF</h2>
          </div>
          <button className={styles.closeButton} type="button" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>

        <p className={styles.description}>
          El encabezado y el título siempre se incluirán. Elige el resto de apartados que quieres imprimir.
        </p>
        <fieldset className={styles.options}>
          <legend>Secciones del documento</legend>
          {printSections.map(([id, label]) => (
            <label key={id} className={styles.option}>
              <input
                type="checkbox"
                checked={includes(id)}
                onChange={() => toggleSection(id)}
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>

        <footer className={styles.actions}>
          <button className={styles.secondaryButton} type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.primaryButton} type="button" onClick={handlePrint} disabled={isLoading}>
            {isLoading ? 'Cargando datos…' : 'Imprimir / Guardar PDF'}
          </button>
        </footer>
      </div>

      <article className={styles.printDocument}>
        <header className={styles.documentHeader}>
          <img src={headerImage} alt="Fati y Rober disfrutando de un viaje" />
          <div>
            <p>Nuestros viajes</p>
            <h1>{trip.name}</h1>
          </div>
        </header>

        {includes('general') && (
          <section className={styles.printSection}>
            <h2>Información general</h2>
            <DetailList items={[
              ['Destino', [trip.destination, trip.country].filter(Boolean).join(', ')],
              ['Estado', trip.status],
              ['Moneda', trip.currency],
            ]} />
            {trip.description && <p>{trip.description}</p>}
          </section>
        )}

        {includes('dates') && (
          <section className={styles.printSection}>
            <h2>Fechas</h2>
            <p>{formatDate(trip.startDate)} — {formatDate(trip.endDate)}</p>
          </section>
        )}

        {includes('participants') && (
          <section className={styles.printSection}>
            <h2>Participantes</h2>
            {trip.participants.length > 0 ? (
              <ul>{trip.participants.map((participant) => <li key={participant}>{participant}</li>)}</ul>
            ) : <p>Sin participantes.</p>}
          </section>
        )}

        {includes('transport') && (
          <section className={styles.printSection}>
            <h2>Transporte</h2>
            <p>{transportLabels[trip.transport]}</p>
          </section>
        )}

        {includes('places') && (
          <section className={styles.printSection}>
            <h2>Lugares y visitas</h2>
            {places.length > 0 ? places.map((place) => (
              <article className={styles.item} key={place.id}>
                <h3>{place.name || 'Lugar sin nombre'}</h3>
                <DetailList items={[
                  ['Tipo', place.category ? placeCategoryLabels[place.category] : ''],
                  ['Prioridad', place.priority ? placePriorityLabels[place.priority] : ''],
                  ['Dirección', place.address],
                  ['Horario', place.openingHours],
                  ['Precio', place.price],
                  ['Duración estimada', place.estimatedDuration],
                ]} />
                {place.description && <p>{place.description}</p>}
                {place.notes && <p><strong>Notas:</strong> {place.notes}</p>}
              </article>
            )) : <p>Sin lugares registrados.</p>}
          </section>
        )}

        {includes('planning') && (
          <section className={styles.printSection}>
            <h2>Planning diario</h2>
            {days.length > 0 ? [...days].sort((a, b) => a.date.localeCompare(b.date)).map((day) => (
              <article className={styles.item} key={day.id}>
                <h3>{formatDate(day.date)}{day.title ? ` · ${day.title}` : ''}</h3>
                {day.description && <p>{day.description}</p>}
                {day.activities.length > 0 && (
                  <ol className={styles.activityList}>
                    {[...day.activities].sort((a, b) => a.order - b.order).map((activity) => (
                      <li key={activity.id}>
                        <strong>{activity.title || activity.placeSnapshot?.name || 'Actividad'}</strong>
                        {(activity.startTime || activity.endTime) && <span> ({[activity.startTime, activity.endTime].filter(Boolean).join(' — ')})</span>}
                        {activity.description && <p>{activity.description}</p>}
                        {activity.notes && <p><strong>Notas:</strong> {activity.notes}</p>}
                      </li>
                    ))}
                  </ol>
                )}
                {day.notes && <p><strong>Notas:</strong> {day.notes}</p>}
              </article>
            )) : <p>Sin planning registrado.</p>}
          </section>
        )}

        {includes('accommodations') && (
          <section className={styles.printSection}>
            <h2>Alojamiento</h2>
            {accommodations.length > 0 ? accommodations.map((accommodation) => (
              <article className={styles.item} key={accommodation.id}>
                <h3>{accommodation.name || 'Alojamiento sin nombre'}</h3>
                <DetailList items={[
                  ['Tipo', accommodation.type ? accommodationTypeLabels[accommodation.type] : ''],
                  ['Dirección', accommodation.address],
                  ['Entrada', accommodation.checkInDate ? `${formatDate(accommodation.checkInDate)}${accommodation.checkInTime ? ` · ${accommodation.checkInTime}` : ''}` : ''],
                  ['Salida', accommodation.checkOutDate ? `${formatDate(accommodation.checkOutDate)}${accommodation.checkOutTime ? ` · ${accommodation.checkOutTime}` : ''}` : ''],
                  ['Reserva', accommodation.reservationCode],
                  ['Precio total', accommodation.totalPrice],
                ]} />
                {accommodation.notes && <p><strong>Notas:</strong> {accommodation.notes}</p>}
              </article>
            )) : <p>Sin alojamientos registrados.</p>}
          </section>
        )}

        {includes('transfers') && (
          <section className={styles.printSection}>
            <h2>Trayectos</h2>
            {transferDirections.some((direction) => transfers[direction]) ? transferDirections.map((direction) => {
              const transfer = transfers[direction]
              if (!transfer) return null
              return <article className={styles.item} key={direction}>
                <h3>{transferDirectionLabels[direction]}</h3>
                <DetailList items={[
                  ['Fecha', transfer.date ? formatDate(transfer.date) : ''],
                  ['Ruta', [transfer.origin, transfer.destination].filter(Boolean).join(' → ')],
                  ['Duración estimada', transfer.estimatedDuration],
                  ['Distancia', transfer.distanceKm],
                  ['Peajes estimados', transfer.estimatedTollCost],
                ]} />
                {transfer.plannedStops.length > 0 && <p><strong>Paradas:</strong> {transfer.plannedStops.map((stop) => stop.description || stop.location).filter(Boolean).join(' · ')}</p>}
                {transfer.notes && <p><strong>Notas:</strong> {transfer.notes}</p>}
              </article>
            }) : <p>Sin trayectos registrados.</p>}
          </section>
        )}

        {includes('restaurants') && (
          <section className={styles.printSection}>
            <h2>Restaurantes</h2>
            {restaurants.length > 0 ? restaurants.map((restaurant) => (
              <article className={styles.item} key={restaurant.id}>
                <h3>{restaurant.name || 'Restaurante sin nombre'}</h3>
                <DetailList items={[
                  ['Tipo', restaurant.venueType ? venueTypeLabels[restaurant.venueType] : ''],
                  ['Comida', restaurant.mealTypes.map((meal) => mealTypeLabels[meal]).join(', ')],
                  ['Fecha', restaurant.plannedDate ? formatDate(restaurant.plannedDate) : ''],
                  ['Hora', restaurant.plannedTime],
                  ['Dirección', restaurant.address],
                  ['Reserva', restaurant.reservationReference],
                ]} />
                {restaurant.notes && <p><strong>Notas:</strong> {restaurant.notes}</p>}
              </article>
            )) : <p>Sin restaurantes registrados.</p>}
          </section>
        )}

        {includes('budget') && (
          <section className={styles.printSection}>
            <h2>Presupuesto</h2>
            {budget && budgetCalculations ? <DetailList items={[
              ['Alojamiento', formatBudgetAmount(budgetCalculations.automaticCosts.accommodationTotal)],
              ['Entradas', formatBudgetAmount(budgetCalculations.automaticCosts.ticketsTotal)],
              ['Gasolina', formatBudgetAmount(budgetCalculations.gasoline)],
              ['Comidas', formatBudgetAmount(budgetCalculations.meals)],
              ['Otros', formatBudgetAmount(budgetCalculations.miscellaneous)],
              ['Total previsto', formatBudgetAmount(budgetCalculations.total)],
              ['Presupuesto máximo', budgetCalculations.maximumBudget ? formatBudgetAmount(budgetCalculations.maximumBudget) : ''],
            ]} /> : <p>Sin presupuesto registrado.</p>}
          </section>
        )}

        {includes('photos') && (
          <section className={styles.printSection}>
            <h2>Fotos</h2>
            {photos.length > 0 ? <div className={styles.photoGrid}>
              {photos.map((photo) => {
                const source = photo.imageKitAsset?.thumbnailUrl ?? photo.imageKitAsset?.url
                if (!source) return null
                return <figure key={photo.id}>
                  <img src={source} alt={photo.editableMetadata?.altText ?? photo.editableMetadata?.title ?? 'Foto del viaje'} />
                  {photo.editableMetadata?.caption && <figcaption>{photo.editableMetadata.caption}</figcaption>}
                </figure>
              })}
            </div> : <p>Sin fotos registradas.</p>}
          </section>
        )}
      </article>
    </div>
  )
}
