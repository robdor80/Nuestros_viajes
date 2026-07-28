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

export type TripStatus = 'draft' | 'planned'

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
  enabledSections: TripSection[]
  createdAt: string
}
