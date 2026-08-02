import { useCallback, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import type { TripNotificationData } from '../../trips/components/TripNotification'
import type { BaseTrip } from '../../trips/model/trip'
import { DeleteRestaurantDialog } from '../components/DeleteRestaurantDialog'
import { RestaurantCard } from '../components/RestaurantCard'
import { RestaurantFormModal } from '../components/RestaurantFormModal'
import { useRestaurants } from '../hooks/useRestaurants'
import {
  restaurantToFormData,
  type Restaurant,
  type RestaurantStatus,
  type SaveRestaurantData,
} from '../model/restaurant'
import {
  createRestaurant,
  deleteRestaurant,
  updateRestaurant,
} from '../services/restaurant-service'
import {
  matchesRestaurantSearch,
  sortRestaurants,
} from '../utils/restaurant-presentation'
import { validateRestaurant } from '../utils/restaurant-validation'
import styles from './RestaurantsPage.module.css'

type RestaurantsPageProps = {
  userId: string
  onNotify: (notification: TripNotificationData) => void
}

type RestaurantFilter = 'all' | RestaurantStatus

const filterOptions: Array<{
  value: RestaurantFilter
  label: string
}> = [
  { value: 'all', label: 'Todos' },
  { value: 'option', label: 'Opciones' },
  { value: 'chosen', label: 'Elegidos' },
  { value: 'reserved', label: 'Reservados' },
  { value: 'visited', label: 'Visitados' },
  { value: 'discarded', label: 'Descartados' },
]

const createSuccessMessages: Record<TripContentStatus, string> = {
  draft: 'Borrador guardado.',
  in_progress: 'Restaurante guardado en preparación.',
  completed: 'Restaurante marcado como terminado.',
}

const statusChangeMessages: Record<TripContentStatus, string> = {
  draft: 'El restaurante ha vuelto a Borrador.',
  in_progress: 'El restaurante está En preparación.',
  completed: 'Restaurante marcado como terminado.',
}

export function RestaurantsPage({ userId, onNotify }: RestaurantsPageProps) {
  const trip = useOutletContext<BaseTrip>()
  const { restaurants, status, error, retry } = useRestaurants(trip.id)
  const [isCreating, setIsCreating] = useState(false)
  const [editingRestaurant, setEditingRestaurant] =
    useState<Restaurant | null>(null)
  const [restaurantToDelete, setRestaurantToDelete] =
    useState<Restaurant | null>(null)
  const [busyRestaurantId, setBusyRestaurantId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<RestaurantFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRestaurants = useMemo(() => {
    const byFilter =
      activeFilter === 'all'
        ? restaurants
        : restaurants.filter(
            (restaurant) => restaurant.restaurantStatus === activeFilter,
          )

    return sortRestaurants(
      byFilter.filter((restaurant) =>
        matchesRestaurantSearch(restaurant, searchQuery),
      ),
    )
  }, [activeFilter, restaurants, searchQuery])

  const summary = useMemo(() => {
    const reserved = restaurants.filter(
      (restaurant) => restaurant.restaurantStatus === 'reserved',
    ).length
    const chosen = restaurants.filter(
      (restaurant) => restaurant.restaurantStatus === 'chosen',
    ).length

    return [reserved > 0 && `${reserved} reservado${reserved === 1 ? '' : 's'}`, chosen > 0 && `${chosen} elegido${chosen === 1 ? '' : 's'}`]
      .filter(Boolean)
      .join(' · ')
  }, [restaurants])

  const closeForm = useCallback(() => {
    setIsCreating(false)
    setEditingRestaurant(null)
  }, [])

  const saveRestaurant = async (data: SaveRestaurantData) => {
    try {
      if (editingRestaurant) {
        await updateRestaurant(trip.id, editingRestaurant, data, userId)
        onNotify({ message: 'Cambios guardados.', tone: 'success' })
      } else {
        await createRestaurant(trip.id, data, userId)
        onNotify({
          message: createSuccessMessages[data.contentStatus],
          tone: 'success',
        })
      }
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'No se ha podido guardar el restaurante. Inténtalo de nuevo.'
      onNotify({ message, tone: 'error' })
      throw saveError
    }
  }

  const changeStatus = async (
    restaurant: Restaurant,
    nextStatus: TripContentStatus,
  ) => {
    if (busyRestaurantId) return

    const data = restaurantToFormData(restaurant)
    const validationErrors = validateRestaurant(data, nextStatus)

    if (Object.keys(validationErrors).length > 0) {
      setEditingRestaurant(restaurant)
      onNotify({
        message: 'Completa los datos necesarios antes de cambiar el estado.',
        tone: 'error',
      })
      return
    }

    setBusyRestaurantId(restaurant.id)

    try {
      await updateRestaurant(
        trip.id,
        restaurant,
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
      setBusyRestaurantId(null)
    }
  }

  const confirmDelete = async () => {
    if (!restaurantToDelete) return

    try {
      await deleteRestaurant(trip.id, restaurantToDelete.id, userId)
      onNotify({ message: 'Restaurante eliminado.', tone: 'success' })
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : 'No se ha podido eliminar el restaurante. Inténtalo de nuevo.'
      onNotify({ message, tone: 'error' })
      throw deleteError
    }
  }

  const cardActions = {
    onEdit: setEditingRestaurant,
    onChangeStatus: (
      restaurant: Restaurant,
      nextStatus: TripContentStatus,
    ) => {
      void changeStatus(restaurant, nextStatus)
    },
    onDelete: setRestaurantToDelete,
  }

  return (
    <section aria-labelledby="restaurants-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Sección del viaje</p>
          <h2 id="restaurants-title">Restaurantes</h2>
          <p>Opciones, elegidos, reservas y notas de restaurantes.</p>
        </div>
        {status === 'ready' && restaurants.length > 0 && (
          <div className={styles.headerActions}>
            <span className={styles.total} aria-live="polite">
              {restaurants.length}{' '}
              {restaurants.length === 1 ? 'restaurante' : 'restaurantes'}
              {summary && ` · ${summary}`}
            </span>
            <button type="button" onClick={() => setIsCreating(true)}>
              Añadir restaurante
            </button>
          </div>
        )}
      </header>

      {status === 'loading' && (
        <div className={styles.state} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <div>
            <h3>Cargando restaurantes…</h3>
            <p>Estamos recuperando el contenido de esta sección.</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.state} role="alert">
          <div>
            <h3>No se han podido cargar los restaurantes.</h3>
            <p>{error}</p>
          </div>
          <button type="button" onClick={retry}>
            Reintentar
          </button>
        </div>
      )}

      {status === 'ready' && restaurants.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M4 3v8a3 3 0 0 0 6 0V3" />
              <path d="M7 3v18" />
              <path d="M17 3v18" />
              <path d="M14 3h3a3 3 0 0 1 3 3v5h-6" />
            </svg>
          </div>
          <div>
            <h3>Todavía no habéis añadido restaurantes.</h3>
            <p>
              Guardad opciones, reservas y sitios visitados para tenerlo todo a
              mano durante el viaje.
            </p>
          </div>
          <button type="button" onClick={() => setIsCreating(true)}>
            Añadir restaurante
          </button>
        </div>
      )}

      {status === 'ready' && restaurants.length > 0 && (
        <>
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <span>Buscar restaurante</span>
              <input
                value={searchQuery}
                placeholder="Nombre, zona, cocina…"
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            <div className={styles.filters} aria-label="Filtrar restaurantes">
              {filterOptions.map((filterOption) => (
                <button
                  key={filterOption.value}
                  type="button"
                  aria-pressed={activeFilter === filterOption.value}
                  onClick={() => setActiveFilter(filterOption.value)}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>

          {filteredRestaurants.length === 0 ? (
            <div className={styles.state} role="status" aria-live="polite">
              <div>
                <h3>No hay restaurantes con esos filtros.</h3>
                <p>Prueba a cambiar la búsqueda o el estado seleccionado.</p>
              </div>
            </div>
          ) : (
            <div className={styles.grid}>
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  {...cardActions}
                  restaurant={restaurant}
                  disabled={busyRestaurantId === restaurant.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      {(isCreating || editingRestaurant) && (
        <RestaurantFormModal
          trip={trip}
          restaurant={editingRestaurant ?? undefined}
          onCancel={closeForm}
          onSave={saveRestaurant}
        />
      )}

      {restaurantToDelete && (
        <DeleteRestaurantDialog
          restaurant={restaurantToDelete}
          onCancel={() => setRestaurantToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </section>
  )
}
