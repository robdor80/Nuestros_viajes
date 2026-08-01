import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'

import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import {
  emptyTransferFormData,
  transferDirectionActionLabels,
  transferDirectionLabels,
  transferToFormData,
  type SaveTransferData,
  type Transfer,
  type TransferDirection,
  type TransferFormData,
  type TransferStop,
} from '../model/transfer'
import { buildGoogleMapsDirectionsUrl } from '../utils/transfer-maps'
import {
  normalizeTransferFormData,
  validateTransfer,
  type TransferFormErrors,
} from '../utils/transfer-validation'
import styles from './TransferFormModal.module.css'

type TransferFormModalProps = {
  direction: TransferDirection
  transfer?: Transfer
  onCancel: () => void
  onSave: (data: SaveTransferData) => Promise<void>
}

type BooleanSelectValue = '' | 'true' | 'false'

const statusButtons: Array<{
  status: TripContentStatus
  label: string
}> = [
  { status: 'draft', label: 'Guardar borrador' },
  { status: 'in_progress', label: 'Guardar en preparación' },
  { status: 'completed', label: 'Marcar terminado' },
]

function createStopId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `stop-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createEmptyStop(order: number): TransferStop {
  return {
    id: createStopId(),
    description: '',
    location: '',
    notes: '',
    order,
  }
}

function booleanToSelectValue(value: boolean | null): BooleanSelectValue {
  if (value === null) return ''

  return value ? 'true' : 'false'
}

function selectValueToBoolean(value: BooleanSelectValue) {
  if (value === '') return null

  return value === 'true'
}

export function TransferFormModal({
  direction,
  transfer,
  onCancel,
  onSave,
}: TransferFormModalProps) {
  const [values, setValues] = useState<TransferFormData>(() =>
    transfer ? transferToFormData(transfer) : emptyTransferFormData,
  )
  const [errors, setErrors] = useState<TransferFormErrors>({})
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [savingStatus, setSavingStatus] = useState<TripContentStatus | null>(
    null,
  )
  const dialogRef = useRef<HTMLDivElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const isSavingRef = useRef(false)
  const isSaving = savingStatus !== null
  const label = transferDirectionLabels[direction]
  const actionLabel = transferDirectionActionLabels[direction]
  const isEditMode = Boolean(transfer)
  const generatedMapsUrl = buildGoogleMapsDirectionsUrl(values)

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement as HTMLElement | null
    const previousBodyOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    dateInputRef.current?.focus()

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
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
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

  const clearFieldError = (field: keyof TransferFormData) => {
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
      form: undefined,
    }))
    setSubmissionError(null)
  }

  const updateField = <Field extends keyof TransferFormData>(
    field: Field,
    value: TransferFormData[Field],
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
    clearFieldError(field)
  }

  const updateStop = (
    stopId: string,
    field: keyof Omit<TransferStop, 'id' | 'order'>,
    value: string,
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      plannedStops: currentValues.plannedStops.map((stop) =>
        stop.id === stopId ? { ...stop, [field]: value } : stop,
      ),
    }))
    clearFieldError('plannedStops')
  }

  const addStop = () => {
    setValues((currentValues) => ({
      ...currentValues,
      plannedStops: [
        ...currentValues.plannedStops,
        createEmptyStop(currentValues.plannedStops.length),
      ],
    }))
    clearFieldError('plannedStops')
  }

  const removeStop = (stopId: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      plannedStops: currentValues.plannedStops
        .filter((stop) => stop.id !== stopId)
        .map((stop, index) => ({ ...stop, order: index })),
    }))
    clearFieldError('plannedStops')
  }

  const moveStop = (stopId: string, directionOffset: -1 | 1) => {
    setValues((currentValues) => {
      const currentIndex = currentValues.plannedStops.findIndex(
        (stop) => stop.id === stopId,
      )
      const nextIndex = currentIndex + directionOffset

      if (
        currentIndex < 0 ||
        nextIndex < 0 ||
        nextIndex >= currentValues.plannedStops.length
      ) {
        return currentValues
      }

      const nextStops = [...currentValues.plannedStops]
      const [movedStop] = nextStops.splice(currentIndex, 1)
      nextStops.splice(nextIndex, 0, movedStop)

      return {
        ...currentValues,
        plannedStops: nextStops.map((stop, index) => ({
          ...stop,
          order: index,
        })),
      }
    })
    clearFieldError('plannedStops')
  }

  const updateBooleanField = (
    field: 'viaMotorway' | 'hasTolls',
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    updateField(field, selectValueToBoolean(event.target.value as BooleanSelectValue))
  }

  const save = async (contentStatus: TripContentStatus) => {
    if (isSavingRef.current) return

    const normalizedValues = normalizeTransferFormData(values)
    const nextErrors = validateTransfer(normalizedValues, contentStatus)

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
          : 'No se ha podido guardar el trayecto. Inténtalo de nuevo.',
      )
    }
  }

  const fieldError = (field: keyof TransferFormData) => errors[field]

  return (
    <div className={styles.backdrop} onMouseDown={handleBackdropMouseDown}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-form-title"
        aria-describedby="transfer-form-description"
        onKeyDown={trapFocus}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Trayecto de {label}</p>
            <h2 id="transfer-form-title">
              {isEditMode
                ? `Editar trayecto de ${actionLabel}`
                : `Preparar trayecto de ${actionLabel}`}
            </h2>
            <p id="transfer-form-description">
              Añade la ruta, las paradas previstas y los enlaces de Google
              Maps.
            </p>
          </div>
          <button
            className={styles.closeButton}
            type="button"
            aria-label="Cerrar formulario"
            disabled={isSaving}
            onClick={onCancel}
          >
            ×
          </button>
        </header>

        <div className={styles.content}>
          <div className={styles.grid}>
            <label>
              <span>Fecha</span>
              <input
                ref={dateInputRef}
                type="date"
                value={values.date}
                aria-invalid={Boolean(fieldError('date'))}
                onChange={(event) => updateField('date', event.target.value)}
              />
              {fieldError('date') && (
                <small className={styles.error}>{fieldError('date')}</small>
              )}
            </label>

            <label>
              <span>Origen</span>
              <input
                type="text"
                value={values.origin}
                placeholder="Vigo"
                aria-invalid={Boolean(fieldError('origin'))}
                onChange={(event) =>
                  updateField('origin', event.target.value)
                }
              />
              {fieldError('origin') && (
                <small className={styles.error}>{fieldError('origin')}</small>
              )}
            </label>

            <label>
              <span>Destino</span>
              <input
                type="text"
                value={values.destination}
                placeholder="Évora"
                aria-invalid={Boolean(fieldError('destination'))}
                onChange={(event) =>
                  updateField('destination', event.target.value)
                }
              />
              {fieldError('destination') && (
                <small className={styles.error}>
                  {fieldError('destination')}
                </small>
              )}
            </label>

            <label>
              <span>Por autopista</span>
              <select
                value={booleanToSelectValue(values.viaMotorway)}
                onChange={(event) => updateBooleanField('viaMotorway', event)}
              >
                <option value="">Sin indicar</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </label>

            <label>
              <span>Tiene peajes</span>
              <select
                value={booleanToSelectValue(values.hasTolls)}
                onChange={(event) => updateBooleanField('hasTolls', event)}
              >
                <option value="">Sin indicar</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </label>

            <label>
              <span>Coste estimado de peajes</span>
              <input
                type="text"
                inputMode="decimal"
                value={values.estimatedTollCost}
                placeholder="18 €"
                onChange={(event) =>
                  updateField('estimatedTollCost', event.target.value)
                }
              />
            </label>

            <label>
              <span>Duración estimada</span>
              <input
                type="text"
                value={values.estimatedDuration}
                placeholder="4 h 30 min"
                onChange={(event) =>
                  updateField('estimatedDuration', event.target.value)
                }
              />
            </label>

            <label>
              <span>Distancia</span>
              <input
                type="text"
                value={values.distanceKm}
                placeholder="430 km"
                onChange={(event) =>
                  updateField('distanceKm', event.target.value)
                }
              />
            </label>
          </div>

          <section className={styles.stops} aria-labelledby="transfer-stops-title">
            <div className={styles.stopsHeader}>
              <div>
                <h3 id="transfer-stops-title">Paradas previstas</h3>
                <p>Añade solo las que queráis tener visibles en la ruta.</p>
              </div>
              <button type="button" disabled={isSaving} onClick={addStop}>
                Añadir parada
              </button>
            </div>

            {values.plannedStops.length > 0 && (
              <ol className={styles.stopList}>
                {values.plannedStops.map((stop, index) => (
                  <li key={stop.id} className={styles.stopItem}>
                    <div className={styles.stopHeading}>
                      <span>Parada {index + 1}</span>
                      <div>
                        <button
                          type="button"
                          disabled={isSaving || index === 0}
                          onClick={() => moveStop(stop.id, -1)}
                        >
                          Subir
                        </button>
                        <button
                          type="button"
                          disabled={
                            isSaving || index === values.plannedStops.length - 1
                          }
                          onClick={() => moveStop(stop.id, 1)}
                        >
                          Bajar
                        </button>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => removeStop(stop.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    <label>
                      <span>Nombre o descripción</span>
                      <input
                        type="text"
                        value={stop.description}
                        placeholder="Catedral de Évora"
                        onChange={(event) =>
                          updateStop(stop.id, 'description', event.target.value)
                        }
                      />
                    </label>

                    <label>
                      <span>Ubicación para Maps</span>
                      <input
                        type="text"
                        value={stop.location}
                        placeholder="Largo do Marquês de Marialva, Évora"
                        onChange={(event) =>
                          updateStop(stop.id, 'location', event.target.value)
                        }
                      />
                    </label>

                    <label>
                      <span>Notas de la parada</span>
                      <textarea
                        rows={2}
                        value={stop.notes}
                        onChange={(event) =>
                          updateStop(stop.id, 'notes', event.target.value)
                        }
                      />
                    </label>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <label className={styles.fullWidth}>
            <span>Enlace de Google Maps</span>
            <input
              type="url"
              value={values.mapsUrl}
              placeholder={generatedMapsUrl || 'Se autogenera al guardar si hay origen y destino'}
              aria-invalid={Boolean(fieldError('mapsUrl'))}
              onChange={(event) => updateField('mapsUrl', event.target.value)}
            />
            {generatedMapsUrl && !values.mapsUrl.trim() && (
              <small>
                Se guardará automáticamente una ruta de Google Maps con las
                paradas que tengan ubicación.
              </small>
            )}
            {fieldError('mapsUrl') && (
              <small className={styles.error}>{fieldError('mapsUrl')}</small>
            )}
          </label>

          <label className={styles.fullWidth}>
            <span>URL de mapa embebido</span>
            <input
              type="url"
              value={values.mapsEmbedUrl}
              placeholder="https://www.google.com/maps/embed?..."
              aria-invalid={Boolean(fieldError('mapsEmbedUrl'))}
              onChange={(event) =>
                updateField('mapsEmbedUrl', event.target.value)
              }
            />
            {fieldError('mapsEmbedUrl') && (
              <small className={styles.error}>
                {fieldError('mapsEmbedUrl')}
              </small>
            )}
          </label>

          <label className={styles.fullWidth}>
            <span>Notas</span>
            <textarea
              rows={4}
              value={values.notes}
              onChange={(event) => updateField('notes', event.target.value)}
            />
          </label>

          {(errors.form || submissionError) && (
            <p className={styles.formError} role="alert">
              {errors.form ?? submissionError}
            </p>
          )}
        </div>

        <footer className={styles.actions}>
          <button type="button" disabled={isSaving} onClick={onCancel}>
            Cancelar
          </button>
          {statusButtons.map(({ status, label: buttonLabel }) => (
            <button
              key={status}
              className={
                status === 'completed'
                  ? styles.primaryButton
                  : styles.secondaryButton
              }
              type="button"
              disabled={isSaving}
              onClick={() => void save(status)}
            >
              {savingStatus === status ? 'Guardando…' : buttonLabel}
            </button>
          ))}
        </footer>
      </div>
    </div>
  )
}
