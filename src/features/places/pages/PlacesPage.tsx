import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import type { TripNotificationData } from '../../trips/components/TripNotification'
import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import { CompletedPlaceCard } from '../components/CompletedPlaceCard'
import { DeletePlaceDialog } from '../components/DeletePlaceDialog'
import { PendingPlaceCard } from '../components/PendingPlaceCard'
import { PlaceFormModal } from '../components/PlaceFormModal'
import { usePlaces } from '../hooks/usePlaces'
import {
  placeToFormData,
  type Place,
  type SavePlaceData,
} from '../model/place'
import {
  createPlace,
  deletePlace,
  updatePlace,
} from '../services/place-service'
import { validatePlace } from '../utils/place-validation'
import styles from './PlacesPage.module.css'

type PlacesPageProps = {
  userId: string
  onNotify: (notification: TripNotificationData) => void
}

const createSuccessMessages: Record<TripContentStatus, string> = {
  draft: 'Borrador guardado.',
  in_progress: 'Lugar guardado en preparación.',
  completed: 'Lugar marcado como terminado.',
}

const statusChangeMessages: Record<TripContentStatus, string> = {
  draft: 'El lugar ha vuelto a Borrador.',
  in_progress: 'El lugar está En preparación.',
  completed: 'Lugar marcado como terminado.',
}

export function PlacesPage({ userId, onNotify }: PlacesPageProps) {
  const { tripId = '' } = useParams()
  const { places, status, error, retry } = usePlaces(tripId)
  const [isCreating, setIsCreating] = useState(false)
  const [editingPlace, setEditingPlace] = useState<Place | null>(null)
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null)
  const [busyPlaceId, setBusyPlaceId] = useState<string | null>(null)

  const completedPlaces = useMemo(
    () => places.filter((place) => place.contentStatus === 'completed'),
    [places],
  )
  const pendingPlaces = useMemo(
    () => places.filter((place) => place.contentStatus !== 'completed'),
    [places],
  )

  const closeForm = useCallback(() => {
    setIsCreating(false)
    setEditingPlace(null)
  }, [])

  const savePlace = async (data: SavePlaceData) => {
    try {
      if (editingPlace) {
        await updatePlace(tripId, editingPlace, data, userId)
        onNotify({ message: 'Cambios guardados.', tone: 'success' })
      } else {
        await createPlace(tripId, data, userId)
        onNotify({
          message: createSuccessMessages[data.contentStatus],
          tone: 'success',
        })
      }
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'No se ha podido guardar el lugar. Inténtalo de nuevo.'
      onNotify({ message, tone: 'error' })
      throw saveError
    }
  }

  const changeStatus = async (
    place: Place,
    nextStatus: TripContentStatus,
  ) => {
    if (busyPlaceId) return

    const data = placeToFormData(place)
    const validationErrors = validatePlace(data, nextStatus)

    if (Object.keys(validationErrors).length > 0) {
      setEditingPlace(place)
      onNotify({
        message: 'Completa los datos necesarios antes de cambiar el estado.',
        tone: 'error',
      })
      return
    }

    setBusyPlaceId(place.id)

    try {
      await updatePlace(
        tripId,
        place,
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
      setBusyPlaceId(null)
    }
  }

  const confirmDelete = async () => {
    if (!placeToDelete) return

    try {
      await deletePlace(tripId, placeToDelete.id, userId)
      onNotify({ message: 'Lugar eliminado.', tone: 'success' })
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : 'No se ha podido eliminar el lugar. Inténtalo de nuevo.'
      onNotify({ message, tone: 'error' })
      throw deleteError
    }
  }

  const cardActions = {
    disabled: false,
    onEdit: setEditingPlace,
    onChangeStatus: (place: Place, nextStatus: TripContentStatus) => {
      void changeStatus(place, nextStatus)
    },
    onDelete: setPlaceToDelete,
  }

  return (
    <section aria-labelledby="places-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Sección del viaje</p>
          <h2 id="places-title">Qué se verá</h2>
          <p>
            Lugares, monumentos y actividades que queremos conocer.
          </p>
        </div>
        {status === 'ready' && places.length > 0 && (
          <div className={styles.headerActions}>
            <span className={styles.total} aria-live="polite">
              {places.length} {places.length === 1 ? 'ficha' : 'fichas'}
            </span>
            <button type="button" onClick={() => setIsCreating(true)}>
              Añadir lugar
            </button>
          </div>
        )}
      </header>

      {status === 'loading' && (
        <div className={styles.state} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <div>
            <h3>Cargando lugares…</h3>
            <p>Estamos recuperando el contenido de esta sección.</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.state} role="alert">
          <div>
            <h3>No se han podido cargar los lugares.</h3>
            <p>{error}</p>
          </div>
          <button type="button" onClick={retry}>
            Reintentar
          </button>
        </div>
      )}

      {status === 'ready' && places.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          </div>
          <div>
            <h3>Todavía no habéis añadido ningún lugar.</h3>
            <p>
              Añade monumentos, lugares o actividades que queráis conocer
              durante el viaje.
            </p>
          </div>
          <button type="button" onClick={() => setIsCreating(true)}>
            Añadir el primer lugar
          </button>
        </div>
      )}

      {completedPlaces.length > 0 && (
        <section className={styles.group} aria-labelledby="completed-places-title">
          <div className={styles.groupHeading}>
            <h3 id="completed-places-title">Terminado</h3>
            <span>{completedPlaces.length}</span>
          </div>
          <div className={styles.completedGrid}>
            {completedPlaces.map((place) => (
              <CompletedPlaceCard
                key={place.id}
                {...cardActions}
                place={place}
                disabled={busyPlaceId === place.id}
              />
            ))}
          </div>
        </section>
      )}

      {pendingPlaces.length > 0 && (
        <section className={styles.group} aria-labelledby="pending-places-title">
          <div className={styles.groupHeading}>
            <h3 id="pending-places-title">Pendiente de completar</h3>
            <span>{pendingPlaces.length}</span>
          </div>
          <div className={styles.pendingGrid}>
            {pendingPlaces.map((place) => (
              <PendingPlaceCard
                key={place.id}
                {...cardActions}
                place={place}
                disabled={busyPlaceId === place.id}
              />
            ))}
          </div>
        </section>
      )}

      {(isCreating || editingPlace) && (
        <PlaceFormModal
          place={editingPlace ?? undefined}
          onCancel={closeForm}
          onSave={savePlace}
        />
      )}

      {placeToDelete && (
        <DeletePlaceDialog
          place={placeToDelete}
          onCancel={() => setPlaceToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </section>
  )
}
