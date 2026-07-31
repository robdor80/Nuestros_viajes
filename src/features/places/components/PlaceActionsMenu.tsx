import { useEffect, useRef, useState } from 'react'

import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import type { Place } from '../model/place'
import styles from './PlaceActionsMenu.module.css'

type PlaceActionsMenuProps = {
  place: Place
  disabled?: boolean
  onEdit: (place: Place) => void
  onChangeStatus: (place: Place, status: TripContentStatus) => void
  onDelete: (place: Place) => void
}

const statusActions: Array<{
  status: TripContentStatus
  label: string
}> = [
  { status: 'draft', label: 'Guardar como Borrador' },
  { status: 'in_progress', label: 'Guardar En preparación' },
  { status: 'completed', label: 'Marcar como Terminado' },
]

export function PlaceActionsMenu({
  place,
  disabled = false,
  onEdit,
  onChangeStatus,
  onDelete,
}: PlaceActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showStatusActions, setShowStatusActions] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const closeMenu = () => {
    setIsOpen(false)
    setShowStatusActions(false)
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        closeMenu()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
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

  const closeAndRun = (action: () => void) => {
    closeMenu()
    action()
  }

  const changeStatus = (status: TripContentStatus) => {
    closeAndRun(() => onChangeStatus(place, status))
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
        aria-label={`Acciones de ${place.name}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => {
          if (isOpen) {
            closeMenu()
          } else {
            setIsOpen(true)
          }
        }}
      >
        <span aria-hidden="true">⋯</span>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className={styles.menu}
          role="menu"
          aria-label={`Acciones de ${place.name}`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => closeAndRun(() => onEdit(place))}
          >
            Editar
          </button>

          {place.contentStatus === 'completed' ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => changeStatus('in_progress')}
            >
              Volver a En preparación
            </button>
          ) : (
            <>
              <button
                type="button"
                role="menuitem"
                aria-expanded={showStatusActions}
                onClick={() =>
                  setShowStatusActions((currentValue) => !currentValue)
                }
              >
                Cambiar estado
                <span aria-hidden="true">
                  {showStatusActions ? '−' : '+'}
                </span>
              </button>
              {showStatusActions && (
                <div className={styles.statusActions} role="group">
                  {statusActions
                    .filter(({ status }) => status !== place.contentStatus)
                    .map(({ status, label }) => (
                      <button
                        key={status}
                        type="button"
                        role="menuitem"
                        onClick={() => changeStatus(status)}
                      >
                        {label}
                      </button>
                    ))}
                </div>
              )}
            </>
          )}

          <button
            className={styles.destructiveAction}
            type="button"
            role="menuitem"
            onClick={() => closeAndRun(() => onDelete(place))}
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  )
}
