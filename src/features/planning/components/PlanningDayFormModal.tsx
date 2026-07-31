import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'

import {
  placeCategoryLabels,
  placePriorityLabels,
  type Place,
} from '../../places/model/place'
import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import { tripContentStatusLabels } from '../../trip-workspace/model/trip-content'
import {
  emptyPlanningActivity,
  emptyPlanningDayFormData,
  planningActivityTypeLabels,
  planningActivityTypes,
  planningDayToFormData,
  planningMomentLabels,
  planningMoments,
  type PlanningActivity,
  type PlanningDay,
  type PlanningDayFormData,
  type SavePlanningDayData,
} from '../model/planning'
import { formatPlanningDate } from '../utils/planning-dates'
import {
  createPlanningActivityId,
  normalizeActivities,
  normalizePlanningDayFormData,
  validatePlanningActivity,
  validatePlanningDay,
  type PlanningActivityFormErrors,
  type PlanningDayFormErrors,
} from '../utils/planning-validation'
import styles from './PlanningDayFormModal.module.css'

type PlanningDayFormModalProps = {
  date: string
  dayNumber?: number
  day?: PlanningDay
  places: Place[]
  placesStatus: 'loading' | 'ready' | 'error'
  onCancel: () => void
  onSave: (data: SavePlanningDayData) => Promise<void>
  onActivityAdded: () => void
}

function activityFromPlace(place: Place, order: number): PlanningActivity {
  return {
    id: createPlanningActivityId(),
    type: 'visit',
    title: place.name,
    relatedPlaceId: place.id,
    placeSnapshot: {
      name: place.name,
      category: place.category,
      priority: place.priority,
      contentStatus: place.contentStatus,
    },
    momentOfDay: '',
    startTime: '',
    endTime: '',
    estimatedDuration: place.estimatedDuration,
    imageUrl: place.imageUrl,
    address: place.address,
    mapsUrl: place.mapsUrl,
    description: place.description,
    notes: '',
    order,
  }
}

export function PlanningDayFormModal({
  date,
  dayNumber,
  day,
  places,
  placesStatus,
  onCancel,
  onSave,
  onActivityAdded,
}: PlanningDayFormModalProps) {
  const [values, setValues] = useState<PlanningDayFormData>(() =>
    day ? planningDayToFormData(day) : emptyPlanningDayFormData,
  )
  const [errors, setErrors] = useState<PlanningDayFormErrors>({})
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [savingStatus, setSavingStatus] = useState<TripContentStatus | null>(null)
  const [activityEditor, setActivityEditor] = useState<PlanningActivity | null>(null)
  const [activityErrors, setActivityErrors] = useState<PlanningActivityFormErrors>({})
  const [showPlacePicker, setShowPlacePicker] = useState(false)
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const activityTitleRef = useRef<HTMLInputElement>(null)
  const isSavingRef = useRef(false)
  const isSaving = savingStatus !== null

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    titleRef.current?.focus()

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !isSavingRef.current) {
        event.preventDefault()
        onCancel()
      }
    }
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [onCancel])

  useEffect(() => {
    if (activityEditor) activityTitleRef.current?.focus()
  }, [activityEditor])

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) return
    const elements = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href]',
    ))
    const first = elements[0]
    const last = elements.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const backdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isSavingRef.current) onCancel()
  }

  const updateField = <Field extends keyof PlanningDayFormData>(
    field: Field,
    value: PlanningDayFormData[Field],
  ) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }))
    setSubmissionError(null)
  }

  const openManualActivity = () => {
    setShowPlacePicker(false)
    setActivityErrors({})
    setActivityEditor({
      ...emptyPlanningActivity,
      id: createPlanningActivityId(),
      order: values.activities.length,
    })
  }

  const updateActivity = <Field extends keyof PlanningActivity>(
    field: Field,
    value: PlanningActivity[Field],
  ) => {
    setActivityEditor((current) => current ? { ...current, [field]: value } : null)
    setActivityErrors((current) => ({
      ...current,
      [field]: undefined,
      ...(field === 'startTime' || field === 'endTime' ? { time: undefined } : {}),
    }))
  }

  const saveActivity = () => {
    if (!activityEditor) return
    const nextErrors = validatePlanningActivity(activityEditor)
    if (Object.keys(nextErrors).length > 0) {
      setActivityErrors(nextErrors)
      return
    }

    const exists = values.activities.some((activity) => activity.id === activityEditor.id)
    const next = exists
      ? values.activities.map((activity) =>
          activity.id === activityEditor.id ? activityEditor : activity,
        )
      : [...values.activities, activityEditor]
    updateField('activities', normalizeActivities(next))
    setActivityEditor(null)
    if (!exists) onActivityAdded()
  }

  const addPlace = (place: Place) => {
    updateField(
      'activities',
      normalizeActivities([
        ...values.activities,
        activityFromPlace(place, values.activities.length),
      ]),
    )
    setShowPlacePicker(false)
    onActivityAdded()
  }

  const moveActivity = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= values.activities.length) return
    const next = [...values.activities]
    ;[next[index], next[target]] = [next[target], next[index]]
    updateField('activities', normalizeActivities(next))
  }

  const removeActivity = (id: string) => {
    updateField(
      'activities',
      normalizeActivities(values.activities.filter((activity) => activity.id !== id)),
    )
  }

  const save = async (contentStatus: TripContentStatus) => {
    if (isSavingRef.current) return
    const normalized = normalizePlanningDayFormData(values)
    const nextErrors = validatePlanningDay(normalized, contentStatus)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    isSavingRef.current = true
    setSavingStatus(contentStatus)
    setSubmissionError(null)
    try {
      await onSave({ ...normalized, contentStatus })
      onCancel()
    } catch (error) {
      isSavingRef.current = false
      setSavingStatus(null)
      setSubmissionError(
        error instanceof Error ? error.message : 'No se ha podido guardar el planning.',
      )
    }
  }

  const previewUrl = activityEditor?.imageUrl.trim() ?? ''
  const showPreview = previewUrl && failedImageUrl !== previewUrl

  return (
    <div className={styles.backdrop} onMouseDown={backdropMouseDown}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="planning-form-title"
        aria-describedby="planning-form-description"
        onKeyDown={trapFocus}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Planning diario</p>
            <h2 id="planning-form-title">
              {dayNumber ? `Día ${dayNumber} · ` : ''}{formatPlanningDate(date)}
            </h2>
            <p id="planning-form-description">
              Estado actual: {day ? tripContentStatusLabels[day.contentStatus] : 'Sin comenzar'}.
              Las horas son opcionales; el orden de las actividades es manual.
            </p>
          </div>
          <button className={styles.closeButton} type="button" aria-label="Cerrar formulario" disabled={isSaving} onClick={onCancel}>
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <form className={styles.form} noValidate onSubmit={(event) => event.preventDefault()}>
          {(errors.form || errors.activities || submissionError) && (
            <div className={styles.formError} role="alert">
              {errors.form ?? errors.activities ?? submissionError}
            </div>
          )}

          <div className={styles.fields}>
            <label className={styles.field}>
              <span>Título del día</span>
              <input
                ref={titleRef}
                value={values.title}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? 'planning-title-error' : undefined}
                disabled={isSaving}
                onChange={(event) => updateField('title', event.target.value)}
              />
              {errors.title && <small id="planning-title-error" className={styles.fieldError}>{errors.title}</small>}
            </label>

            <label className={styles.field}>
              <span>Descripción o resumen</span>
              <textarea rows={3} value={values.description} disabled={isSaving} onChange={(event) => updateField('description', event.target.value)} />
            </label>

            <label className={styles.field}>
              <span>Notas generales</span>
              <textarea rows={3} value={values.notes} disabled={isSaving} onChange={(event) => updateField('notes', event.target.value)} />
            </label>

            <section className={styles.activitiesSection} aria-labelledby="activities-editor-title">
              <div className={styles.sectionHeading}>
                <div>
                  <h3 id="activities-editor-title">Actividades</h3>
                  <p>{values.activities.length} {values.activities.length === 1 ? 'actividad' : 'actividades'}</p>
                </div>
                <div className={styles.addActions}>
                  <button type="button" disabled={isSaving} onClick={openManualActivity}>Añadir actividad manual</button>
                  <button type="button" disabled={isSaving} aria-expanded={showPlacePicker} onClick={() => {
                    setActivityEditor(null)
                    setShowPlacePicker((current) => !current)
                  }}>Añadir desde Qué se verá</button>
                </div>
              </div>

              {showPlacePicker && (
                <div className={styles.placePicker}>
                  <div className={styles.inlineHeading}>
                    <h4>Selecciona una ficha</h4>
                    <button type="button" onClick={() => setShowPlacePicker(false)}>Cerrar selector</button>
                  </div>
                  {placesStatus === 'loading' && <p role="status">Cargando lugares…</p>}
                  {placesStatus === 'error' && <p role="alert">No se han podido cargar los lugares.</p>}
                  {placesStatus === 'ready' && places.length === 0 && <p>Todavía no hay fichas en Qué se verá.</p>}
                  <div className={styles.placeList}>
                    {places.map((place) => (
                      <article key={place.id} className={styles.placeOption}>
                        {place.imageUrl && <img src={place.imageUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true }} />}
                        <div>
                          <h5>{place.name}</h5>
                          <p>
                            {place.category ? placeCategoryLabels[place.category] : 'Sin categoría'} · {tripContentStatusLabels[place.contentStatus]}
                            {place.priority ? ` · ${placePriorityLabels[place.priority]}` : ''}
                          </p>
                        </div>
                        <button type="button" onClick={() => addPlace(place)}>Añadir</button>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {activityEditor && (
                <div className={styles.activityEditor}>
                  <div className={styles.inlineHeading}>
                    <h4>{values.activities.some((item) => item.id === activityEditor.id) ? 'Editar actividad' : 'Nueva actividad'}</h4>
                    <button type="button" onClick={() => setActivityEditor(null)}>Cancelar edición</button>
                  </div>
                  {activityErrors.form && <p className={styles.formError} role="alert">{activityErrors.form}</p>}
                  <div className={styles.activityFields}>
                    <label className={styles.field}>
                      <span>Tipo de actividad</span>
                      <select value={activityEditor.type} onChange={(event) => updateActivity('type', event.target.value as PlanningActivity['type'])}>
                        <option value="">Sin determinar</option>
                        {planningActivityTypes.map((type) => <option key={type} value={type}>{planningActivityTypeLabels[type]}</option>)}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span>Título</span>
                      <input ref={activityTitleRef} value={activityEditor.title} aria-invalid={Boolean(activityErrors.title)} onChange={(event) => updateActivity('title', event.target.value)} />
                      {activityErrors.title && <small className={styles.fieldError}>{activityErrors.title}</small>}
                    </label>
                    <label className={styles.field}>
                      <span>Momento del día</span>
                      <select value={activityEditor.momentOfDay} onChange={(event) => updateActivity('momentOfDay', event.target.value as PlanningActivity['momentOfDay'])}>
                        <option value="">Sin determinar</option>
                        {planningMoments.map((moment) => <option key={moment} value={moment}>{planningMomentLabels[moment]}</option>)}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span>Hora de inicio</span>
                      <input type="time" value={activityEditor.startTime} aria-invalid={Boolean(activityErrors.time)} onChange={(event) => updateActivity('startTime', event.target.value)} />
                    </label>
                    <label className={styles.field}>
                      <span>Hora de finalización</span>
                      <input type="time" value={activityEditor.endTime} aria-invalid={Boolean(activityErrors.time)} onChange={(event) => updateActivity('endTime', event.target.value)} />
                      {activityErrors.time && <small className={styles.fieldError}>{activityErrors.time}</small>}
                    </label>
                    <label className={styles.field}>
                      <span>Duración estimada</span>
                      <input value={activityEditor.estimatedDuration} placeholder="Por ejemplo, 1 h" onChange={(event) => updateActivity('estimatedDuration', event.target.value)} />
                    </label>
                    <label className={`${styles.field} ${styles.fullField}`}>
                      <span>URL de imagen</span>
                      <input type="url" inputMode="url" value={activityEditor.imageUrl} aria-invalid={Boolean(activityErrors.imageUrl)} onChange={(event) => updateActivity('imageUrl', event.target.value)} />
                      {activityErrors.imageUrl && <small className={styles.fieldError}>{activityErrors.imageUrl}</small>}
                    </label>
                    {previewUrl && (
                      <div className={styles.preview} aria-live="polite">
                        {showPreview ? <img src={previewUrl} alt={`Vista previa de ${activityEditor.title || 'la actividad'}`} onError={() => setFailedImageUrl(previewUrl)} /> : <p>No se ha podido mostrar la imagen.</p>}
                      </div>
                    )}
                    <label className={`${styles.field} ${styles.fullField}`}><span>Dirección</span><input value={activityEditor.address} onChange={(event) => updateActivity('address', event.target.value)} /></label>
                    <label className={`${styles.field} ${styles.fullField}`}><span>Enlace de Google Maps</span><input type="url" inputMode="url" value={activityEditor.mapsUrl} aria-invalid={Boolean(activityErrors.mapsUrl)} onChange={(event) => updateActivity('mapsUrl', event.target.value)} />{activityErrors.mapsUrl && <small className={styles.fieldError}>{activityErrors.mapsUrl}</small>}</label>
                    <label className={`${styles.field} ${styles.fullField}`}><span>Descripción</span><textarea rows={3} value={activityEditor.description} onChange={(event) => updateActivity('description', event.target.value)} /></label>
                    <label className={`${styles.field} ${styles.fullField}`}><span>Notas</span><textarea rows={3} value={activityEditor.notes} onChange={(event) => updateActivity('notes', event.target.value)} /></label>
                  </div>
                  <button className={styles.saveActivityButton} type="button" onClick={saveActivity}>Guardar actividad</button>
                </div>
              )}

              {values.activities.length === 0 ? (
                <p className={styles.noActivities}>Todavía no se han añadido actividades.</p>
              ) : (
                <ol className={styles.activityList}>
                  {values.activities.map((activity, index) => (
                    <li key={activity.id}>
                      <div>
                        <strong>{activity.title}</strong>
                        <span>{activity.startTime || (activity.momentOfDay ? planningMomentLabels[activity.momentOfDay] : 'Sin horario')}</span>
                      </div>
                      <div className={styles.activityActions}>
                        <button type="button" aria-label={`Subir ${activity.title}`} disabled={index === 0 || isSaving} onClick={() => moveActivity(index, -1)}>↑</button>
                        <button type="button" aria-label={`Bajar ${activity.title}`} disabled={index === values.activities.length - 1 || isSaving} onClick={() => moveActivity(index, 1)}>↓</button>
                        <button type="button" disabled={isSaving} onClick={() => { setShowPlacePicker(false); setActivityErrors({}); setActivityEditor({ ...activity }) }}>Editar</button>
                        <button type="button" disabled={isSaving} onClick={() => removeActivity(activity.id)}>Eliminar</button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <footer className={styles.actions}>
            <button className={styles.cancelButton} type="button" disabled={isSaving} onClick={onCancel}>Cancelar</button>
            <button type="button" disabled={isSaving} onClick={() => void save('draft')}>{savingStatus === 'draft' ? 'Guardando…' : 'Guardar como Borrador'}</button>
            <button type="button" disabled={isSaving} onClick={() => void save('in_progress')}>{savingStatus === 'in_progress' ? 'Guardando…' : 'Guardar como En preparación'}</button>
            <button className={styles.completeButton} type="button" disabled={isSaving} onClick={() => void save('completed')}>{savingStatus === 'completed' ? 'Guardando…' : 'Marcar como Terminado'}</button>
          </footer>
        </form>
      </div>
    </div>
  )
}
