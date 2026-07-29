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
import type { BaseTrip } from '../features/trips/model/trip'
import { TripsPage } from '../features/trips/pages/TripsPage'
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

  if (status === 'authorized') {
    return <AuthenticatedApplication />
  }

  return null
}

function AuthenticatedApplication() {
  const [activeTrip, setActiveTrip] = useState<BaseTrip | null>(null)
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

  const closeNewTripModal = useCallback(() => {
    if (backgroundLocation) {
      void navigate(-1)
      return
    }

    void navigate('/', { replace: true })
  }, [backgroundLocation, navigate])

  const createTrip = useCallback(
    (trip: BaseTrip) => {
      setActiveTrip(trip)
      setConfirmation(`El viaje “${trip.name}” se ha creado correctamente.`)
      void navigate('/', { replace: true })
    },
    [navigate],
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
              confirmation={confirmation}
              onDismissConfirmation={dismissConfirmation}
            />
          }
        />
        <Route
          path="/mis-viajes"
          element={
            <TripsPage activeTrip={activeTrip} onOpenTrip={openTrip} />
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
