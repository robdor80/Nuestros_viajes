import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'

import type { BaseTrip } from '../model/trip'
import styles from './TripActionDialog.module.css'

type TripActionDialogProps = {
  action: 'archive' | 'delete'
  trip: BaseTrip
  onCancel: () => void
  onConfirm: () => Promise<void>
}

function normalizeConfirmation(value: string) {
  return value.trim().toLocaleLowerCase('es-ES')
}

export function TripActionDialog({
  action,
  trip,
  onCancel,
  onConfirm,
}: TripActionDialogProps) {
  const [confirmationName, setConfirmationName] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const confirmationInputRef = useRef<HTMLInputElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const isDelete = action === 'delete'
  const isNameConfirmed =
    normalizeConfirmation(confirmationName) ===
    normalizeConfirmation(trip.name)

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement as HTMLElement | null
    const previousBodyOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    if (isDelete) {
      confirmationInputRef.current?.focus()
    } else {
      cancelButtonRef.current?.focus()
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !isProcessing) {
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
  }, [isDelete, isProcessing, onCancel])

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) {
      return
    }

    const focusableElements = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
    if (event.target === event.currentTarget && !isProcessing) {
      onCancel()
    }
  }

  const confirmAction = async () => {
    if (isProcessing || (isDelete && !isNameConfirmed)) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      await onConfirm()
    } catch (operationError) {
      setError(
        operationError instanceof Error
          ? operationError.message
          : isDelete
            ? 'No se ha podido eliminar el viaje. Inténtalo de nuevo.'
            : 'No se ha podido archivar el viaje. Inténtalo de nuevo.',
      )
      setIsProcessing(false)
    }
  }

  const titleId = `trip-${action}-title`
  const descriptionId = `trip-${action}-description`

  return (
    <div
      className={styles.backdrop}
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={trapFocus}
      >
        <header>
          <p className={styles.eyebrow}>Gestión del viaje</p>
          <h2 id={titleId}>
            {isDelete
              ? 'Eliminar viaje definitivamente'
              : 'Archivar viaje'}
          </h2>
        </header>

        <div id={descriptionId} className={styles.content}>
          {isDelete ? (
            <>
              <p>
                Esta acción eliminará el viaje de Firebase y no se puede
                deshacer.
              </p>
              <p>
                Si contiene lugares u otra información interior, la
                eliminación se bloqueará para evitar dejar datos huérfanos.
              </p>
              <label className={styles.confirmationField}>
                <span>
                  Escribe <strong>«{trip.name}»</strong> para confirmar.
                </span>
                <input
                  ref={confirmationInputRef}
                  value={confirmationName}
                  autoComplete="off"
                  disabled={isProcessing}
                  onChange={(event) => {
                    setConfirmationName(event.target.value)
                    setError(null)
                  }}
                />
              </label>
            </>
          ) : (
            <p>
              Este viaje dejará de aparecer en Inicio y en el calendario.
              Podrás recuperarlo desde Mis viajes &gt; Archivados.
            </p>
          )}
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <footer className={styles.actions}>
          <button
            ref={cancelButtonRef}
            className={styles.cancelButton}
            type="button"
            disabled={isProcessing}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className={
              isDelete ? styles.deleteButton : styles.archiveButton
            }
            type="button"
            disabled={
              isProcessing || (isDelete && !isNameConfirmed)
            }
            onClick={() => void confirmAction()}
          >
            {isProcessing
              ? isDelete
                ? 'Eliminando…'
                : 'Archivando…'
              : isDelete
                ? 'Eliminar definitivamente'
                : 'Archivar viaje'}
          </button>
        </footer>
      </div>
    </div>
  )
}
