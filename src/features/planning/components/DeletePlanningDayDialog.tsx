import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'

import type { PlanningDay } from '../model/planning'
import { formatPlanningDate } from '../utils/planning-dates'
import styles from '../../places/components/DeletePlaceDialog.module.css'

type Props = {
  day: PlanningDay
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export function DeletePlanningDayDialog({ day, onCancel, onConfirm }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const deletingRef = useRef(false)

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelRef.current?.focus()
    const keyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !deletingRef.current) onCancel()
    }
    document.addEventListener('keydown', keyDown)
    return () => {
      document.removeEventListener('keydown', keyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [onCancel])

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) return
    const buttons = Array.from(dialogRef.current.querySelectorAll<HTMLButtonElement>('button:not([disabled])'))
    const first = buttons[0]
    const last = buttons.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  const confirm = async () => {
    if (deletingRef.current) return
    deletingRef.current = true
    setDeleting(true)
    setError(null)
    try {
      await onConfirm()
      onCancel()
    } catch (caught) {
      deletingRef.current = false
      setDeleting(false)
      setError(caught instanceof Error ? caught.message : 'No se ha podido eliminar el planning del día.')
    }
  }

  return (
    <div className={styles.backdrop} onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget && !deletingRef.current) onCancel()
    }}>
      <div ref={dialogRef} className={styles.dialog} role="alertdialog" aria-modal="true" aria-labelledby="delete-planning-title" aria-describedby="delete-planning-description" onKeyDown={trapFocus}>
        <p className={styles.eyebrow}>Planning diario</p>
        <h2 id="delete-planning-title">Eliminar planning del día</h2>
        <p id="delete-planning-description" className={styles.description}>
          Se eliminará únicamente el planning de {formatPlanningDate(day.date)}. El viaje, sus lugares y los demás días no se verán afectados.
        </p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}>
          <button ref={cancelRef} type="button" disabled={deleting} onClick={onCancel}>Cancelar</button>
          <button className={styles.deleteButton} type="button" disabled={deleting} onClick={() => void confirm()}>{deleting ? 'Eliminando…' : 'Eliminar planning'}</button>
        </div>
      </div>
    </div>
  )
}
