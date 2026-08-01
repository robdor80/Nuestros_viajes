import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'

import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import {
  accommodationToFormData,
  accommodationTypeLabels,
  accommodationTypes,
  bookingPlatformLabels,
  bookingPlatforms,
  emptyAccommodationFormData,
  type Accommodation,
  type AccommodationFormData,
  type SaveAccommodationData,
} from '../model/accommodation'
import {
  calculateNights,
  calculatePricePerNight,
} from '../utils/accommodation-calculations'
import {
  normalizeAccommodationFormData,
  validateAccommodation,
  type AccommodationFormErrors,
} from '../utils/accommodation-validation'
import styles from './AccommodationFormModal.module.css'

type AccommodationFormModalProps = {
  accommodation?: Accommodation
  onCancel: () => void
  onSave: (data: SaveAccommodationData) => Promise<void>
}

export function AccommodationFormModal({
  accommodation,
  onCancel,
  onSave,
}: AccommodationFormModalProps) {
  const [values, setValues] = useState<AccommodationFormData>(() =>
    accommodation
      ? accommodationToFormData(accommodation)
      : emptyAccommodationFormData,
  )
  const [errors, setErrors] = useState<AccommodationFormErrors>({})
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [savingStatus, setSavingStatus] = useState<TripContentStatus | null>(
    null,
  )
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const isSavingRef = useRef(false)
  const isEditMode = Boolean(accommodation)
  const isSaving = savingStatus !== null
  const previewUrl = values.imageUrl.trim()
  const showImagePreview =
    Boolean(previewUrl) && failedImageUrl !== previewUrl
  const calculatedNights = calculateNights(
    values.checkInDate,
    values.checkOutDate,
  )
  const calculatedPricePerNight = calculatePricePerNight(
    values.totalPrice,
    calculatedNights,
  )

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
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

  const updateField = <Field extends keyof AccommodationFormData>(
    field: Field,
    value: AccommodationFormData[Field],
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

  const save = async (contentStatus: TripContentStatus) => {
    if (isSavingRef.current) return

    const normalizedValues = normalizeAccommodationFormData(values)
    const nextErrors = validateAccommodation(normalizedValues, contentStatus)

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
          : 'No se ha podido guardar el alojamiento. Inténtalo de nuevo.',
      )
    }
  }

  const fieldError = (field: keyof AccommodationFormData) => errors[field]

  return (
    <div className={styles.backdrop} onMouseDown={handleBackdropMouseDown}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="accommodation-form-title"
        aria-describedby="accommodation-form-description"
        onKeyDown={trapFocus}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Alojamiento</p>
            <h2 id="accommodation-form-title">
              {isEditMode ? 'Editar alojamiento' : 'Añadir alojamiento'}
            </h2>
            <p id="accommodation-form-description">
              Guarda solo el nombre como borrador o completa la reserva.
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

          <div className={styles.fields}>
            <fieldset className={styles.section}>
              <legend>Datos básicos</legend>
              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span>Nombre del alojamiento</span>
                <input
                  ref={nameInputRef}
                  value={values.name}
                  aria-invalid={Boolean(fieldError('name'))}
                  aria-describedby={
                    fieldError('name') ? 'accommodation-name-error' : undefined
                  }
                  disabled={isSaving}
                  onChange={(event) => updateField('name', event.target.value)}
                />
                {fieldError('name') && (
                  <small
                    id="accommodation-name-error"
                    className={styles.fieldError}
                  >
                    {fieldError('name')}
                  </small>
                )}
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span>URL de la imagen</span>
                <input
                  type="url"
                  inputMode="url"
                  value={values.imageUrl}
                  placeholder="https://ejemplo.com/hotel.jpg"
                  aria-invalid={Boolean(fieldError('imageUrl'))}
                  aria-describedby={
                    fieldError('imageUrl')
                      ? 'accommodation-image-error'
                      : undefined
                  }
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField('imageUrl', event.target.value)
                  }
                />
                {fieldError('imageUrl') && (
                  <small
                    id="accommodation-image-error"
                    className={styles.fieldError}
                  >
                    {fieldError('imageUrl')}
                  </small>
                )}
              </label>

              {previewUrl && (
                <div className={styles.preview} aria-live="polite">
                  {showImagePreview ? (
                    <img
                      src={previewUrl}
                      alt={`Vista previa de ${
                        values.name || 'la imagen del alojamiento'
                      }`}
                      onError={() => setFailedImageUrl(previewUrl)}
                    />
                  ) : (
                    <p>No se ha podido mostrar la vista previa de esta imagen.</p>
                  )}
                </div>
              )}

              <label className={styles.field}>
                <span>Tipo</span>
                <select
                  value={values.type}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField(
                      'type',
                      event.target.value as AccommodationFormData['type'],
                    )
                  }
                >
                  <option value="">Seleccionar…</option>
                  {accommodationTypes.map((type) => (
                    <option key={type} value={type}>
                      {accommodationTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span>Dirección</span>
                <input
                  value={values.address}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField('address', event.target.value)
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Google Maps</span>
                <input
                  type="url"
                  inputMode="url"
                  value={values.mapsUrl}
                  aria-invalid={Boolean(fieldError('mapsUrl'))}
                  aria-describedby={
                    fieldError('mapsUrl')
                      ? 'accommodation-maps-error'
                      : undefined
                  }
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField('mapsUrl', event.target.value)
                  }
                />
                {fieldError('mapsUrl') && (
                  <small
                    id="accommodation-maps-error"
                    className={styles.fieldError}
                  >
                    {fieldError('mapsUrl')}
                  </small>
                )}
              </label>

              <label className={styles.field}>
                <span>Página web oficial</span>
                <input
                  type="url"
                  inputMode="url"
                  value={values.websiteUrl}
                  aria-invalid={Boolean(fieldError('websiteUrl'))}
                  aria-describedby={
                    fieldError('websiteUrl')
                      ? 'accommodation-website-error'
                      : undefined
                  }
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField('websiteUrl', event.target.value)
                  }
                />
                {fieldError('websiteUrl') && (
                  <small
                    id="accommodation-website-error"
                    className={styles.fieldError}
                  >
                    {fieldError('websiteUrl')}
                  </small>
                )}
              </label>
            </fieldset>

            <fieldset className={styles.section}>
              <legend>Estancia</legend>
              <label className={styles.field}>
                <span>Fecha de entrada</span>
                <input
                  type="date"
                  value={values.checkInDate}
                  aria-invalid={Boolean(fieldError('checkInDate'))}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField('checkInDate', event.target.value)
                  }
                />
                {fieldError('checkInDate') && (
                  <small className={styles.fieldError}>
                    {fieldError('checkInDate')}
                  </small>
                )}
              </label>

              <label className={styles.field}>
                <span>Fecha de salida</span>
                <input
                  type="date"
                  value={values.checkOutDate}
                  aria-invalid={Boolean(fieldError('checkOutDate'))}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField('checkOutDate', event.target.value)
                  }
                />
                {fieldError('checkOutDate') && (
                  <small className={styles.fieldError}>
                    {fieldError('checkOutDate')}
                  </small>
                )}
              </label>

              <label className={styles.field}>
                <span>Número de noches</span>
                <input value={calculatedNights} readOnly />
              </label>
            </fieldset>

            <fieldset className={`${styles.section} ${styles.switchSection}`}>
              <legend>Servicios</legend>
              <label className={styles.switchField}>
                <span>Desayuno incluido</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={values.breakfastIncluded}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField('breakfastIncluded', event.target.checked)
                  }
                />
              </label>
              <label className={styles.switchField}>
                <span>Parking incluido</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={values.parkingIncluded}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField('parkingIncluded', event.target.checked)
                  }
                />
              </label>
              <label className={styles.switchField}>
                <span>Cancelación gratuita</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={values.freeCancellation}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField('freeCancellation', event.target.checked)
                  }
                />
              </label>
              <label className={styles.switchField}>
                <span>Piscina</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={values.pool}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField('pool', event.target.checked)
                  }
                />
              </label>
            </fieldset>

            <fieldset className={styles.section}>
              <legend>Información económica</legend>
              <label className={styles.field}>
                <span>Precio total</span>
                <input
                  value={values.totalPrice}
                  placeholder="Por ejemplo, 320 €"
                  aria-invalid={Boolean(fieldError('totalPrice'))}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField('totalPrice', event.target.value)
                  }
                />
                {fieldError('totalPrice') && (
                  <small className={styles.fieldError}>
                    {fieldError('totalPrice')}
                  </small>
                )}
              </label>

              <label className={styles.field}>
                <span>Precio por noche</span>
                <input value={calculatedPricePerNight} readOnly />
              </label>

              <label className={styles.field}>
                <span>¿Pagado?</span>
                <select
                  value={
                    values.isPaid === null
                      ? ''
                      : values.isPaid
                        ? 'yes'
                        : 'no'
                  }
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField(
                      'isPaid',
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

              <label className={styles.field}>
                <span>Fecha límite de cancelación gratuita</span>
                <input
                  type="date"
                  value={values.freeCancellationDeadline}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField(
                      'freeCancellationDeadline',
                      event.target.value,
                    )
                  }
                />
              </label>
            </fieldset>

            <fieldset className={styles.section}>
              <legend>Información útil</legend>
              <label className={styles.field}>
                <span>Hora de check-in</span>
                <input
                  type="time"
                  value={values.checkInTime}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField('checkInTime', event.target.value)
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Hora de check-out</span>
                <input
                  type="time"
                  value={values.checkOutTime}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField('checkOutTime', event.target.value)
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Código de reserva</span>
                <input
                  value={values.reservationCode}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField('reservationCode', event.target.value)
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Plataforma de reserva</span>
                <select
                  value={values.bookingPlatform}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField(
                      'bookingPlatform',
                      event.target
                        .value as AccommodationFormData['bookingPlatform'],
                    )
                  }
                >
                  <option value="">Seleccionar…</option>
                  {bookingPlatforms.map((platform) => (
                    <option key={platform} value={platform}>
                      {bookingPlatformLabels[platform]}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>

            <fieldset className={styles.section}>
              <legend>Notas</legend>
              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span>Notas</span>
                <textarea
                  rows={4}
                  value={values.notes}
                  disabled={isSaving}
                  onChange={(event) => updateField('notes', event.target.value)}
                />
              </label>
            </fieldset>
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
              {savingStatus === 'draft'
                ? 'Guardando…'
                : 'Guardar como Borrador'}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void save('in_progress')}
            >
              {savingStatus === 'in_progress'
                ? 'Guardando…'
                : 'Guardar como En preparación'}
            </button>
            <button
              className={styles.completeButton}
              type="button"
              disabled={isSaving}
              onClick={() => void save('completed')}
            >
              {savingStatus === 'completed'
                ? 'Guardando…'
                : 'Marcar como Terminado'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
