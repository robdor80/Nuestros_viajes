import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'

import {
  tripSections,
  type BaseTrip,
  type TripSection,
  type TripStatus,
  type TripTransport,
} from '../model/trip'
import styles from './NewTripModal.module.css'

type NewTripModalProps = {
  onCancel: () => void
  onCreate: (trip: BaseTrip) => void
}

type TripFormValues = {
  name: string
  destination: string
  country: string
  description: string
  startDate: string
  endDate: string
  participants: string
  transport: TripTransport
  currency: string
  status: TripStatus
  enabledSections: TripSection[]
}

type FormField =
  | 'name'
  | 'destination'
  | 'country'
  | 'startDate'
  | 'endDate'
  | 'participants'
  | 'dateRange'

type FormErrors = Partial<Record<FormField, string>>

const defaultSections: TripSection[] = [
  'places',
  'itinerary',
  'accommodation',
  'transfers',
  'budget',
]

const initialValues: TripFormValues = {
  name: '',
  destination: '',
  country: '',
  description: '',
  startDate: '',
  endDate: '',
  participants: 'Roberto\nFati',
  transport: 'car',
  currency: 'EUR',
  status: 'draft',
  enabledSections: defaultSections,
}

const transportOptions: Array<{ value: TripTransport; label: string }> = [
  { value: 'car', label: 'Coche' },
  { value: 'plane', label: 'Avión' },
  { value: 'train', label: 'Tren' },
  { value: 'bus', label: 'Autobús' },
  { value: 'boat', label: 'Barco' },
  { value: 'other', label: 'Otro' },
]

const sectionLabels: Record<TripSection, string> = {
  places: 'Lugares',
  itinerary: 'Itinerario',
  accommodation: 'Alojamiento',
  transfers: 'Trayectos',
  budget: 'Presupuesto',
  restaurants: 'Restaurantes',
  checklist: 'Checklist',
  documentation: 'Documentación',
  photos: 'Fotografías',
}

function parseDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)

  if (!year || !month || !day) {
    return null
  }

  return Date.UTC(year, month - 1, day)
}

function calculateDuration(startDate: string, endDate: string) {
  const start = parseDate(startDate)
  const end = parseDate(endDate)

  if (start === null || end === null || end < start) {
    return null
  }

  const nights = Math.round((end - start) / 86_400_000)

  return {
    days: nights + 1,
    nights,
  }
}

function createTemporaryId() {
  return `trip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function NewTripModal({
  onCancel,
  onCreate,
}: NewTripModalProps) {
  const [values, setValues] = useState<TripFormValues>(initialValues)
  const [isNameEdited, setIsNameEdited] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const dialogRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const suggestedName = useMemo(() => {
    const year = values.startDate.slice(0, 4)
    return [values.destination.trim(), year].filter(Boolean).join(' ')
  }, [values.destination, values.startDate])

  const displayedName = isNameEdited ? values.name : suggestedName
  const duration = calculateDuration(values.startDate, values.endDate)

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement as HTMLElement | null
    const previousBodyOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    nameInputRef.current?.focus()

    const handleDocumentKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
    }

    document.addEventListener('keydown', handleDocumentKeyDown)

    return () => {
      document.removeEventListener('keydown', handleDocumentKeyDown)
      document.body.style.overflow = previousBodyOverflow
      previouslyFocusedElement?.focus()
    }
  }, [onCancel])

  const updateField = <Field extends keyof TripFormValues>(
    field: Field,
    value: TripFormValues[Field],
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))

    if (
      field in errors ||
      ((field === 'startDate' || field === 'endDate') && errors.dateRange)
    ) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [field]: undefined,
        ...((field === 'startDate' || field === 'endDate') && {
          dateRange: undefined,
        }),
      }))
    }
  }

  const toggleSection = (section: TripSection) => {
    setValues((currentValues) => ({
      ...currentValues,
      enabledSections: currentValues.enabledSections.includes(section)
        ? currentValues.enabledSections.filter(
            (enabledSection) => enabledSection !== section,
          )
        : [...currentValues.enabledSections, section],
    }))
  }

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) {
      return
    }

    const focusableElements = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute('hidden'))

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
    if (event.target === event.currentTarget) {
      onCancel()
    }
  }

  const validateForm = () => {
    const nextErrors: FormErrors = {}
    const participants = values.participants
      .split(/[\n,;]+/)
      .map((participant) => participant.trim())
      .filter(Boolean)

    if (!displayedName.trim()) {
      nextErrors.name = 'Indica un nombre para el viaje.'
    }

    if (!values.destination.trim()) {
      nextErrors.destination = 'Indica el destino principal.'
    }

    if (!values.country.trim()) {
      nextErrors.country = 'Indica el país.'
    }

    if (!values.startDate) {
      nextErrors.startDate = 'Indica la fecha de inicio.'
    }

    if (!values.endDate) {
      nextErrors.endDate = 'Indica la fecha de finalización.'
    }

    if (
      values.startDate &&
      values.endDate &&
      values.endDate < values.startDate
    ) {
      nextErrors.dateRange =
        'La fecha de finalización no puede ser anterior a la fecha de inicio.'
    }

    if (participants.length === 0) {
      nextErrors.participants = 'Añade al menos una persona.'
    }

    return {
      nextErrors,
      participants,
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const { nextErrors, participants } = validateForm()

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onCreate({
      id: createTemporaryId(),
      name: displayedName.trim(),
      destination: values.destination.trim(),
      country: values.country.trim(),
      description: values.description.trim(),
      startDate: values.startDate,
      endDate: values.endDate,
      participants,
      transport: values.transport,
      currency: values.currency,
      status: values.status,
      enabledSections: values.enabledSections,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div
      className={styles.backdrop}
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-trip-title"
        aria-describedby="new-trip-description"
        onKeyDown={trapFocus}
      >
        <header className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>Nuevo viaje</p>
            <h1 id="new-trip-title" className={styles.title}>
              Crear un nuevo viaje
            </h1>
            <p id="new-trip-description" className={styles.description}>
              Empecemos por lo esencial. El resto del viaje se completará poco
              a poco.
            </p>
          </div>

          <button
            className={styles.closeButton}
            type="button"
            aria-label="Cerrar formulario de nuevo viaje"
            onClick={onCancel}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          {Object.keys(errors).length > 0 && (
            <div className={styles.errorSummary} role="alert">
              Revisa los campos señalados antes de crear el viaje.
            </div>
          )}

          <section
            className={`${styles.section} ${styles.mainDataSection}`}
            aria-labelledby="main-data-title"
          >
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>A</span>
              <div>
                <h2 id="main-data-title">Datos principales</h2>
                <p>El nombre y el destino que identificarán este viaje.</p>
              </div>
            </div>

            <div className={styles.fieldsGrid}>
              <label className={styles.field}>
                <span>Nombre del viaje</span>
                <input
                  ref={nameInputRef}
                  name="trip-name"
                  value={displayedName}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name ? 'trip-name-error' : 'trip-name-help'
                  }
                  onChange={(event) => {
                    setIsNameEdited(true)
                    updateField('name', event.target.value)
                  }}
                />
                {errors.name ? (
                  <small id="trip-name-error" className={styles.fieldError}>
                    {errors.name}
                  </small>
                ) : (
                  <small id="trip-name-help" className={styles.fieldHelp}>
                    Se sugiere con el destino y el año, pero puedes editarlo.
                  </small>
                )}
              </label>

              <label className={styles.field}>
                <span>Destino principal</span>
                <input
                  name="destination"
                  value={values.destination}
                  placeholder="Évora"
                  aria-invalid={Boolean(errors.destination)}
                  aria-describedby={
                    errors.destination ? 'destination-error' : undefined
                  }
                  onChange={(event) =>
                    updateField('destination', event.target.value)
                  }
                />
                {errors.destination && (
                  <small id="destination-error" className={styles.fieldError}>
                    {errors.destination}
                  </small>
                )}
              </label>

              <label className={styles.field}>
                <span>País</span>
                <input
                  name="country"
                  value={values.country}
                  placeholder="Portugal"
                  aria-invalid={Boolean(errors.country)}
                  aria-describedby={
                    errors.country ? 'country-error' : undefined
                  }
                  onChange={(event) =>
                    updateField('country', event.target.value)
                  }
                />
                {errors.country && (
                  <small id="country-error" className={styles.fieldError}>
                    {errors.country}
                  </small>
                )}
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span>Descripción breve</span>
                <textarea
                  name="description"
                  value={values.description}
                  rows={3}
                  placeholder="Una escapada para descubrir la ciudad con calma…"
                  onChange={(event) =>
                    updateField('description', event.target.value)
                  }
                />
                <small className={styles.fieldHelp}>Opcional</small>
              </label>
            </div>
          </section>

          <section
            className={`${styles.section} ${styles.datesSection}`}
            aria-labelledby="dates-title"
          >
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>B</span>
              <div>
                <h2 id="dates-title">Fechas</h2>
                <p>Cuándo empieza y cuándo termina la aventura.</p>
              </div>
            </div>

            <div className={styles.fieldsGrid}>
              <label className={styles.field}>
                <span>Fecha de inicio</span>
                <input
                  type="date"
                  name="start-date"
                  value={values.startDate}
                  aria-invalid={Boolean(errors.startDate || errors.dateRange)}
                  aria-describedby={
                    errors.startDate ? 'start-date-error' : undefined
                  }
                  onInput={(event) =>
                    updateField('startDate', event.currentTarget.value)
                  }
                />
                {errors.startDate && (
                  <small id="start-date-error" className={styles.fieldError}>
                    {errors.startDate}
                  </small>
                )}
              </label>

              <label className={styles.field}>
                <span>Fecha de finalización</span>
                <input
                  type="date"
                  name="end-date"
                  value={values.endDate}
                  min={values.startDate || undefined}
                  aria-invalid={Boolean(errors.endDate || errors.dateRange)}
                  aria-describedby={
                    errors.endDate
                      ? 'end-date-error'
                      : errors.dateRange
                        ? 'date-range-error'
                        : undefined
                  }
                  onInput={(event) =>
                    updateField('endDate', event.currentTarget.value)
                  }
                />
                {errors.endDate && (
                  <small id="end-date-error" className={styles.fieldError}>
                    {errors.endDate}
                  </small>
                )}
              </label>
            </div>

            {errors.dateRange && (
              <p id="date-range-error" className={styles.rangeError} role="alert">
                {errors.dateRange}
              </p>
            )}

            <div className={styles.duration} aria-live="polite">
              <span>
                <strong>{duration?.days ?? '—'}</strong>
                {duration?.days === 1 ? ' día' : ' días'}
              </span>
              <span>
                <strong>{duration?.nights ?? '—'}</strong>
                {duration?.nights === 1 ? ' noche' : ' noches'}
              </span>
            </div>
          </section>

          <section
            className={`${styles.section} ${styles.peopleSection}`}
            aria-labelledby="people-title"
          >
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>C</span>
              <div>
                <h2 id="people-title">Participantes y transporte</h2>
                <p>Quiénes viajan y cómo será el trayecto principal.</p>
              </div>
            </div>

            <div className={styles.fieldsGrid}>
              <label className={styles.field}>
                <span>Participantes</span>
                <textarea
                  name="participants"
                  value={values.participants}
                  rows={3}
                  aria-invalid={Boolean(errors.participants)}
                  aria-describedby={
                    errors.participants
                      ? 'participants-error'
                      : 'participants-help'
                  }
                  onChange={(event) =>
                    updateField('participants', event.target.value)
                  }
                />
                {errors.participants ? (
                  <small id="participants-error" className={styles.fieldError}>
                    {errors.participants}
                  </small>
                ) : (
                  <small id="participants-help" className={styles.fieldHelp}>
                    Escribe una persona por línea.
                  </small>
                )}
              </label>

              <label className={styles.field}>
                <span>Transporte principal</span>
                <select
                  name="transport"
                  value={values.transport}
                  onChange={(event) =>
                    updateField(
                      'transport',
                      event.target.value as TripTransport,
                    )
                  }
                >
                  {transportOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section
            className={`${styles.section} ${styles.configurationSection}`}
            aria-labelledby="configuration-title"
          >
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>D</span>
              <div>
                <h2 id="configuration-title">Configuración</h2>
                <p>Las preferencias iniciales del nuevo espacio de viaje.</p>
              </div>
            </div>

            <div className={styles.fieldsGrid}>
              <label className={styles.field}>
                <span>Moneda principal</span>
                <select
                  name="currency"
                  value={values.currency}
                  onChange={(event) =>
                    updateField('currency', event.target.value)
                  }
                >
                  <option value="EUR">EUR · Euro</option>
                  <option value="USD">USD · Dólar estadounidense</option>
                  <option value="GBP">GBP · Libra esterlina</option>
                </select>
              </label>

              <fieldset className={styles.choiceFieldset}>
                <legend>Estado inicial</legend>
                <div className={styles.choiceGroup}>
                  <label className={styles.choiceCard}>
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={values.status === 'draft'}
                      onChange={() => updateField('status', 'draft')}
                    />
                    <span>
                      <strong>Borrador</strong>
                      Para empezar a reunir ideas.
                    </span>
                  </label>
                  <label className={styles.choiceCard}>
                    <input
                      type="radio"
                      name="status"
                      value="planned"
                      checked={values.status === 'planned'}
                      onChange={() => updateField('status', 'planned')}
                    />
                    <span>
                      <strong>Planificado</strong>
                      Si las fechas ya están decididas.
                    </span>
                  </label>
                </div>
              </fieldset>
            </div>

            <fieldset className={styles.sectionsFieldset}>
              <legend>Secciones del viaje</legend>
              <p>Elige qué apartados estarán disponibles desde el principio.</p>
              <div className={styles.sectionsGrid}>
                {tripSections.map((section) => (
                  <label key={section} className={styles.sectionChoice}>
                    <input
                      type="checkbox"
                      checked={values.enabledSections.includes(section)}
                      onChange={() => toggleSection(section)}
                    />
                    <span>{sectionLabels[section]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <footer className={styles.actions}>
            <button
              className={styles.cancelButton}
              type="button"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button className={styles.submitButton} type="submit">
              Crear viaje
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
