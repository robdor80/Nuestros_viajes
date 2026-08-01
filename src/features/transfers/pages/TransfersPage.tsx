import { useCallback, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import type { TripNotificationData } from '../../trips/components/TripNotification'
import type { BaseTrip } from '../../trips/model/trip'
import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import { DeleteTransferDialog } from '../components/DeleteTransferDialog'
import { TransferCard } from '../components/TransferCard'
import { TransferFormModal } from '../components/TransferFormModal'
import { useTransfers } from '../hooks/useTransfers'
import {
  transferDirectionActionLabels,
  transferDirections,
  transferToFormData,
  type SaveTransferData,
  type TransferDirection,
} from '../model/transfer'
import {
  createOrUpdateTransfer,
  deleteTransfer,
} from '../services/transfer-service'
import { validateTransfer } from '../utils/transfer-validation'
import styles from './TransfersPage.module.css'

type TransfersPageProps = {
  userId: string
  onNotify: (notification: TripNotificationData) => void
}

const saveSuccessMessages: Record<TripContentStatus, string> = {
  draft: 'Borrador de trayecto guardado.',
  in_progress: 'Trayecto guardado en preparación.',
  completed: 'Trayecto marcado como terminado.',
}

const statusChangeMessages: Record<TripContentStatus, string> = {
  draft: 'El trayecto ha vuelto a Borrador.',
  in_progress: 'El trayecto está En preparación.',
  completed: 'Trayecto marcado como terminado.',
}

export function TransfersPage({ userId, onNotify }: TransfersPageProps) {
  const trip = useOutletContext<BaseTrip>()
  const { transfers, status, error, retry } = useTransfers(trip.id)
  const [editingDirection, setEditingDirection] =
    useState<TransferDirection | null>(null)
  const [deletingDirection, setDeletingDirection] =
    useState<TransferDirection | null>(null)
  const [busyDirection, setBusyDirection] =
    useState<TransferDirection | null>(null)

  const transferCount = useMemo(
    () =>
      transferDirections.filter((direction) => transfers[direction] !== null)
        .length,
    [transfers],
  )
  const editingTransfer = editingDirection
    ? transfers[editingDirection] ?? undefined
    : undefined

  const closeForm = useCallback(() => {
    setEditingDirection(null)
  }, [])

  const saveTransfer = async (data: SaveTransferData) => {
    if (!editingDirection) return

    const currentTransfer = transfers[editingDirection]

    try {
      await createOrUpdateTransfer(
        trip.id,
        editingDirection,
        currentTransfer,
        data,
        userId,
      )
      onNotify({
        message: currentTransfer
          ? 'Cambios guardados.'
          : saveSuccessMessages[data.contentStatus],
        tone: 'success',
      })
    } catch (saveError) {
      onNotify({
        message:
          saveError instanceof Error
            ? saveError.message
            : 'No se ha podido guardar el trayecto. Inténtalo de nuevo.',
        tone: 'error',
      })
      throw saveError
    }
  }

  const changeStatus = async (
    direction: TransferDirection,
    nextStatus: TripContentStatus,
  ) => {
    const currentTransfer = transfers[direction]

    if (!currentTransfer || busyDirection) return

    const data = transferToFormData(currentTransfer)
    const validationErrors = validateTransfer(data, nextStatus)

    if (Object.keys(validationErrors).length > 0) {
      setEditingDirection(direction)
      onNotify({
        message: 'Completa los datos necesarios antes de cambiar el estado.',
        tone: 'error',
      })
      return
    }

    setBusyDirection(direction)

    try {
      await createOrUpdateTransfer(
        trip.id,
        direction,
        currentTransfer,
        { ...data, contentStatus: nextStatus },
        userId,
      )
      onNotify({
        message: statusChangeMessages[nextStatus],
        tone: 'success',
      })
    } catch (statusError) {
      onNotify({
        message:
          statusError instanceof Error
            ? statusError.message
            : 'No se ha podido cambiar el estado.',
        tone: 'error',
      })
    } finally {
      setBusyDirection(null)
    }
  }

  const confirmDelete = async () => {
    if (!deletingDirection) return

    const actionLabel = transferDirectionActionLabels[deletingDirection]

    try {
      await deleteTransfer(trip.id, deletingDirection, userId)
      onNotify({
        message: `Trayecto de ${actionLabel} eliminado.`,
        tone: 'success',
      })
      setDeletingDirection(null)
    } catch (deleteError) {
      onNotify({
        message:
          deleteError instanceof Error
            ? deleteError.message
            : 'No se ha podido eliminar el trayecto. Inténtalo de nuevo.',
        tone: 'error',
      })
      throw deleteError
    }
  }

  return (
    <section aria-labelledby="transfers-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Sección del viaje</p>
          <h2 id="transfers-title">Trayectos</h2>
          <p>
            Prepara la ruta de ida y la ruta de vuelta con paradas, tiempos y
            enlaces de Google Maps.
          </p>
        </div>
        {status === 'ready' && (
          <span className={styles.total} aria-live="polite">
            {transferCount} de 2 trayectos preparados
          </span>
        )}
      </header>

      {status === 'loading' && (
        <div className={styles.state} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <div>
            <h3>Cargando trayectos…</h3>
            <p>Estamos recuperando la ida y la vuelta de este viaje.</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.state} role="alert">
          <div>
            <h3>No se han podido cargar los trayectos.</h3>
            <p>{error}</p>
          </div>
          <button type="button" onClick={retry}>
            Reintentar
          </button>
        </div>
      )}

      {status === 'ready' && (
        <div className={styles.grid}>
          {transferDirections.map((direction) => (
            <TransferCard
              key={direction}
              direction={direction}
              transfer={transfers[direction]}
              disabled={busyDirection === direction}
              onPrepare={setEditingDirection}
              onEdit={setEditingDirection}
              onChangeStatus={(currentDirection, nextStatus) => {
                void changeStatus(currentDirection, nextStatus)
              }}
              onDelete={setDeletingDirection}
            />
          ))}
        </div>
      )}

      {editingDirection && (
        <TransferFormModal
          direction={editingDirection}
          transfer={editingTransfer}
          onCancel={closeForm}
          onSave={saveTransfer}
        />
      )}

      {deletingDirection && (
        <DeleteTransferDialog
          direction={deletingDirection}
          onCancel={() => setDeletingDirection(null)}
          onConfirm={confirmDelete}
        />
      )}
    </section>
  )
}
