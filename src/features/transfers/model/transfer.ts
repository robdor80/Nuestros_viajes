import type { TripContentStatus } from '../../trip-workspace/model/trip-content'

export const transferDirections = ['outbound', 'return'] as const

export type TransferDirection = (typeof transferDirections)[number]

export const transferDirectionLabels: Record<TransferDirection, string> = {
  outbound: 'IDA',
  return: 'VUELTA',
}

export const transferDirectionActionLabels: Record<TransferDirection, string> = {
  outbound: 'ida',
  return: 'vuelta',
}

export type TransferStop = {
  id: string
  description: string
  location: string
  notes: string
  order: number
}

export type Transfer = {
  id: TransferDirection
  direction: TransferDirection
  date: string
  origin: string
  destination: string
  viaMotorway: boolean | null
  hasTolls: boolean | null
  estimatedTollCost: string
  estimatedDuration: string
  distanceKm: string
  plannedStops: TransferStop[]
  notes: string
  mapsUrl: string
  mapsEmbedUrl: string
  contentStatus: TripContentStatus
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  completedAt?: string
  completedBy?: string
}

export type TransferFormData = Pick<
  Transfer,
  | 'date'
  | 'origin'
  | 'destination'
  | 'viaMotorway'
  | 'hasTolls'
  | 'estimatedTollCost'
  | 'estimatedDuration'
  | 'distanceKm'
  | 'plannedStops'
  | 'notes'
  | 'mapsUrl'
  | 'mapsEmbedUrl'
>

export type SaveTransferData = TransferFormData & {
  contentStatus: TripContentStatus
}

export type TransfersLoadStatus = 'loading' | 'ready' | 'error'

export type TransfersByDirection = Record<TransferDirection, Transfer | null>

export const emptyTransfersByDirection: TransfersByDirection = {
  outbound: null,
  return: null,
}

export const emptyTransferFormData: TransferFormData = {
  date: '',
  origin: '',
  destination: '',
  viaMotorway: null,
  hasTolls: null,
  estimatedTollCost: '',
  estimatedDuration: '',
  distanceKm: '',
  plannedStops: [],
  notes: '',
  mapsUrl: '',
  mapsEmbedUrl: '',
}

export function transferToFormData(transfer: Transfer): TransferFormData {
  return {
    date: transfer.date,
    origin: transfer.origin,
    destination: transfer.destination,
    viaMotorway: transfer.viaMotorway,
    hasTolls: transfer.hasTolls,
    estimatedTollCost: transfer.estimatedTollCost,
    estimatedDuration: transfer.estimatedDuration,
    distanceKm: transfer.distanceKm,
    plannedStops: transfer.plannedStops.map((stop) => ({ ...stop })),
    notes: transfer.notes,
    mapsUrl: transfer.mapsUrl,
    mapsEmbedUrl: transfer.mapsEmbedUrl,
  }
}
