import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

import type { PhotoReviewDraft } from '../model/photo-review'
import type { SelectedPhoto } from '../model/selected-photo'
import { describePhotoReviewStatus } from '../utils/photo-review'
import styles from './PhotoReviewEditor.module.css'

type TripDayOption = {
  dayNumber: number
  date: string
  label: string
}

type PhotoReviewEditorProps = {
  photo: SelectedPhoto
  initialDraft: PhotoReviewDraft
  tripDayOptions: TripDayOption[]
  onCancel: () => void
  onSave: (draft: PhotoReviewDraft) => void
}

const DESCRIPTION_MAX_LENGTH = 280
const TITLE_MAX_LENGTH = 120

export function PhotoReviewEditor({
  photo,
  initialDraft,
  tripDayOptions,
  onCancel,
  onSave,
}: PhotoReviewEditorProps) {
  const titleId = useId()
  const photoTitleId = useId()
  const descriptionId = useId()
  const firstButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const analyzedDate = photo.analysis.metadata?.date.localDate ?? null
  const analyzedTime = photo.analysis.metadata?.date.localTime ?? null
  const [draft, setDraft] = useState<PhotoReviewDraft>(initialDraft)
  const status = describePhotoReviewStatus({ photo, review: undefined })
  const isDateMissing = draft.dateMode !== 'without-date' && !draft.localDate

  useEffect(() => {
    firstButtonRef.current?.focus()
  }, [])

  const updateDraft = (nextDraft: Partial<PhotoReviewDraft>) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ...nextDraft,
      isConfirmed: false,
    }))
  }

  const selectAnalyzedDate = () => {
    updateDraft({
      dateMode: 'analyzed',
      localDate: analyzedDate,
      localTime: analyzedTime,
      tripDayMode: 'analyzed',
    })
  }

  const selectManualDate = () => {
    updateDraft({
      dateMode: 'manual',
      localDate: draft.localDate ?? analyzedDate ?? '',
      localTime: draft.localTime,
      tripDayMode:
        draft.tripDayMode === 'manual' ? draft.tripDayMode : 'analyzed',
    })
  }

  const selectWithoutDate = () => {
    updateDraft({
      dateMode: 'without-date',
      localDate: null,
      localTime: null,
      tripDayMode: 'unassigned',
      tripDayNumber: null,
      isConfirmed: true,
    })
  }

  const handleTripDayChange = (value: string) => {
    if (value === 'unassigned') {
      updateDraft({
        tripDayMode: 'unassigned',
        tripDayNumber: null,
      })
      return
    }

    updateDraft({
      tripDayMode: 'manual',
      tripDayNumber: Number(value),
    })
  }

  const saveDraft = () => {
    if (isDateMissing) return

    onSave({
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      isConfirmed: true,
    })
  }

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
      return
    }

    if (event.key !== 'Tab' || !dialogRef.current) return

    const focusableElements = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.offsetParent !== null)
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

  return (
    <div className={styles.backdrop}>
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
          <button
            ref={firstButtonRef}
            className={styles.closeButton}
            type="button"
            onClick={onCancel}
          >
            ← Volver
          </button>
          <div>
            <p className={styles.eyebrow}>Revisión individual</p>
            <h3 id={titleId}>Completar fotografía</h3>
            <p id={descriptionId}>{status}</p>
          </div>
        </header>

        <div className={styles.preview}>
          {photo.previewStatus === 'ready' ? (
            <img src={photo.objectUrl} alt="" />
          ) : (
            <div className={styles.previewFallback}>Vista previa no disponible</div>
          )}
        </div>

        <div className={styles.form}>
          <fieldset className={styles.fieldset}>
            <legend>Fecha</legend>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="photo-review-date-mode"
                checked={draft.dateMode === 'analyzed'}
                disabled={!analyzedDate}
                onChange={selectAnalyzedDate}
              />
              Mantener la fecha analizada
            </label>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="photo-review-date-mode"
                checked={draft.dateMode === 'manual'}
                onChange={selectManualDate}
              />
              Usar fecha manual
            </label>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="photo-review-date-mode"
                checked={draft.dateMode === 'without-date'}
                onChange={selectWithoutDate}
              />
              Mantener esta fotografía sin fecha
            </label>
          </fieldset>

          {draft.dateMode !== 'without-date' && (
            <div className={styles.formGrid}>
              <label>
                Fecha
                <input
              type="date"
                  value={draft.localDate ?? ''}
                  required
                  onChange={(event) =>
                    updateDraft({
                      dateMode: 'manual',
                      localDate: event.target.value || null,
                      tripDayMode:
                        draft.tripDayMode === 'manual' ? 'manual' : 'analyzed',
                    })
                  }
                />
              </label>
              <label>
                Hora opcional
                <input
                  type="time"
                  value={draft.localTime ?? ''}
                  onChange={(event) =>
                    updateDraft({
                      localTime: event.target.value || null,
                    })
                  }
                />
              </label>
            </div>
          )}

          <label>
            Día del viaje
            <select
              value={draft.tripDayNumber ?? 'unassigned'}
              onChange={(event) => handleTripDayChange(event.target.value)}
            >
              <option value="unassigned">Sin asignar</option>
              {tripDayOptions.map((option) => (
                <option key={option.dayNumber} value={option.dayNumber}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Nombre de la fotografía
            <input
              id={photoTitleId}
              type="text"
              value={draft.title}
              maxLength={TITLE_MAX_LENGTH}
              autoCapitalize="sentences"
              onChange={(event) =>
                updateDraft({
                  title: event.target.value,
                })
              }
            />
            <span className={styles.characterCount}>
              {draft.title.length}/{TITLE_MAX_LENGTH}
            </span>
          </label>

          <label>
            Descripción opcional
            <textarea
              value={draft.description}
              maxLength={DESCRIPTION_MAX_LENGTH}
              rows={4}
              onChange={(event) =>
                updateDraft({
                  description: event.target.value,
                })
              }
            />
            <span className={styles.characterCount}>
              {draft.description.length}/{DESCRIPTION_MAX_LENGTH}
            </span>
          </label>
          {isDateMissing && (
            <p className={styles.validationMessage} role="alert">
              Elige una fecha o marca explícitamente que esta fotografía se
              queda sin fecha.
            </p>
          )}
        </div>

        <footer className={styles.actions}>
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className={styles.primaryButton}
            type="button"
            disabled={isDateMissing}
            onClick={saveDraft}
          >
            Guardar revisión
          </button>
        </footer>
      </div>
    </div>
  )
}
