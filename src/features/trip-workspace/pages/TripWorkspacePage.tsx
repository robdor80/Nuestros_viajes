import { useState, type CSSProperties } from 'react'
import { Outlet, useLocation, useParams } from 'react-router-dom'

import { TripSectionNavigation } from '../components/TripSectionNavigation'
import { TripWorkspaceHeader } from '../components/TripWorkspaceHeader'
import { TripPrintDialog } from '../components/TripPrintDialog'
import { TripWorkspaceState } from '../components/TripWorkspaceState'
import type {
  BaseTrip,
  TripsLoadStatus,
} from '../../trips/model/trip'
import styles from './TripWorkspacePage.module.css'

type TripWorkspacePageProps = {
  trips: BaseTrip[]
  tripsStatus: TripsLoadStatus
  tripsError: string | null
  onRetry: () => void
  onEditSections: (trip: BaseTrip) => void
}

type TripWorkspaceStyle = CSSProperties & {
  '--trip-color': string
}

export function TripWorkspacePage({
  trips,
  tripsStatus,
  tripsError,
  onRetry,
  onEditSections,
}: TripWorkspacePageProps) {
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const { tripId } = useParams()
  const location = useLocation()
  const isPhotoUploadRoute = location.pathname.endsWith('/fotos/subir')

  if (tripsStatus === 'loading') {
    return (
      <div className={styles.statePage}>
        <TripWorkspaceState state="loading" />
      </div>
    )
  }

  if (tripsStatus === 'error') {
    return (
      <div className={styles.statePage}>
        <TripWorkspaceState
          state="error"
          message={tripsError ?? 'No se han podido cargar los viajes.'}
          onRetry={onRetry}
        />
      </div>
    )
  }

  const trip = tripId
    ? trips.find((candidate) => candidate.id === tripId)
    : undefined

  if (!trip || !tripId) {
    return (
      <div className={styles.statePage}>
        <TripWorkspaceState state="not-found" />
      </div>
    )
  }

  return (
    <div
      className={`${styles.workspace} ${
        isPhotoUploadRoute ? styles.photoUploadWorkspace : ''
      }`}
      data-print-active={isPrintDialogOpen ? 'true' : undefined}
      style={{ '--trip-color': trip.color } as TripWorkspaceStyle}
    >
      {!isPhotoUploadRoute && (
        <TripWorkspaceHeader
          trip={trip}
          onPrint={() => setIsPrintDialogOpen(true)}
          onEditSections={() => onEditSections(trip)}
        />
      )}
      <TripSectionNavigation tripId={tripId} />
      <div className={styles.content}>
        <Outlet context={trip} />
      </div>
      {isPrintDialogOpen && (
        <TripPrintDialog
          trip={trip}
          onClose={() => setIsPrintDialogOpen(false)}
        />
      )}
    </div>
  )
}
