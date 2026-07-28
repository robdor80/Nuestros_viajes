import { useCallback, useState } from 'react'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  type Location,
} from 'react-router-dom'

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

  return (
    <AppLayout>
      <Routes location={contentLocation}>
        <Route
          path="/"
          element={
            <HomePage activeTrip={activeTrip} confirmation={confirmation} />
          }
        />
        <Route
          path="/mis-viajes"
          element={<TripsPage activeTrip={activeTrip} />}
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
