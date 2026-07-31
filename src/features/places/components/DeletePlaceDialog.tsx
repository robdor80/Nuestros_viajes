import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'

import type { Place } from '../model/place'
import styles from './DeletePlaceDialog.module.css'

type DeletePlaceDialogProps = {
  place: Place
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export function DeletePlaceDialog({
  place,
  onCancel,
  onConfirm,
}: DeletePlaceDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const isDeletingRef = useRef(false)

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement as HTMLElement | null
    const previousBodyOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    cancelButtonRef.current?.focus()

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeletingRef.current) {
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
      dialogRef.current.querySelectorAll<HTMLButtonElement>(
        'button:not([disabled])',
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
    if (event.target === event.currentTarget && !isDeletingRef.current) {
      onCancel()
    }
  }

  const confirmDelete = async () => {
    if (isDeletingRef.current) return

    isDeletingRef.current = true
    setIsDeleting(true)
    setError(null)

    try {
      await onConfirm()
      onCancel()
    } catch (deleteError) {
      isDeletingRef.current = false
      setIsDeleting(false)
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No se ha podido eliminar el lugar. Inténtalo de nuevo.',
      )
    }
  }

  return (
    <div className={styles.backdrop} onMouseDown={handleBackdropMouseDown}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-place-title"
        aria-describedby="delete-place-description"
        onKeyDown={trapFocus}
      >
        <p className={styles.eyebrow}>Qué se verá</p>
        <h2 id="delete-place-title">Eliminar lugar</h2>
        <p id="delete-place-description" className={styles.description}>
          Se eliminará «{place.name}» de este viaje. El resto de lugares y el
          viaje no se verán afectados.
        </p>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button
            ref={cancelButtonRef}
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className={styles.deleteButton}
            type="button"
            disabled={isDeleting}
            onClick={() => void confirmDelete()}
          >
            {isDeleting ? 'Eliminando…' : 'Eliminar lugar'}
          </button>
        </div>
      </div>
    </div>
  )
}
