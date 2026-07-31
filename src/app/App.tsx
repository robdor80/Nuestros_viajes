import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  type Location,
} from 'react-router-dom'

import { AccessStatusPage } from '../features/auth/components/AccessStatusPage'
import { AuthUserMenu } from '../features/auth/components/AuthUserMenu'
import { PrivateAccessPage } from '../features/auth/components/PrivateAccessPage'
import { useAuth } from '../features/auth/hooks/useAuth'
import { HomePage } from '../features/home/pages/HomePage'
import { PlacesPage } from '../features/places/pages/PlacesPage'
import { SettingsPage } from '../features/settings/pages/SettingsPage'
import { TripSectionPage } from '../features/trip-workspace/pages/TripSectionPage'
import { TripWorkspaceOverviewPage } from '../features/trip-workspace/pages/TripWorkspaceOverviewPage'
import { TripWorkspacePage } from '../features/trip-workspace/pages/TripWorkspacePage'
import { TripActionDialog } from '../features/trips/components/TripActionDialog'
import { TripFormModal } from '../features/trips/components/TripFormModal'
import {
  TripNotification,
  type TripNotificationData,
} from '../features/trips/components/TripNotification'
import type {
  BaseTrip,
  CreateTripData,
  TripFormData,
  TripsLoadStatus,
} from '../features/trips/model/trip'
import { TripsPage } from '../features/trips/pages/TripsPage'
import {
  archiveTrip as persistArchiveTrip,
  createTrip as persistTrip,
  deleteTrip as persistDeleteTrip,
  restoreTrip as persistRestoreTrip,
  subscribeToTrips,
  updateTrip as persistTripChanges,
} from '../features/trips/services/trip-service'
import { AppLayout } from './layouts/AppLayout'

type ModalNavigationState = {
  backgroundLocation?: Location
}

type TripActionDialogState = {
  action: 'archive' | 'delete'
  trip: BaseTrip
}

export function App() {
  const { user, status } = useAuth()

  if (status === 'loading') {
    return (
      <AppLayout showNavigation={false}>
        <PrivateAccessPage isLoading />
      </AppLayout>
    )
  }

  if (status === 'signedOut') {
    return (
      <AppLayout showNavigation={false}>
        <PrivateAccessPage />
      </AppLayout>
    )
  }

  if (status === 'checkingAccess' || status === 'unauthorized') {
    return (
      <AppLayout showNavigation={false}>
        <AccessStatusPage status={status} />
      </AppLayout>
    )
  }

  if (status === 'error') {
    return (
      <AppLayout showNavigation={false}>
        {user ? (
          <AccessStatusPage status="error" />
        ) : (
          <PrivateAccessPage />
        )}
      </AppLayout>
    )
  }

  if (status === 'authorized' && user) {
    return <AuthenticatedApplication userId={user.uid} />
  }

  return null
}

type AuthenticatedApplicationProps = {
  userId: string
}

function AuthenticatedApplication({
  userId,
}: AuthenticatedApplicationProps) {
  const [trips, setTrips] = useState<BaseTrip[]>([])
  const [activeTrip, setActiveTrip] = useState<BaseTrip | null>(null)
  const [tripsStatus, setTripsStatus] =
    useState<TripsLoadStatus>('loading')
  const [tripsError, setTripsError] = useState<string | null>(null)
  const [subscriptionVersion, setSubscriptionVersion] = useState(0)
  const [notification, setNotification] =
    useState<TripNotificationData | null>(null)
  const [editingTrip, setEditingTrip] = useState<BaseTrip | null>(null)
  const [actionDialog, setActionDialog] =
    useState<TripActionDialogState | null>(null)
  const [actionsDisabledTripId, setActionsDisabledTripId] =
    useState<string | null>(null)
  const actionInProgressRef = useRef(false)
  const location = useLocation()
  const navigate = useNavigate()
  const navigationState = location.state as ModalNavigationState | null
  const backgroundLocation = navigationState?.backgroundLocation
  const isNewTripRoute = location.pathname === '/nuevo-viaje'
  const contentLocation =
    isNewTripRoute && !backgroundLocation
      ? { ...location, pathname: '/', state: null }
      : (backgroundLocation ?? location)
  const isTripWorkspaceRoute = location.pathname.startsWith('/viajes/')

  const handleTripsUpdate = useCallback((savedTrips: BaseTrip[]) => {
    setTrips(savedTrips)
    setActiveTrip((currentTrip) => {
      const availableTrips = savedTrips.filter(
        (trip) => trip.status !== 'archived',
      )

      if (!currentTrip || currentTrip.status === 'archived') {
        return availableTrips[0] ?? null
      }

      return (
        availableTrips.find((trip) => trip.id === currentTrip.id) ??
        availableTrips[0] ??
        null
      )
    })
    setTripsError(null)
    setTripsStatus('ready')
  }, [])

  const handleTripsError = useCallback((error: Error) => {
    setTripsError(error.message)
    setTripsStatus('error')
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToTrips(
      handleTripsUpdate,
      handleTripsError,
    )

    return unsubscribe
  }, [
    handleTripsError,
    handleTripsUpdate,
    subscriptionVersion,
    userId,
  ])

  const retryTrips = useCallback(() => {
    setTripsStatus('loading')
    setTripsError(null)
    setSubscriptionVersion((currentVersion) => currentVersion + 1)
  }, [])

  const closeNewTripModal = useCallback(() => {
    if (backgroundLocation) {
      void navigate(-1)
      return
    }

    void navigate('/', { replace: true })
  }, [backgroundLocation, navigate])

  const createTrip = useCallback(
    async (tripData: TripFormData) => {
      const createData: CreateTripData = {
        name: tripData.name,
        destination: tripData.destination,
        country: tripData.country,
        description: tripData.description,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        participants: tripData.participants,
        transport: tripData.transport,
        currency: tripData.currency,
        status: tripData.status,
        color: tripData.color,
        enabledSections: tripData.enabledSections,
      }
      const savedTrip = await persistTrip(createData, userId)

      setTrips((currentTrips) => [
        savedTrip,
        ...currentTrips.filter((trip) => trip.id !== savedTrip.id),
      ])
      setTripsStatus('ready')
      setTripsError(null)
      setActiveTrip(savedTrip)
      setNotification({
        message: `El viaje “${savedTrip.name}” se ha creado correctamente.`,
        tone: 'success',
      })
      void navigate('/', { replace: true })
    },
    [navigate, userId],
  )

  const dismissNotification = useCallback(() => {
    setNotification(null)
  }, [])

  const editTrip = useCallback((trip: BaseTrip) => {
    setEditingTrip(trip)
  }, [])

  const saveTripChanges = useCallback(
    async (tripData: TripFormData) => {
      if (!editingTrip) {
        throw new Error('El viaje que intentas editar ya no está disponible.')
      }

      await persistTripChanges(editingTrip.id, tripData, userId)
      setEditingTrip(null)
      setNotification({
        message: 'Viaje actualizado correctamente.',
        tone: 'success',
      })
    },
    [editingTrip, userId],
  )

  const requestArchiveTrip = useCallback((trip: BaseTrip) => {
    setActionDialog({ action: 'archive', trip })
  }, [])

  const requestDeleteTrip = useCallback((trip: BaseTrip) => {
    setActionDialog({ action: 'delete', trip })
  }, [])

  const restoreTrip = useCallback(
    async (trip: BaseTrip) => {
      if (actionInProgressRef.current) {
        return
      }

      actionInProgressRef.current = true
      setActionsDisabledTripId(trip.id)

      try {
        await persistRestoreTrip(trip, userId)
        setNotification({
          message: 'Viaje restaurado.',
          tone: 'success',
        })
      } catch (error) {
        setNotification({
          message:
            error instanceof Error
              ? error.message
              : 'No se ha podido restaurar el viaje.',
          tone: 'error',
        })
      } finally {
        actionInProgressRef.current = false
        setActionsDisabledTripId(null)
      }
    },
    [userId],
  )

  const confirmTripAction = useCallback(async () => {
    if (!actionDialog || actionInProgressRef.current) {
      return
    }

    const { action, trip } = actionDialog
    actionInProgressRef.current = true
    setActionsDisabledTripId(trip.id)

    try {
      if (action === 'archive') {
        await persistArchiveTrip(trip, userId)
        setNotification({
          message: 'Viaje archivado.',
          tone: 'success',
        })
      } else {
        await persistDeleteTrip(trip.id, userId)
        setActiveTrip((currentTrip) =>
          currentTrip?.id === trip.id ? null : currentTrip,
        )
        setEditingTrip((currentTrip) =>
          currentTrip?.id === trip.id ? null : currentTrip,
        )
        setNotification({
          message: 'Viaje eliminado definitivamente.',
          tone: 'success',
        })
      }

      setActionDialog(null)
    } catch (error) {
      setNotification({
        message:
          error instanceof Error
            ? error.message
            : 'No se ha podido completar la acción.',
        tone: 'error',
      })
      throw error
    } finally {
      actionInProgressRef.current = false
      setActionsDisabledTripId(null)
    }
  }, [actionDialog, userId])

  const openTrip = useCallback(
    (trip: BaseTrip) => {
      void navigate(`/viajes/${encodeURIComponent(trip.id)}`)
    },
    [navigate],
  )

  const closeEditTrip = useCallback(() => {
    setEditingTrip(null)
  }, [])

  const closeActionDialog = useCallback(() => {
    setActionDialog(null)
  }, [])

  useEffect(() => {
    if (!notification) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setNotification(null)
    }, 4_000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [notification])

  return (
    <AppLayout
      accountControls={<AuthUserMenu />}
      showHeader={!isTripWorkspaceRoute}
      showNavigation={!isTripWorkspaceRoute}
    >
      <Routes location={contentLocation}>
        <Route
          path="/"
          element={
            <HomePage
              activeTrip={activeTrip}
              trips={trips}
              tripsStatus={tripsStatus}
              tripsError={tripsError}
              onOpenTrip={openTrip}
              onEditTrip={editTrip}
              onArchiveTrip={requestArchiveTrip}
              onDeleteTrip={requestDeleteTrip}
              onRetryTrips={retryTrips}
              actionsDisabledTripId={actionsDisabledTripId}
            />
          }
        />
        <Route
          path="/mis-viajes"
          element={
            <TripsPage
              activeTrip={activeTrip}
              trips={trips}
              tripsStatus={tripsStatus}
              tripsError={tripsError}
              onOpenTrip={openTrip}
              onEditTrip={editTrip}
              onArchiveTrip={requestArchiveTrip}
              onRestoreTrip={(trip) => void restoreTrip(trip)}
              onDeleteTrip={requestDeleteTrip}
              onRetry={retryTrips}
              actionsDisabledTripId={actionsDisabledTripId}
            />
          }
        />
        <Route
          path="/viajes/:tripId"
          element={
            <TripWorkspacePage
              trips={trips}
              tripsStatus={tripsStatus}
              tripsError={tripsError}
              onRetry={retryTrips}
            />
          }
        >
          <Route index element={<TripWorkspaceOverviewPage />} />
          <Route
            path="que-ver"
            element={
              <PlacesPage userId={userId} onNotify={setNotification} />
            }
          />
          <Route
            path="planning"
            element={<TripSectionPage sectionId="planning" />}
          />
          <Route
            path="alojamiento"
            element={<TripSectionPage sectionId="accommodation" />}
          />
          <Route
            path="presupuesto"
            element={<TripSectionPage sectionId="budget" />}
          />
          <Route
            path="restaurantes"
            element={<TripSectionPage sectionId="restaurants" />}
          />
          <Route
            path="trayectos"
            element={<TripSectionPage sectionId="transfers" />}
          />
          <Route
            path="datos"
            element={<TripSectionPage sectionId="useful-data" />}
          />
        </Route>
        <Route path="/ajustes" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {notification && (
        <TripNotification
          notification={notification}
          onDismiss={dismissNotification}
        />
      )}

      {isNewTripRoute && (
        <TripFormModal
          mode="create"
          onCancel={closeNewTripModal}
          onSave={createTrip}
        />
      )}

      {editingTrip && (
        <TripFormModal
          mode="edit"
          trip={editingTrip}
          onCancel={closeEditTrip}
          onSave={saveTripChanges}
        />
      )}

      {actionDialog && (
        <TripActionDialog
          action={actionDialog.action}
          trip={actionDialog.trip}
          onCancel={closeActionDialog}
          onConfirm={confirmTripAction}
        />
      )}
    </AppLayout>
  )
}
