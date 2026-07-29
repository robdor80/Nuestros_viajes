import { useState } from 'react'

import { TripCard } from '../components/TripCard'
import type {
  BaseTrip,
  TripsLoadStatus,
} from '../model/trip'
import { classifyTrips } from '../utils/classify-trips'
import styles from './TripsPage.module.css'

type TripsPageProps = {
  activeTrip: BaseTrip | null
  trips: BaseTrip[]
  tripsStatus: TripsLoadStatus
  tripsError: string | null
  onOpenTrip: (trip: BaseTrip) => void
  onEditTrip: (trip: BaseTrip) => void
  onArchiveTrip: (trip: BaseTrip) => void
  onRestoreTrip: (trip: BaseTrip) => void
  onDeleteTrip: (trip: BaseTrip) => void
  onRetry: () => void
  actionsDisabledTripId: string | null
}

export function TripsPage({
  activeTrip,
  trips,
  tripsStatus,
  tripsError,
  onOpenTrip,
  onEditTrip,
  onArchiveTrip,
  onRestoreTrip,
  onDeleteTrip,
  onRetry,
  actionsDisabledTripId,
}: TripsPageProps) {
  const [activeView, setActiveView] = useState<'completed' | 'archived'>(
    'completed',
  )
  const { completedTrips, archivedTrips } = classifyTrips(trips)
  const visibleTrips =
    activeView === 'completed' ? completedTrips : archivedTrips
  const isArchivedView = activeView === 'archived'

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Mis viajes</p>
        <h1 className={styles.title}>
          {isArchivedView ? 'Viajes archivados.' : 'Viajes realizados.'}
        </h1>
        <p className={styles.description}>
          {isArchivedView
            ? 'Viajes retirados de Inicio que todavía puedes recuperar.'
            : 'La biblioteca de destinos que ya forman parte de nuestros recuerdos.'}
        </p>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Tipos de viaje">
        <button
          className={activeView === 'completed' ? styles.activeTab : ''}
          type="button"
          role="tab"
          id="completed-trips-tab"
          aria-controls="trips-panel"
          aria-selected={activeView === 'completed'}
          onClick={() => setActiveView('completed')}
        >
          Realizados
          <span>{completedTrips.length}</span>
        </button>
        <button
          className={activeView === 'archived' ? styles.activeTab : ''}
          type="button"
          role="tab"
          id="archived-trips-tab"
          aria-controls="trips-panel"
          aria-selected={activeView === 'archived'}
          onClick={() => setActiveView('archived')}
        >
          Archivados
          <span>{archivedTrips.length}</span>
        </button>
      </div>

      {tripsStatus === 'loading' && (
        <section className={styles.state} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <div>
            <h2>Cargando viajes…</h2>
            <p>Estamos recuperando los viajes guardados.</p>
          </div>
        </section>
      )}

      {tripsStatus === 'error' && (
        <section className={styles.state} role="alert">
          <div>
            <h2>No se han podido cargar los viajes.</h2>
            <p>{tripsError}</p>
          </div>
          <button type="button" onClick={onRetry}>
            Reintentar
          </button>
        </section>
      )}

      {tripsStatus === 'ready' && visibleTrips.length === 0 && (
        <section
          id="trips-panel"
          className={styles.emptyState}
          role="tabpanel"
          aria-labelledby={
            isArchivedView
              ? 'archived-trips-tab'
              : 'completed-trips-tab'
          }
        >
          <h2>
            {isArchivedView
              ? 'No hay viajes archivados.'
              : 'Aún no hay viajes realizados.'}
          </h2>
          {!isArchivedView && (
            <p>
              Cuando finalice el primero, aparecerá aquí para poder volver a
              abrirlo cuando lo necesitemos.
            </p>
          )}
        </section>
      )}

      {tripsStatus === 'ready' && visibleTrips.length > 0 && (
        <section
          id="trips-panel"
          className={styles.tripsGrid}
          role="tabpanel"
          aria-labelledby={
            isArchivedView
              ? 'archived-trips-tab'
              : 'completed-trips-tab'
          }
        >
          {visibleTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              isActive={trip.id === activeTrip?.id}
              contextLabel={
                isArchivedView ? 'Viaje archivado' : 'Viaje realizado'
              }
              onOpen={isArchivedView ? undefined : onOpenTrip}
              onEdit={onEditTrip}
              onArchive={
                isArchivedView ? undefined : onArchiveTrip
              }
              onRestore={
                isArchivedView ? onRestoreTrip : undefined
              }
              onDelete={onDeleteTrip}
              actionsDisabled={actionsDisabledTripId === trip.id}
            />
          ))}
        </section>
      )}
    </div>
  )
}
