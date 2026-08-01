import { PlaceStatusBadge } from '../../places/components/PlaceStatusBadge'
import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import {
  transferDirectionActionLabels,
  transferDirectionLabels,
  type Transfer,
  type TransferDirection,
  type TransferStop,
} from '../model/transfer'
import {
  buildGoogleMapsEmbedDirectionsUrl,
  buildGoogleMapsDirectionsUrl,
  isValidMapsEmbedUrl,
} from '../utils/transfer-maps'
import { TransferActionsMenu } from './TransferActionsMenu'
import styles from './TransferCard.module.css'

type TransferCardProps = {
  direction: TransferDirection
  transfer: Transfer | null
  disabled?: boolean
  onPrepare: (direction: TransferDirection) => void
  onEdit: (direction: TransferDirection) => void
  onChangeStatus: (
    direction: TransferDirection,
    status: TripContentStatus,
  ) => void
  onDelete: (direction: TransferDirection) => void
}

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function formatDate(date: string) {
  if (!date) return ''

  const parsedDate = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsedDate.getTime())) return date

  return dateFormatter.format(parsedDate)
}

function hasValue(value: string) {
  return value.trim().length > 0
}

function isUsefulAmount(value: string) {
  const normalizedValue = value.replace(',', '.').trim()
  const numericValue = Number(normalizedValue)

  return Number.isFinite(numericValue)
    ? numericValue > 0
    : normalizedValue.length > 0
}

function formatBoolean(value: boolean | null) {
  if (value === null) return ''

  return value ? 'Sí' : 'No'
}

function getStopLabel(stop: TransferStop) {
  return stop.description || stop.location
}

function getMapsUrl(transfer: Transfer) {
  return (
    transfer.mapsUrl ||
    buildGoogleMapsDirectionsUrl({
      date: transfer.date,
      origin: transfer.origin,
      destination: transfer.destination,
      viaMotorway: transfer.viaMotorway,
      hasTolls: transfer.hasTolls,
      estimatedTollCost: transfer.estimatedTollCost,
      estimatedDuration: transfer.estimatedDuration,
      distanceKm: transfer.distanceKm,
      plannedStops: transfer.plannedStops,
      notes: transfer.notes,
      mapsUrl: transfer.mapsUrl,
      mapsEmbedUrl: transfer.mapsEmbedUrl,
    })
  )
}

function getTransferFormValues(transfer: Transfer) {
  return {
    date: transfer.date,
    origin: transfer.origin,
    destination: transfer.destination,
    viaMotorway: transfer.viaMotorway,
    hasTolls: transfer.hasTolls,
    estimatedTollCost: transfer.estimatedTollCost,
    estimatedDuration: transfer.estimatedDuration,
    distanceKm: transfer.distanceKm,
    plannedStops: transfer.plannedStops,
    notes: transfer.notes,
    mapsUrl: transfer.mapsUrl,
    mapsEmbedUrl: transfer.mapsEmbedUrl,
  }
}

function getMapsEmbedUrl(transfer: Transfer) {
  if (isValidMapsEmbedUrl(transfer.mapsEmbedUrl)) {
    return transfer.mapsEmbedUrl
  }

  return buildGoogleMapsEmbedDirectionsUrl(
    getTransferFormValues(transfer),
    import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY ?? '',
  )
}

export function TransferCard({
  direction,
  transfer,
  disabled = false,
  onPrepare,
  onEdit,
  onChangeStatus,
  onDelete,
}: TransferCardProps) {
  const label = transferDirectionLabels[direction]
  const actionLabel = transferDirectionActionLabels[direction]

  if (!transfer) {
    return (
      <article className={`${styles.card} ${styles.emptyCard}`}>
        <div className={styles.topRow}>
          <p className={styles.direction}>{label}</p>
          <span className={styles.notStartedBadge}>Sin comenzar</span>
        </div>
        <div className={styles.emptyBody}>
          <h3>Trayecto de {actionLabel}</h3>
          <p>
            Prepara la salida, llegada, paradas y enlace de Google Maps para
            este tramo del viaje.
          </p>
          <button
            className={styles.primaryAction}
            type="button"
            disabled={disabled}
            onClick={() => onPrepare(direction)}
          >
            Preparar {actionLabel}
          </button>
        </div>
      </article>
    )
  }

  const isCompleted = transfer.contentStatus === 'completed'
  const mapsUrl = getMapsUrl(transfer)
  const mapsEmbedUrl = getMapsEmbedUrl(transfer)
  const hasEmbed = isValidMapsEmbedUrl(mapsEmbedUrl)
  const stops = transfer.plannedStops
  const usefulFacts = [
    hasValue(transfer.date) && ['Fecha', formatDate(transfer.date)],
    hasValue(transfer.origin) && ['Salida', transfer.origin],
    hasValue(transfer.destination) && ['Llegada', transfer.destination],
    hasValue(transfer.estimatedDuration) && [
      'Duración estimada',
      transfer.estimatedDuration,
    ],
    hasValue(transfer.distanceKm) && ['Distancia', transfer.distanceKm],
    isUsefulAmount(transfer.estimatedTollCost) && [
      'Peajes estimados',
      transfer.estimatedTollCost,
    ],
    transfer.viaMotorway !== null && [
      'Por autopista',
      formatBoolean(transfer.viaMotorway),
    ],
    transfer.hasTolls !== null && ['Tiene peajes', formatBoolean(transfer.hasTolls)],
  ].filter((fact): fact is string[] => Boolean(fact))

  return (
    <article
      className={`${styles.card} ${isCompleted ? styles.completedCard : ''}`}
    >
      <div className={styles.body}>
        <div className={styles.topRow}>
          <div className={styles.badges}>
            <p className={styles.direction}>{label}</p>
            <PlaceStatusBadge status={transfer.contentStatus} />
          </div>
          <TransferActionsMenu
            direction={direction}
            transfer={transfer}
            disabled={disabled}
            onEdit={onEdit}
            onChangeStatus={onChangeStatus}
            onDelete={onDelete}
          />
        </div>

        <div className={styles.heading}>
          <h3>
            {hasValue(transfer.origin) && hasValue(transfer.destination)
              ? `${transfer.origin} → ${transfer.destination}`
              : `Trayecto de ${actionLabel}`}
          </h3>
          {!isCompleted && stops.length > 0 && (
            <p>
              {stops.length} {stops.length === 1 ? 'parada' : 'paradas'}{' '}
              planificadas
            </p>
          )}
        </div>

        {usefulFacts.length > 0 && (
          <dl className={styles.facts}>
            {usefulFacts.map(([term, description]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        )}

        {isCompleted && (
          <>
            <MapPanel
              direction={direction}
              transfer={transfer}
              mapsEmbedUrl={hasEmbed ? mapsEmbedUrl : ''}
            />
            {stops.length > 0 && <StopsList stops={stops} />}
            {hasValue(transfer.notes) && (
              <section className={styles.notes}>
                <h4>Notas</h4>
                <p>{transfer.notes}</p>
              </section>
            )}
            {mapsUrl && (
              <div className={styles.links}>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                  Abrir en Google Maps
                </a>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                  Consultar ruta y tráfico actual
                </a>
              </div>
            )}
          </>
        )}

        {!isCompleted && (
          <button
            className={styles.primaryAction}
            type="button"
            disabled={disabled}
            onClick={() => onEdit(direction)}
          >
            {transfer.contentStatus === 'draft' ? 'Completar' : 'Continuar'}
          </button>
        )}
      </div>
    </article>
  )
}

type MapPanelProps = {
  direction: TransferDirection
  transfer: Transfer
  mapsEmbedUrl: string
}

function MapPanel({
  direction,
  transfer,
  mapsEmbedUrl,
}: MapPanelProps) {
  const actionLabel = transferDirectionActionLabels[direction]

  return (
    <div className={styles.mapFallback}>
      <p className={styles.mapEyebrow}>Ruta de {actionLabel}</p>
      <ol>
        {hasValue(transfer.origin) && <li>{transfer.origin}</li>}
        {transfer.plannedStops.map((stop) => (
          <li key={stop.id}>{getStopLabel(stop)}</li>
        ))}
        {hasValue(transfer.destination) && <li>{transfer.destination}</li>}
      </ol>
      {mapsEmbedUrl && (
        <div className={styles.embeddedMap}>
          <iframe
            title={`Ruta de ${actionLabel} en Google Maps`}
            src={mapsEmbedUrl}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      )}
    </div>
  )
}

type StopsListProps = {
  stops: TransferStop[]
}

function StopsList({ stops }: StopsListProps) {
  return (
    <section className={styles.stops}>
      <h4>Paradas previstas</h4>
      <ol>
        {stops.map((stop) => (
          <li key={stop.id}>
            <span>{getStopLabel(stop)}</span>
            {hasValue(stop.description) && hasValue(stop.location) && (
              <small>{stop.location}</small>
            )}
            {hasValue(stop.notes) && <p>{stop.notes}</p>}
          </li>
        ))}
      </ol>
    </section>
  )
}
