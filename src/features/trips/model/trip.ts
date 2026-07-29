export const tripSections = [
  'places',
  'itinerary',
  'accommodation',
  'transfers',
  'budget',
  'restaurants',
  'checklist',
  'documentation',
  'photos',
] as const

export type TripSection = (typeof tripSections)[number]

export type TripTransport =
  | 'car'
  | 'plane'
  | 'train'
  | 'bus'
  | 'boat'
  | 'other'

export const tripColorPalette = [
  '#62745e',
  '#5d7387',
  '#9b6655',
  '#75698a',
  '#8a733b',
  '#3e7372',
  '#855566',
] as const

export type TripColor = (typeof tripColorPalette)[number]

export type TripStatus =
  | 'draft'
  | 'planned'
  | 'preparing'
  | 'completed'
  | 'archived'

export type TripsLoadStatus = 'loading' | 'ready' | 'error'

export const tripStatusLabels: Record<TripStatus, string> = {
  draft: 'Borrador',
  planned: 'Planificado',
  preparing: 'En preparación',
  completed: 'Finalizado',
  archived: 'Archivado',
}

export type BaseTrip = {
  id: string
  name: string
  destination: string
  country: string
  description: string
  startDate: string
  endDate: string
  participants: string[]
  transport: TripTransport
  currency: string
  status: TripStatus
  color: TripColor
  enabledSections: TripSection[]
  ownerId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type CreateTripData = Omit<
  BaseTrip,
  | 'id'
  | 'color'
  | 'ownerId'
  | 'createdBy'
  | 'createdAt'
  | 'updatedAt'
>
