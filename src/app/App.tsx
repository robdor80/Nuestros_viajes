import { useCallback, useEffect, useState } from 'react'
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
import { SettingsPage } from '../features/settings/pages/SettingsPage'
import { NewTripModal } from '../features/trips/components/NewTripModal'
import type {
  BaseTrip,
  CreateTripData,
  TripsLoadStatus,
} from '../features/trips/model/trip'
import { TripsPage } from '../features/trips/pages/TripsPage'
import {
  createTrip as persistTrip,
  subscribeToTrips,
} from '../features/trips/services/trip-service'
import { AppLayout } from './layouts/AppLayout'

type ModalNavigationState = {
  backgroundLocation?: Location
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
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const navigationState = location.state as ModalNavigationState | null
  const backgroundLocation = navigationState?.backgroundLocation
  const isNewTripRoute = location.pathname === '/nuevo-viaje'
  const contentLocation =
    isNewTripRoute && !backgroundLocation
      ? { ...location, pathname: '/', state: null }
      : (backgroundLocation ?? location)

  const handleTripsUpdate = useCallback((savedTrips: BaseTrip[]) => {
    setTrips(savedTrips)
    setActiveTrip((currentTrip) => {
      if (!currentTrip) {
        return savedTrips[0] ?? null
      }

      return (
        savedTrips.find((trip) => trip.id === currentTrip.id) ??
        savedTrips[0] ??
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
    async (tripData: CreateTripData) => {
      const savedTrip = await persistTrip(
        tripData,
        userId,
        trips.map((trip) => trip.color),
      )

      setTrips((currentTrips) => [
        savedTrip,
        ...currentTrips.filter((trip) => trip.id !== savedTrip.id),
      ])
      setTripsStatus('ready')
      setTripsError(null)
      setActiveTrip(savedTrip)
      setConfirmation(
        `El viaje “${savedTrip.name}” se ha creado correctamente.`,
      )
      void navigate('/', { replace: true })
    },
    [navigate, trips, userId],
  )

  const dismissConfirmation = useCallback(() => {
    setConfirmation(null)
  }, [])

  const openTrip = useCallback(
    (trip: BaseTrip) => {
      setActiveTrip(trip)
      void navigate('/')
    },
    [navigate],
  )

  useEffect(() => {
    if (!confirmation) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setConfirmation(null)
    }, 4_000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [confirmation])

  return (
    <AppLayout accountControls={<AuthUserMenu />}>
      <Routes location={contentLocation}>
        <Route
          path="/"
          element={
            <HomePage
              activeTrip={activeTrip}
              trips={trips}
              tripsStatus={tripsStatus}
              tripsError={tripsError}
              confirmation={confirmation}
              onDismissConfirmation={dismissConfirmation}
              onOpenTrip={openTrip}
              onRetryTrips={retryTrips}
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
              onRetry={retryTrips}
            />
          }
        />
        <Route path="/ajustes" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {isNewTripRoute && (
        <NewTripModal
          onCancel={closeNewTripModal}
          onCreate={createTrip}
        />
      )}
    </AppLayout>
  )
}
