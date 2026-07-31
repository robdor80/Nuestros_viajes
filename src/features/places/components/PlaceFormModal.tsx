import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'

import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import {
  emptyPlaceFormData,
  placeBestTimeLabels,
  placeBestTimes,
  placeCategories,
  placeCategoryLabels,
  placePriorities,
  placePriorityLabels,
  placeToFormData,
  type Place,
  type PlaceFormData,
  type SavePlaceData,
} from '../model/place'
import {
  normalizePlaceFormData,
  validatePlace,
  type PlaceFormErrors,
} from '../utils/place-validation'
import styles from './PlaceFormModal.module.css'

type PlaceFormModalProps = {
  place?: Place
  onCancel: () => void
  onSave: (data: SavePlaceData) => Promise<void>
}

export function PlaceFormModal({
  place,
  onCancel,
  onSave,
}: PlaceFormModalProps) {
  const [values, setValues] = useState<PlaceFormData>(() =>
    place ? placeToFormData(place) : emptyPlaceFormData,
  )
  const [errors, setErrors] = useState<PlaceFormErrors>({})
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [savingStatus, setSavingStatus] = useState<TripContentStatus | null>(
    null,
  )
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const isSavingRef = useRef(false)
  const isEditMode = Boolean(place)
  const isSaving = savingStatus !== null
  const previewUrl = values.imageUrl.trim()
  const showImagePreview =
    Boolean(previewUrl) && failedImageUrl !== previewUrl

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
    if (event.key !== 'Tab' || !dialogRef.current) {
      return
    }

    const focusableElements = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements.at(-1)

    if (!firstElement || !lastElement) {
      return
    }

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

  const updateField = <Field extends keyof PlaceFormData>(
    field: Field,
    value: PlaceFormData[Field],
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
    if (isSavingRef.current) {
      return
    }

    const normalizedValues = normalizePlaceFormData(values)
    const nextErrors = validatePlace(normalizedValues, contentStatus)

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
          : 'No se ha podido guardar el lugar. Inténtalo de nuevo.',
      )
    }
  }

  const fieldError = (field: keyof PlaceFormData) => errors[field]

  return (
    <div className={styles.backdrop} onMouseDown={handleBackdropMouseDown}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-form-title"
        aria-describedby="place-form-description"
        onKeyDown={trapFocus}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Qué se verá</p>
            <h2 id="place-form-title">
              {isEditMode ? 'Editar lugar' : 'Añadir lugar'}
            </h2>
            <p id="place-form-description">
              Guarda solo el nombre como borrador o completa la información
              disponible.
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
            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span>Nombre</span>
              <input
                ref={nameInputRef}
                value={values.name}
                aria-invalid={Boolean(fieldError('name'))}
                aria-describedby={fieldError('name') ? 'place-name-error' : undefined}
                disabled={isSaving}
                onChange={(event) => updateField('name', event.target.value)}
              />
              {fieldError('name') && (
                <small id="place-name-error" className={styles.fieldError}>
                  {fieldError('name')}
                </small>
              )}
            </label>

            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span>URL de la imagen principal</span>
              <input
                type="url"
                inputMode="url"
                value={values.imageUrl}
                placeholder="https://ejemplo.com/imagen.jpg"
                aria-invalid={Boolean(fieldError('imageUrl'))}
                aria-describedby={fieldError('imageUrl') ? 'image-url-error' : 'image-url-help'}
                disabled={isSaving}
                onChange={(event) => updateField('imageUrl', event.target.value)}
              />
              {fieldError('imageUrl') ? (
                <small id="image-url-error" className={styles.fieldError}>
                  {fieldError('imageUrl')}
                </small>
              ) : (
                <small id="image-url-help" className={styles.fieldHelp}>
                  Se guardará la URL externa; la imagen no se subirá.
                </small>
              )}
            </label>

            {previewUrl && (
              <div className={styles.preview} aria-live="polite">
                {showImagePreview ? (
                  <img
                    src={previewUrl}
                    alt={`Vista previa de ${values.name || 'la imagen del lugar'}`}
                    onError={() => setFailedImageUrl(previewUrl)}
                  />
                ) : (
                  <p>No se ha podido mostrar la vista previa de esta imagen.</p>
                )}
              </div>
            )}

            <label className={styles.field}>
              <span>Categoría</span>
              <select
                value={values.category}
                aria-invalid={Boolean(fieldError('category'))}
                aria-describedby={fieldError('category') ? 'category-error' : undefined}
                disabled={isSaving}
                onChange={(event) =>
                  updateField(
                    'category',
                    event.target.value as PlaceFormData['category'],
                  )
                }
              >
                <option value="">Seleccionar…</option>
                {placeCategories.map((category) => (
                  <option key={category} value={category}>
                    {placeCategoryLabels[category]}
                  </option>
                ))}
              </select>
              {fieldError('category') && (
                <small id="category-error" className={styles.fieldError}>
                  {fieldError('category')}
                </small>
              )}
            </label>

            <label className={styles.field}>
              <span>Prioridad</span>
              <select
                value={values.priority}
                aria-invalid={Boolean(fieldError('priority'))}
                aria-describedby={fieldError('priority') ? 'priority-error' : undefined}
                disabled={isSaving}
                onChange={(event) =>
                  updateField(
                    'priority',
                    event.target.value as PlaceFormData['priority'],
                  )
                }
              >
                <option value="">Seleccionar…</option>
                {placePriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {placePriorityLabels[priority]}
                  </option>
                ))}
              </select>
              {fieldError('priority') && (
                <small id="priority-error" className={styles.fieldError}>
                  {fieldError('priority')}
                </small>
              )}
            </label>

            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span>Descripción</span>
              <textarea
                rows={4}
                value={values.description}
                disabled={isSaving}
                onChange={(event) => updateField('description', event.target.value)}
              />
            </label>

            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span>Dirección</span>
              <input
                value={values.address}
                disabled={isSaving}
                onChange={(event) => updateField('address', event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span>Enlace de Google Maps</span>
              <input
                type="url"
                inputMode="url"
                value={values.mapsUrl}
                aria-invalid={Boolean(fieldError('mapsUrl'))}
                aria-describedby={fieldError('mapsUrl') ? 'maps-url-error' : undefined}
                disabled={isSaving}
                onChange={(event) => updateField('mapsUrl', event.target.value)}
              />
              {fieldError('mapsUrl') && (
                <small id="maps-url-error" className={styles.fieldError}>
                  {fieldError('mapsUrl')}
                </small>
              )}
            </label>

            <label className={styles.field}>
              <span>Página web</span>
              <input
                type="url"
                inputMode="url"
                value={values.websiteUrl}
                aria-invalid={Boolean(fieldError('websiteUrl'))}
                aria-describedby={fieldError('websiteUrl') ? 'website-url-error' : undefined}
                disabled={isSaving}
                onChange={(event) => updateField('websiteUrl', event.target.value)}
              />
              {fieldError('websiteUrl') && (
                <small id="website-url-error" className={styles.fieldError}>
                  {fieldError('websiteUrl')}
                </small>
              )}
            </label>

            <label className={styles.field}>
              <span>Horario</span>
              <input
                value={values.openingHours}
                disabled={isSaving}
                onChange={(event) => updateField('openingHours', event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span>Precio</span>
              <input
                value={values.price}
                placeholder="Por ejemplo, 12 €"
                disabled={isSaving}
                onChange={(event) => updateField('price', event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span>Duración estimada</span>
              <input
                value={values.estimatedDuration}
                placeholder="Por ejemplo, 1 h 30 min"
                disabled={isSaving}
                onChange={(event) => updateField('estimatedDuration', event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span>Mejor momento para visitarlo</span>
              <select
                value={values.bestTime}
                disabled={isSaving}
                onChange={(event) =>
                  updateField(
                    'bestTime',
                    event.target.value as PlaceFormData['bestTime'],
                  )
                }
              >
                <option value="">Seleccionar…</option>
                {placeBestTimes.map((bestTime) => (
                  <option key={bestTime} value={bestTime}>
                    {placeBestTimeLabels[bestTime]}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Necesita reserva</span>
              <select
                value={
                  values.requiresReservation === null
                    ? ''
                    : values.requiresReservation
                      ? 'yes'
                      : 'no'
                }
                disabled={isSaving}
                onChange={(event) =>
                  updateField(
                    'requiresReservation',
                    event.target.value === ''
                      ? null
                      : event.target.value === 'yes',
                  )
                }
              >
                <option value="">Sin indicar</option>
                <option value="yes">Sí</option>
                <option value="no">No</option>
              </select>
            </label>

            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span>Notas</span>
              <textarea
                rows={4}
                value={values.notes}
                disabled={isSaving}
                onChange={(event) => updateField('notes', event.target.value)}
              />
            </label>
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
              {savingStatus === 'draft' ? 'Guardando…' : 'Guardar como Borrador'}
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
