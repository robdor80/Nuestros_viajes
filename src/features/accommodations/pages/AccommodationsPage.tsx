import { useCallback, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import type { TripNotificationData } from '../../trips/components/TripNotification'
import type { BaseTrip } from '../../trips/model/trip'
import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import { AccommodationCard } from '../components/AccommodationCard'
import { AccommodationFormModal } from '../components/AccommodationFormModal'
import { DeleteAccommodationDialog } from '../components/DeleteAccommodationDialog'
import { useAccommodations } from '../hooks/useAccommodations'
import {
  accommodationToFormData,
  type Accommodation,
  type SaveAccommodationData,
} from '../model/accommodation'
import {
  createAccommodation,
  deleteAccommodation,
  updateAccommodation,
} from '../services/accommodation-service'
import { validateAccommodation } from '../utils/accommodation-validation'
import styles from './AccommodationsPage.module.css'

type AccommodationsPageProps = {
  userId: string
  onNotify: (notification: TripNotificationData) => void
}

const createSuccessMessages: Record<TripContentStatus, string> = {
  draft: 'Borrador guardado.',
  in_progress: 'Alojamiento guardado en preparación.',
  completed: 'Alojamiento marcado como terminado.',
}

const statusChangeMessages: Record<TripContentStatus, string> = {
  draft: 'El alojamiento ha vuelto a Borrador.',
  in_progress: 'El alojamiento está En preparación.',
  completed: 'Alojamiento marcado como terminado.',
}

export function AccommodationsPage({
  userId,
  onNotify,
}: AccommodationsPageProps) {
  const trip = useOutletContext<BaseTrip>()
  const { accommodations, status, error, retry } = useAccommodations(trip.id)
  const [isCreating, setIsCreating] = useState(false)
  const [editingAccommodation, setEditingAccommodation] =
    useState<Accommodation | null>(null)
  const [accommodationToDelete, setAccommodationToDelete] =
    useState<Accommodation | null>(null)
  const [busyAccommodationId, setBusyAccommodationId] = useState<string | null>(
    null,
  )

  const completedAccommodations = useMemo(
    () =>
      accommodations.filter(
        (accommodation) => accommodation.contentStatus === 'completed',
      ),
    [accommodations],
  )
  const pendingAccommodations = useMemo(
    () =>
      accommodations.filter(
        (accommodation) => accommodation.contentStatus !== 'completed',
      ),
    [accommodations],
  )

  const closeForm = useCallback(() => {
    setIsCreating(false)
    setEditingAccommodation(null)
  }, [])

  const saveAccommodation = async (data: SaveAccommodationData) => {
    try {
      if (editingAccommodation) {
        await updateAccommodation(trip.id, editingAccommodation, data, userId)
        onNotify({ message: 'Cambios guardados.', tone: 'success' })
      } else {
        await createAccommodation(trip.id, data, userId)
        onNotify({
          message: createSuccessMessages[data.contentStatus],
          tone: 'success',
        })
      }
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'No se ha podido guardar el alojamiento. Inténtalo de nuevo.'
      onNotify({ message, tone: 'error' })
      throw saveError
    }
  }

  const changeStatus = async (
    accommodation: Accommodation,
    nextStatus: TripContentStatus,
  ) => {
    if (busyAccommodationId) return

    const data = accommodationToFormData(accommodation)
    const validationErrors = validateAccommodation(data, nextStatus)

    if (Object.keys(validationErrors).length > 0) {
      setEditingAccommodation(accommodation)
      onNotify({
        message: 'Completa los datos necesarios antes de cambiar el estado.',
        tone: 'error',
      })
      return
    }

    setBusyAccommodationId(accommodation.id)

    try {
      await updateAccommodation(
        trip.id,
        accommodation,
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
      setBusyAccommodationId(null)
    }
  }

  const confirmDelete = async () => {
    if (!accommodationToDelete) return

    try {
      await deleteAccommodation(trip.id, accommodationToDelete.id, userId)
      onNotify({ message: 'Alojamiento eliminado.', tone: 'success' })
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : 'No se ha podido eliminar el alojamiento. Inténtalo de nuevo.'
      onNotify({ message, tone: 'error' })
      throw deleteError
    }
  }

  const cardActions = {
    disabled: false,
    onEdit: setEditingAccommodation,
    onChangeStatus: (
      accommodation: Accommodation,
      nextStatus: TripContentStatus,
    ) => {
      void changeStatus(accommodation, nextStatus)
    },
    onDelete: setAccommodationToDelete,
  }

  return (
    <section aria-labelledby="accommodations-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Sección del viaje</p>
          <h2 id="accommodations-title">Alojamiento</h2>
          <p>Hoteles, apartamentos y datos útiles de las reservas.</p>
        </div>
        {status === 'ready' && accommodations.length > 0 && (
          <div className={styles.headerActions}>
            <span className={styles.total} aria-live="polite">
              {accommodations.length}{' '}
              {accommodations.length === 1 ? 'alojamiento' : 'alojamientos'}
            </span>
            <button type="button" onClick={() => setIsCreating(true)}>
              Añadir alojamiento
            </button>
          </div>
        )}
      </header>

      {status === 'loading' && (
        <div className={styles.state} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <div>
            <h3>Cargando alojamientos…</h3>
            <p>Estamos recuperando el contenido de esta sección.</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.state} role="alert">
          <div>
            <h3>No se han podido cargar los alojamientos.</h3>
            <p>{error}</p>
          </div>
          <button type="button" onClick={retry}>
            Reintentar
          </button>
        </div>
      )}

      {status === 'ready' && accommodations.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M4 11V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6" />
              <path d="M4 21v-8h16v8" />
              <path d="M4 15h16" />
              <path d="M8 11V9h3v2" />
              <path d="M13 11V9h3v2" />
            </svg>
          </div>
          <div>
            <h3>Todavía no habéis añadido ningún alojamiento.</h3>
            <p>
              Añade hoteles, apartamentos o casas donde os alojaréis durante
              el viaje.
            </p>
          </div>
          <button type="button" onClick={() => setIsCreating(true)}>
            Añadir el primer alojamiento
          </button>
        </div>
      )}

      {completedAccommodations.length > 0 && (
        <section
          className={styles.group}
          aria-labelledby="completed-accommodations-title"
        >
          <div className={styles.groupHeading}>
            <h3 id="completed-accommodations-title">Terminado</h3>
            <span>{completedAccommodations.length}</span>
          </div>
          <div className={styles.completedGrid}>
            {completedAccommodations.map((accommodation) => (
              <AccommodationCard
                key={accommodation.id}
                {...cardActions}
                accommodation={accommodation}
                disabled={busyAccommodationId === accommodation.id}
              />
            ))}
          </div>
        </section>
      )}

      {pendingAccommodations.length > 0 && (
        <section
          className={styles.group}
          aria-labelledby="pending-accommodations-title"
        >
          <div className={styles.groupHeading}>
            <h3 id="pending-accommodations-title">Pendiente de completar</h3>
            <span>{pendingAccommodations.length}</span>
          </div>
          <div className={styles.pendingGrid}>
            {pendingAccommodations.map((accommodation) => (
              <AccommodationCard
                key={accommodation.id}
                {...cardActions}
                accommodation={accommodation}
                disabled={busyAccommodationId === accommodation.id}
              />
            ))}
          </div>
        </section>
      )}

      {(isCreating || editingAccommodation) && (
        <AccommodationFormModal
          accommodation={editingAccommodation ?? undefined}
          onCancel={closeForm}
          onSave={saveAccommodation}
        />
      )}

      {accommodationToDelete && (
        <DeleteAccommodationDialog
          accommodation={accommodationToDelete}
          onCancel={() => setAccommodationToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </section>
  )
}
