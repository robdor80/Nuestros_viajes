import { useEffect, useRef, useState } from 'react'

import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import {
  transferDirectionLabels,
  type Transfer,
  type TransferDirection,
} from '../model/transfer'
import styles from './TransferActionsMenu.module.css'

type TransferActionsMenuProps = {
  direction: TransferDirection
  transfer: Transfer
  disabled?: boolean
  onEdit: (direction: TransferDirection) => void
  onChangeStatus: (
    direction: TransferDirection,
    status: TripContentStatus,
  ) => void
  onDelete: (direction: TransferDirection) => void
}

const statusActions: Array<{
  status: TripContentStatus
  label: string
}> = [
  { status: 'draft', label: 'Guardar como Borrador' },
  { status: 'in_progress', label: 'Guardar En preparación' },
  { status: 'completed', label: 'Marcar como Terminado' },
]

export function TransferActionsMenu({
  direction,
  transfer,
  disabled = false,
  onEdit,
  onChangeStatus,
  onDelete,
}: TransferActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showStatusActions, setShowStatusActions] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const label = transferDirectionLabels[direction]

  const closeMenu = () => {
    setIsOpen(false)
    setShowStatusActions(false)
  }

  useEffect(() => {
    if (!isOpen) return

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
    closeAndRun(() => onChangeStatus(direction, status))
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
        aria-label={`Acciones de trayecto ${label}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => (isOpen ? closeMenu() : setIsOpen(true))}
      >
        <span aria-hidden="true">⋯</span>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className={styles.menu}
          role="menu"
          aria-label={`Acciones de trayecto ${label}`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => closeAndRun(() => onEdit(direction))}
          >
            Editar
          </button>

          {transfer.contentStatus === 'completed' ? (
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
                    .filter(
                      ({ status }) => status !== transfer.contentStatus,
                    )
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
            onClick={() => closeAndRun(() => onDelete(direction))}
          >
            Eliminar trayecto
          </button>
        </div>
      )}
    </div>
  )
}
