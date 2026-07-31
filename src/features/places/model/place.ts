import type { TripContentStatus } from '../../trip-workspace/model/trip-content'

export const placeCategories = [
  'monument',
  'museum',
  'religious_site',
  'neighborhood',
  'viewpoint',
  'nature',
  'activity',
  'shopping',
  'other',
] as const

export type PlaceCategory = (typeof placeCategories)[number]

export const placeCategoryLabels: Record<PlaceCategory, string> = {
  monument: 'Monumento',
  museum: 'Museo',
  religious_site: 'Iglesia o lugar religioso',
  neighborhood: 'Barrio o zona',
  viewpoint: 'Mirador',
  nature: 'Naturaleza',
  activity: 'Actividad',
  shopping: 'Compras',
  other: 'Otro',
}

export const placePriorities = [
  'must_see',
  'would_like',
  'optional',
] as const

export type PlacePriority = (typeof placePriorities)[number]

export const placePriorityLabels: Record<PlacePriority, string> = {
  must_see: 'Imprescindible',
  would_like: 'Nos gustaría',
  optional: 'Opcional',
}

export const placeBestTimes = [
  'morning',
  'midday',
  'afternoon',
  'night',
  'anytime',
] as const

export type PlaceBestTime = (typeof placeBestTimes)[number]

export const placeBestTimeLabels: Record<PlaceBestTime, string> = {
  morning: 'Mañana',
  midday: 'Mediodía',
  afternoon: 'Tarde',
  night: 'Noche',
  anytime: 'Indiferente',
}

export type Place = {
  id: string
  name: string
  imageUrl: string
  category: PlaceCategory | ''
  priority: PlacePriority | ''
  description: string
  address: string
  mapsUrl: string
  websiteUrl: string
  openingHours: string
  price: string
  estimatedDuration: string
  bestTime: PlaceBestTime | ''
  requiresReservation: boolean | null
  notes: string
  contentStatus: TripContentStatus
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  completedAt?: string
  completedBy?: string
}

export type PlaceFormData = Pick<
  Place,
  | 'name'
  | 'imageUrl'
  | 'category'
  | 'priority'
  | 'description'
  | 'address'
  | 'mapsUrl'
  | 'websiteUrl'
  | 'openingHours'
  | 'price'
  | 'estimatedDuration'
  | 'bestTime'
  | 'requiresReservation'
  | 'notes'
>

export type SavePlaceData = PlaceFormData & {
  contentStatus: TripContentStatus
}

export type PlacesLoadStatus = 'loading' | 'ready' | 'error'

export const emptyPlaceFormData: PlaceFormData = {
  name: '',
  imageUrl: '',
  category: '',
  priority: '',
  description: '',
  address: '',
  mapsUrl: '',
  websiteUrl: '',
  openingHours: '',
  price: '',
  estimatedDuration: '',
  bestTime: '',
  requiresReservation: null,
  notes: '',
}

export function placeToFormData(place: Place): PlaceFormData {
  return {
    name: place.name,
    imageUrl: place.imageUrl,
    category: place.category,
    priority: place.priority,
    description: place.description,
    address: place.address,
    mapsUrl: place.mapsUrl,
    websiteUrl: place.websiteUrl,
    openingHours: place.openingHours,
    price: place.price,
    estimatedDuration: place.estimatedDuration,
    bestTime: place.bestTime,
    requiresReservation: place.requiresReservation,
    notes: place.notes,
  }
}
