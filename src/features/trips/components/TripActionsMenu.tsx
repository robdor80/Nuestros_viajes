import { useEffect, useRef, useState } from 'react'

import type { BaseTrip } from '../model/trip'
import styles from './TripActionsMenu.module.css'

type TripActionsMenuProps = {
  trip: BaseTrip
  disabled?: boolean
  onEdit: (trip: BaseTrip) => void
  onArchive?: (trip: BaseTrip) => void
  onRestore?: (trip: BaseTrip) => void
  onDelete: (trip: BaseTrip) => void
}

export function TripActionsMenu({
  trip,
  disabled = false,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: TripActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    const animationFrame = window.requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    })

    return () => {
      window.cancelAnimationFrame(animationFrame)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const runAction = (action: (selectedTrip: BaseTrip) => void) => {
    setIsOpen(false)
    action(trip)
  }

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${isOpen ? styles.rootOpen : ''}`}
    >
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-label={`Acciones de ${trip.name}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <span aria-hidden="true">⋯</span>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className={styles.menu}
          role="menu"
          aria-label={`Acciones de ${trip.name}`}
        >
          {onRestore && (
            <button
              type="button"
              role="menuitem"
              onClick={() => runAction(onRestore)}
            >
              Restaurar
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => runAction(onEdit)}
          >
            Editar
          </button>
          {onArchive && (
            <button
              type="button"
              role="menuitem"
              onClick={() => runAction(onArchive)}
            >
              Archivar
            </button>
          )}
          <button
            className={styles.destructiveAction}
            type="button"
            role="menuitem"
            onClick={() => runAction(onDelete)}
          >
            Eliminar definitivamente
          </button>
        </div>
      )}
    </div>
  )
}
