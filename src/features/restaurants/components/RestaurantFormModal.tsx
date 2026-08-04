import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'

import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import type { BaseTrip } from '../../trips/model/trip'
import { getTripDates } from '../../planning/utils/planning-dates'
import {
  emptyRestaurantFormData,
  mealTypeLabels,
  mealTypes,
  priceLevels,
  reservationStatusLabels,
  reservationStatuses,
  restaurantStatusLabels,
  restaurantStatuses,
  restaurantToFormData,
  venueTypeLabels,
  venueTypes,
  type NullableBoolean,
  type Restaurant,
  type RestaurantFormData,
  type RestaurantListItem,
  type SaveRestaurantData,
} from '../model/restaurant'
import { formatRestaurantDate } from '../utils/restaurant-presentation'
import {
  hasReservationData,
  normalizeRestaurantFormData,
  validateRestaurant,
  type RestaurantFormErrors,
} from '../utils/restaurant-validation'
import styles from './RestaurantFormModal.module.css'

type RestaurantFormModalProps = {
  restaurant?: Restaurant
  trip: BaseTrip
  onCancel: () => void
  onSave: (data: SaveRestaurantData) => Promise<void>
}

type ListField = 'recommendedDishes' | 'orderedItems'

const cuisineSuggestions = [
  'Portuguesa',
  'Tradicional',
  'Marisco',
  'Carne',
  'Tapas',
  'Dulces',
  'Internacional',
]

function createListItem(): RestaurantListItem {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return { id, name: '', notes: '', order: 0 }
}

function BooleanSelect({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  id: string
  label: string
  value: NullableBoolean
  disabled: boolean
  onChange: (value: NullableBoolean) => void
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select
        id={id}
        value={value === null ? '' : value ? 'yes' : 'no'}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value === ''
              ? null
              : event.target.value === 'yes',
          )
        }
      >
        <option value="">Seleccionar…</option>
        <option value="yes">Sí</option>
        <option value="no">No</option>
      </select>
    </label>
  )
}

export function RestaurantFormModal({
  restaurant,
  trip,
  onCancel,
  onSave,
}: RestaurantFormModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const [values, setValues] = useState<RestaurantFormData>(() =>
    restaurant ? restaurantToFormData(restaurant) : emptyRestaurantFormData,
  )
  const [errors, setErrors] = useState<RestaurantFormErrors>({})
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [savingStatus, setSavingStatus] = useState<TripContentStatus | null>(
    null,
  )
  const [customCuisine, setCustomCuisine] = useState('')
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const isSavingRef = useRef(false)
  const isEditMode = Boolean(restaurant)
  const isSaving = savingStatus !== null
  const tripDates = getTripDates(trip.startDate, trip.endDate)
  const previewUrl = values.imageUrl.trim()
  const showImagePreview =
    Boolean(previewUrl) && failedImageUrl !== previewUrl
  const showAfterVisit =
    values.restaurantStatus === 'visited' || values.visited

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement as HTMLElement | null
    const previousBodyOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    nameInputRef.current?.focus()

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !isSavingRef.current) {
        event.preventDefault()
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
      previouslyFocusedElement?.focus()
    }
  }, [onCancel])

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) return

    const focusableElements = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
      ),
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements.at(-1)

    if (!firstElement || !lastElement) return

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isSavingRef.current) {
      onCancel()
    }
  }

  const updateField = <Field extends keyof RestaurantFormData>(
    field: Field,
    value: RestaurantFormData[Field],
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
      form: undefined,
    }))
    setSubmissionError(null)
  }

  const updateRequiresReservation = (nextValue: NullableBoolean) => {
    if (
      values.requiresReservation === true &&
      nextValue !== true &&
      hasReservationData(values) &&
      !window.confirm(
        'Al marcar que no requiere reserva se eliminarán los datos de reserva de este restaurante. ¿Continuamos?',
      )
    ) {
      return
    }

    setValues((currentValues) => ({
      ...currentValues,
      requiresReservation: nextValue,
      ...(nextValue !== true && {
        reservationStatus: '',
        reservationDate: '',
        reservationTime: '',
        reservationPeople: '',
        reservationName: '',
        reservationPhone: '',
        reservationReference: '',
        reservationConfirmationUrl: '',
        reservationNotes: '',
      }),
    }))
    setErrors((currentErrors) => ({ ...currentErrors, form: undefined }))
    setSubmissionError(null)
  }

  const toggleMealType = (mealType: RestaurantFormData['mealTypes'][number]) => {
    updateField(
      'mealTypes',
      values.mealTypes.includes(mealType)
        ? values.mealTypes.filter((currentMealType) => currentMealType !== mealType)
        : [...values.mealTypes, mealType],
    )
  }

  const toggleCuisine = (cuisine: string) => {
    updateField(
      'cuisineTypes',
      values.cuisineTypes.includes(cuisine)
        ? values.cuisineTypes.filter((currentCuisine) => currentCuisine !== cuisine)
        : [...values.cuisineTypes, cuisine],
    )
  }

  const addCustomCuisine = () => {
    const cuisine = customCuisine.trim()
    if (!cuisine || values.cuisineTypes.includes(cuisine)) return

    updateField('cuisineTypes', [...values.cuisineTypes, cuisine])
    setCustomCuisine('')
  }

  const updateList = (
    field: ListField,
    updater: (items: RestaurantListItem[]) => RestaurantListItem[],
  ) => {
    updateField(
      field,
      updater(values[field]).map((item, index) => ({ ...item, order: index })),
    )
  }

  const calculateTotal = () => {
    const price = Number(values.estimatedPricePerPerson.replace(',', '.'))
    const people = Number(values.peopleCount || values.reservationPeople)

    if (Number.isFinite(price) && price > 0 && Number.isFinite(people) && people > 0) {
      updateField('estimatedTotalPrice', String(Math.round(price * people * 100) / 100))
    }
  }

  const save = async (contentStatus: TripContentStatus) => {
    if (isSavingRef.current) return

    const normalizedValues = normalizeRestaurantFormData(values)
    const nextErrors = validateRestaurant(normalizedValues, contentStatus)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    isSavingRef.current = true
    setSavingStatus(contentStatus)
    setSubmissionError(null)

    try {
      await onSave({ ...normalizedValues, contentStatus })
      onCancel()
    } catch (error) {
      isSavingRef.current = false
      setSavingStatus(null)
      setSubmissionError(
        error instanceof Error
          ? error.message
          : 'No se ha podido guardar el restaurante. Inténtalo de nuevo.',
      )
    }
  }

  const fieldError = (field: keyof RestaurantFormData) => errors[field]

  const renderListEditor = (field: ListField, title: string) => (
    <div className={styles.listEditor}>
      <div className={styles.listHeader}>
        <h4>{title}</h4>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => updateList(field, (items) => [...items, createListItem()])}
        >
          Añadir
        </button>
      </div>
      {values[field].length > 0 && (
        <ol className={styles.listItems}>
          {values[field].map((item, index) => (
            <li key={item.id}>
              <label className={styles.field}>
                <span>Nombre</span>
                <input
                  value={item.name}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateList(field, (items) =>
                      items.map((currentItem) =>
                        currentItem.id === item.id
                          ? { ...currentItem, name: event.target.value }
                          : currentItem,
                      ),
                    )
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Notas</span>
                <input
                  value={item.notes}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateList(field, (items) =>
                      items.map((currentItem) =>
                        currentItem.id === item.id
                          ? { ...currentItem, notes: event.target.value }
                          : currentItem,
                      ),
                    )
                  }
                />
              </label>
              <div className={styles.itemActions}>
                <button
                  type="button"
                  disabled={isSaving || index === 0}
                  onClick={() =>
                    updateList(field, (items) => {
                      const nextItems = [...items]
                      ;[nextItems[index - 1], nextItems[index]] = [
                        nextItems[index],
                        nextItems[index - 1],
                      ]
                      return nextItems
                    })
                  }
                >
                  Subir
                </button>
                <button
                  type="button"
                  disabled={isSaving || index === values[field].length - 1}
                  onClick={() =>
                    updateList(field, (items) => {
                      const nextItems = [...items]
                      ;[nextItems[index], nextItems[index + 1]] = [
                        nextItems[index + 1],
                        nextItems[index],
                      ]
                      return nextItems
                    })
                  }
                >
                  Bajar
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    updateList(field, (items) =>
                      items.filter((currentItem) => currentItem.id !== item.id),
                    )
                  }
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )

  return (
    <div className={styles.backdrop} onMouseDown={handleBackdropMouseDown}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={trapFocus}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Restaurantes</p>
            <h2 id={titleId}>
              {isEditMode ? 'Editar restaurante' : 'Añadir restaurante'}
            </h2>
            <p id={descriptionId}>
              Guarda opciones, reservas, precios y notas de la visita.
            </p>
          </div>
          <button
            className={styles.closeButton}
            type="button"
            aria-label="Cerrar formulario"
            disabled={isSaving}
            onClick={onCancel}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <form
          className={styles.form}
          noValidate
          onSubmit={(event) => event.preventDefault()}
        >
          {(errors.form || submissionError) && (
            <div className={styles.formError} role="alert">
              {errors.form ?? submissionError}
            </div>
          )}

          <div className={styles.content}>
            <details className={styles.section} open>
              <summary>Datos principales</summary>
              <div className={styles.grid}>
                <label className={`${styles.field} ${styles.fullWidth}`}>
                  <span>Nombre</span>
                  <input
                    ref={nameInputRef}
                    value={values.name}
                    aria-invalid={Boolean(fieldError('name'))}
                    disabled={isSaving}
                    onChange={(event) => updateField('name', event.target.value)}
                  />
                  {fieldError('name') && (
                    <small className={styles.error}>{fieldError('name')}</small>
                  )}
                </label>
                <label className={styles.field}>
                  <span>Tipo de local</span>
                  <select
                    value={values.venueType}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField(
                        'venueType',
                        event.target.value as RestaurantFormData['venueType'],
                      )
                    }
                  >
                    <option value="">Seleccionar…</option>
                    {venueTypes.map((venueType) => (
                      <option key={venueType} value={venueType}>
                        {venueTypeLabels[venueType]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Estado gastronómico</span>
                  <select
                    value={values.restaurantStatus}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField(
                        'restaurantStatus',
                        event.target
                          .value as RestaurantFormData['restaurantStatus'],
                      )
                    }
                  >
                    {restaurantStatuses.map((status) => (
                      <option key={status} value={status}>
                        {restaurantStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Localidad</span>
                  <input
                    value={values.locality}
                    disabled={isSaving}
                    onChange={(event) => updateField('locality', event.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>Zona</span>
                  <input
                    value={values.area}
                    disabled={isSaving}
                    onChange={(event) => updateField('area', event.target.value)}
                  />
                </label>
                <label className={`${styles.field} ${styles.fullWidth}`}>
                  <span>Dirección</span>
                  <input
                    value={values.address}
                    disabled={isSaving}
                    onChange={(event) => updateField('address', event.target.value)}
                  />
                </label>
                <label className={`${styles.field} ${styles.fullWidth}`}>
                  <span>Página web</span>
                  <input
                    type="url"
                    inputMode="url"
                    value={values.websiteUrl}
                    aria-invalid={Boolean(fieldError('websiteUrl'))}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField('websiteUrl', event.target.value)
                    }
                  />
                  {fieldError('websiteUrl') && (
                    <small className={styles.error}>
                      {fieldError('websiteUrl')}
                    </small>
                  )}
                </label>
                <label className={styles.field}>
                  <span>Google Maps</span>
                  <input
                    type="url"
                    inputMode="url"
                    value={values.mapsUrl}
                    aria-invalid={Boolean(fieldError('mapsUrl'))}
                    disabled={isSaving}
                    onChange={(event) => updateField('mapsUrl', event.target.value)}
                  />
                  {fieldError('mapsUrl') && (
                    <small className={styles.error}>{fieldError('mapsUrl')}</small>
                  )}
                </label>
                <label className={styles.field}>
                  <span>URL de imagen</span>
                  <input
                    type="url"
                    inputMode="url"
                    value={values.imageUrl}
                    aria-invalid={Boolean(fieldError('imageUrl'))}
                    disabled={isSaving}
                    onChange={(event) => updateField('imageUrl', event.target.value)}
                  />
                  {fieldError('imageUrl') && (
                    <small className={styles.error}>{fieldError('imageUrl')}</small>
                  )}
                </label>
                {previewUrl && (
                  <div className={`${styles.preview} ${styles.fullWidth}`} aria-live="polite">
                    {showImagePreview ? (
                      <img
                        src={previewUrl}
                        alt={`Vista previa de ${values.name || 'la imagen del restaurante'}`}
                        onError={() => setFailedImageUrl(previewUrl)}
                      />
                    ) : (
                      <p>No se ha podido mostrar la vista previa.</p>
                    )}
                  </div>
                )}
              </div>
              <div className={styles.checkGroup}>
                <span>Comidas</span>
                {mealTypes.map((mealType) => (
                  <label key={mealType}>
                    <input
                      type="checkbox"
                      checked={values.mealTypes.includes(mealType)}
                      disabled={isSaving}
                      onChange={() => toggleMealType(mealType)}
                    />
                    {mealTypeLabels[mealType]}
                  </label>
                ))}
              </div>
              <div className={styles.checkGroup}>
                <span>Tipo de cocina</span>
                {cuisineSuggestions.map((cuisine) => (
                  <label key={cuisine}>
                    <input
                      type="checkbox"
                      checked={values.cuisineTypes.includes(cuisine)}
                      disabled={isSaving}
                      onChange={() => toggleCuisine(cuisine)}
                    />
                    {cuisine}
                  </label>
                ))}
                <div className={styles.inlineAdd}>
                  <input
                    value={customCuisine}
                    placeholder="Añadir cocina"
                    disabled={isSaving}
                    onChange={(event) => setCustomCuisine(event.target.value)}
                  />
                  <button type="button" disabled={isSaving} onClick={addCustomCuisine}>
                    Añadir
                  </button>
                </div>
              </div>
            </details>

            <details className={styles.section} open>
              <summary>Planificación</summary>
              <div className={styles.grid}>
                <label className={styles.field}>
                  <span>Día del viaje</span>
                  <select
                    value={values.tripDay}
                    disabled={isSaving}
                    onChange={(event) => {
                      const tripDay = event.target.value
                      const date = tripDay ? tripDates[Number(tripDay) - 1] : ''
                      setValues((currentValues) => ({
                        ...currentValues,
                        tripDay,
                        plannedDate: date ?? '',
                      }))
                    }}
                  >
                    <option value="">Seleccionar…</option>
                    {tripDates.map((date, index) => (
                      <option key={date} value={String(index + 1)}>
                        Día {index + 1} · {formatRestaurantDate(date)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Fecha prevista</span>
                  <input
                    type="date"
                    value={values.plannedDate}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField('plannedDate', event.target.value)
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>Hora prevista</span>
                  <input
                    type="time"
                    value={values.plannedTime}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField('plannedTime', event.target.value)
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>Personas</span>
                  <input
                    inputMode="numeric"
                    value={values.peopleCount}
                    aria-invalid={Boolean(fieldError('peopleCount'))}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField('peopleCount', event.target.value)
                    }
                  />
                  {fieldError('peopleCount') && (
                    <small className={styles.error}>
                      {fieldError('peopleCount')}
                    </small>
                  )}
                </label>
              </div>
            </details>

            <details className={styles.section} open>
              <summary>Reserva</summary>
              <div className={styles.grid}>
                <BooleanSelect
                  id="restaurant-requires-reservation"
                  label="¿Requiere reserva?"
                  value={values.requiresReservation}
                  disabled={isSaving}
                  onChange={updateRequiresReservation}
                />
                {values.requiresReservation === true && (
                  <>
                    <label className={styles.field}>
                      <span>Estado de la reserva</span>
                      <select
                        value={values.reservationStatus}
                        disabled={isSaving}
                        onChange={(event) =>
                          updateField(
                            'reservationStatus',
                            event.target
                              .value as RestaurantFormData['reservationStatus'],
                          )
                        }
                      >
                        <option value="">Seleccionar…</option>
                        {reservationStatuses.map((status) => (
                          <option key={status} value={status}>
                            {reservationStatusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </label>
                    {(
                      [
                        ['reservationDate', 'Fecha', 'date'],
                        ['reservationTime', 'Hora', 'time'],
                        ['reservationPeople', 'Personas', 'text'],
                        ['reservationName', 'Nombre', 'text'],
                        ['reservationPhone', 'Teléfono', 'tel'],
                        ['reservationReference', 'Referencia', 'text'],
                        ['reservationConfirmationUrl', 'Confirmación URL', 'url'],
                      ] as const
                    ).map(([field, label, type]) => (
                      <label className={styles.field} key={field}>
                        <span>{label}</span>
                        <input
                          type={type}
                          inputMode={type === 'url' ? 'url' : undefined}
                          value={values[field]}
                          aria-invalid={Boolean(fieldError(field))}
                          disabled={isSaving}
                          onChange={(event) =>
                            updateField(field, event.target.value)
                          }
                        />
                        {fieldError(field) && (
                          <small className={styles.error}>{fieldError(field)}</small>
                        )}
                      </label>
                    ))}
                    <label className={`${styles.field} ${styles.fullWidth}`}>
                      <span>Notas de reserva</span>
                      <textarea
                        rows={3}
                        value={values.reservationNotes}
                        disabled={isSaving}
                        onChange={(event) =>
                          updateField('reservationNotes', event.target.value)
                        }
                      />
                    </label>
                  </>
                )}
              </div>
            </details>

            <details className={styles.section}>
              <summary>Precio</summary>
              <div className={styles.grid}>
                <label className={styles.field}>
                  <span>Nivel de precio</span>
                  <select
                    value={values.priceLevel}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField(
                        'priceLevel',
                        event.target.value as RestaurantFormData['priceLevel'],
                      )
                    }
                  >
                    <option value="">Seleccionar…</option>
                    {priceLevels.map((priceLevel) => (
                      <option key={priceLevel} value={priceLevel}>
                        {priceLevel}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Precio estimado/persona</span>
                  <input
                    inputMode="decimal"
                    value={values.estimatedPricePerPerson}
                    aria-invalid={Boolean(fieldError('estimatedPricePerPerson'))}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField('estimatedPricePerPerson', event.target.value)
                    }
                  />
                  {fieldError('estimatedPricePerPerson') && (
                    <small className={styles.error}>
                      {fieldError('estimatedPricePerPerson')}
                    </small>
                  )}
                </label>
                <label className={styles.field}>
                  <span>Total estimado</span>
                  <input
                    inputMode="decimal"
                    value={values.estimatedTotalPrice}
                    aria-invalid={Boolean(fieldError('estimatedTotalPrice'))}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField('estimatedTotalPrice', event.target.value)
                    }
                  />
                  {fieldError('estimatedTotalPrice') && (
                    <small className={styles.error}>
                      {fieldError('estimatedTotalPrice')}
                    </small>
                  )}
                </label>
                <button
                  className={styles.inlineButton}
                  type="button"
                  disabled={isSaving}
                  onClick={calculateTotal}
                >
                  Calcular total
                </button>
              </div>
            </details>

            <details className={styles.section}>
              <summary>Información práctica</summary>
              <div className={styles.grid}>
                {(
                  [
                    ['phone', 'Teléfono', 'tel'],
                    ['menuUrl', 'Carta o menú', 'url'],
                    ['openingHours', 'Horario', 'text'],
                    ['closingDay', 'Día de cierre', 'text'],
                  ] as const
                ).map(([field, label, type]) => (
                  <label className={styles.field} key={field}>
                    <span>{label}</span>
                    <input
                      type={type}
                      inputMode={type === 'url' ? 'url' : undefined}
                      value={values[field]}
                      aria-invalid={Boolean(fieldError(field))}
                      disabled={isSaving}
                      onChange={(event) => updateField(field, event.target.value)}
                    />
                    {fieldError(field) && (
                      <small className={styles.error}>{fieldError(field)}</small>
                    )}
                  </label>
                ))}
                <BooleanSelect
                  id="restaurant-terrace"
                  label="Terraza"
                  value={values.hasTerrace}
                  disabled={isSaving}
                  onChange={(value) => updateField('hasTerrace', value)}
                />
                <BooleanSelect
                  id="restaurant-parking"
                  label="Parking cercano"
                  value={values.hasNearbyParking}
                  disabled={isSaving}
                  onChange={(value) => updateField('hasNearbyParking', value)}
                />
                <BooleanSelect
                  id="restaurant-accessible"
                  label="Accesible"
                  value={values.isAccessible}
                  disabled={isSaving}
                  onChange={(value) => updateField('isAccessible', value)}
                />
                <BooleanSelect
                  id="restaurant-card"
                  label="Acepta tarjeta"
                  value={values.acceptsCard}
                  disabled={isSaving}
                  onChange={(value) => updateField('acceptsCard', value)}
                />
              </div>
            </details>

            <details className={styles.section}>
              <summary>Platos recomendados</summary>
              {renderListEditor('recommendedDishes', 'Platos')}
            </details>

            <details className={styles.section}>
              <summary>Notas</summary>
              <label className={styles.field}>
                <span>Notas generales</span>
                <textarea
                  rows={4}
                  value={values.notes}
                  disabled={isSaving}
                  onChange={(event) => updateField('notes', event.target.value)}
                />
              </label>
            </details>

            <details className={styles.section} open={showAfterVisit}>
              <summary>Después de la visita</summary>
              <div className={styles.grid}>
                <label className={styles.switchField}>
                  <span>Ya lo hemos visitado</span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={values.visited}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField('visited', event.target.checked)
                    }
                  />
                </label>
                {showAfterVisit && (
                  <>
                    {(
                      [
                        ['visitedDate', 'Fecha de visita', 'date'],
                        ['fatiRating', 'Nota Fati (1-5)', 'text'],
                        ['robertoRating', 'Nota Roberto (1-5)', 'text'],
                        ['jointRating', 'Nota conjunta (1-5)', 'text'],
                      ] as const
                    ).map(([field, label, type]) => (
                      <label className={styles.field} key={field}>
                        <span>{label}</span>
                        <input
                          type={type}
                          inputMode={type === 'text' ? 'decimal' : undefined}
                          value={values[field]}
                          aria-invalid={Boolean(fieldError(field))}
                          disabled={isSaving}
                          onChange={(event) =>
                            updateField(field, event.target.value)
                          }
                        />
                        {fieldError(field) && (
                          <small className={styles.error}>{fieldError(field)}</small>
                        )}
                      </label>
                    ))}
                    <BooleanSelect
                      id="restaurant-would-return"
                      label="¿Volveríais?"
                      value={values.wouldReturn}
                      disabled={isSaving}
                      onChange={(value) => updateField('wouldReturn', value)}
                    />
                    <label className={`${styles.field} ${styles.fullWidth}`}>
                      <span>Comentarios de la visita</span>
                      <textarea
                        rows={3}
                        value={values.visitComments}
                        disabled={isSaving}
                        onChange={(event) =>
                          updateField('visitComments', event.target.value)
                        }
                      />
                    </label>
                  </>
                )}
              </div>
              {showAfterVisit && renderListEditor('orderedItems', 'Qué pedimos')}
            </details>
          </div>

          <footer className={styles.actions}>
            <button
              className={styles.cancelButton}
              type="button"
              disabled={isSaving}
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void save('draft')}
            >
              {savingStatus === 'draft' ? 'Guardando…' : 'Guardar borrador'}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void save('in_progress')}
            >
              {savingStatus === 'in_progress'
                ? 'Guardando…'
                : 'Guardar en preparación'}
            </button>
            <button
              className={styles.primaryButton}
              type="button"
              disabled={isSaving}
              onClick={() => void save('completed')}
            >
              {savingStatus === 'completed'
                ? 'Guardando…'
                : 'Marcar terminado'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
