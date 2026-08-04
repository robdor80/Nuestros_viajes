import type { TripContentStatus } from '../../trip-workspace/model/trip-content'

export const venueTypes = [
  'restaurant',
  'tavern',
  'cafe',
  'tapas_bar',
  'pastry_shop',
  'cocktail_bar',
  'market_stall',
  'other',
] as const

export type VenueType = (typeof venueTypes)[number]

export const venueTypeLabels: Record<VenueType, string> = {
  restaurant: 'Restaurante',
  tavern: 'Taberna',
  cafe: 'Cafetería',
  tapas_bar: 'Bar de tapas',
  pastry_shop: 'Pastelería',
  cocktail_bar: 'Coctelería',
  market_stall: 'Puesto de mercado',
  other: 'Otro',
}

export const mealTypes = [
  'breakfast',
  'brunch',
  'lunch',
  'snack',
  'dinner',
  'tapas',
  'drinks',
  'other',
] as const

export type MealType = (typeof mealTypes)[number]

export const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Desayuno',
  brunch: 'Brunch',
  lunch: 'Comida',
  snack: 'Merienda',
  dinner: 'Cena',
  tapas: 'Tapas',
  drinks: 'Copas',
  other: 'Otro',
}

export const restaurantStatuses = [
  'option',
  'chosen',
  'reserved',
  'visited',
  'discarded',
] as const

export type RestaurantStatus = (typeof restaurantStatuses)[number]

export const restaurantStatusLabels: Record<RestaurantStatus, string> = {
  option: 'Opción',
  chosen: 'Elegido',
  reserved: 'Reservado',
  visited: 'Visitado',
  discarded: 'Descartado',
}

export const reservationStatuses = [
  'pending',
  'requested',
  'reserved',
  'cancelled',
] as const

export type ReservationStatus = (typeof reservationStatuses)[number]

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  pending: 'Pendiente',
  requested: 'Solicitada',
  reserved: 'Reservada',
  cancelled: 'Cancelada',
}

export const priceLevels = ['€', '€€', '€€€', '€€€€'] as const

export type PriceLevel = (typeof priceLevels)[number]

export type NullableBoolean = boolean | null

export type RestaurantListItem = {
  id: string
  name: string
  notes: string
  order: number
}

export type Restaurant = {
  id: string
  name: string
  venueType: VenueType | ''
  mealTypes: MealType[]
  cuisineTypes: string[]
  locality: string
  area: string
  address: string
  mapsUrl: string
  imageUrl: string
  restaurantStatus: RestaurantStatus
  tripDay: string
  plannedDate: string
  plannedTime: string
  peopleCount: string
  requiresReservation: NullableBoolean
  reservationStatus: ReservationStatus | ''
  reservationDate: string
  reservationTime: string
  reservationPeople: string
  reservationName: string
  reservationPhone: string
  reservationReference: string
  reservationConfirmationUrl: string
  reservationNotes: string
  priceLevel: PriceLevel | ''
  estimatedPricePerPerson: string
  estimatedTotalPrice: string
  phone: string
  websiteUrl: string
  menuUrl: string
  openingHours: string
  closingDay: string
  hasTerrace: NullableBoolean
  hasNearbyParking: NullableBoolean
  isAccessible: NullableBoolean
  acceptsCard: NullableBoolean
  recommendedDishes: RestaurantListItem[]
  notes: string
  visited: boolean
  visitedDate: string
  fatiRating: string
  robertoRating: string
  jointRating: string
  orderedItems: RestaurantListItem[]
  visitComments: string
  wouldReturn: NullableBoolean
  contentStatus: TripContentStatus
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  completedAt?: string
  completedBy?: string
}

export type RestaurantFormData = Pick<
  Restaurant,
  | 'name'
  | 'venueType'
  | 'mealTypes'
  | 'cuisineTypes'
  | 'locality'
  | 'area'
  | 'address'
  | 'mapsUrl'
  | 'imageUrl'
  | 'restaurantStatus'
  | 'tripDay'
  | 'plannedDate'
  | 'plannedTime'
  | 'peopleCount'
  | 'requiresReservation'
  | 'reservationStatus'
  | 'reservationDate'
  | 'reservationTime'
  | 'reservationPeople'
  | 'reservationName'
  | 'reservationPhone'
  | 'reservationReference'
  | 'reservationConfirmationUrl'
  | 'reservationNotes'
  | 'priceLevel'
  | 'estimatedPricePerPerson'
  | 'estimatedTotalPrice'
  | 'phone'
  | 'websiteUrl'
  | 'menuUrl'
  | 'openingHours'
  | 'closingDay'
  | 'hasTerrace'
  | 'hasNearbyParking'
  | 'isAccessible'
  | 'acceptsCard'
  | 'recommendedDishes'
  | 'notes'
  | 'visited'
  | 'visitedDate'
  | 'fatiRating'
  | 'robertoRating'
  | 'jointRating'
  | 'orderedItems'
  | 'visitComments'
  | 'wouldReturn'
>

export type SaveRestaurantData = RestaurantFormData & {
  contentStatus: TripContentStatus
}

export type RestaurantsLoadStatus = 'loading' | 'ready' | 'error'

export const emptyRestaurantFormData: RestaurantFormData = {
  name: '',
  venueType: '',
  mealTypes: [],
  cuisineTypes: [],
  locality: '',
  area: '',
  address: '',
  mapsUrl: '',
  imageUrl: '',
  restaurantStatus: 'option',
  tripDay: '',
  plannedDate: '',
  plannedTime: '',
  peopleCount: '',
  requiresReservation: null,
  reservationStatus: '',
  reservationDate: '',
  reservationTime: '',
  reservationPeople: '',
  reservationName: '',
  reservationPhone: '',
  reservationReference: '',
  reservationConfirmationUrl: '',
  reservationNotes: '',
  priceLevel: '',
  estimatedPricePerPerson: '',
  estimatedTotalPrice: '',
  phone: '',
  websiteUrl: '',
  menuUrl: '',
  openingHours: '',
  closingDay: '',
  hasTerrace: null,
  hasNearbyParking: null,
  isAccessible: null,
  acceptsCard: null,
  recommendedDishes: [],
  notes: '',
  visited: false,
  visitedDate: '',
  fatiRating: '',
  robertoRating: '',
  jointRating: '',
  orderedItems: [],
  visitComments: '',
  wouldReturn: null,
}

export function restaurantToFormData(
  restaurant: Restaurant,
): RestaurantFormData {
  return {
    name: restaurant.name,
    venueType: restaurant.venueType,
    mealTypes: restaurant.mealTypes,
    cuisineTypes: restaurant.cuisineTypes,
    locality: restaurant.locality,
    area: restaurant.area,
    address: restaurant.address,
    mapsUrl: restaurant.mapsUrl,
    imageUrl: restaurant.imageUrl,
    restaurantStatus: restaurant.restaurantStatus,
    tripDay: restaurant.tripDay,
    plannedDate: restaurant.plannedDate,
    plannedTime: restaurant.plannedTime,
    peopleCount: restaurant.peopleCount,
    requiresReservation: restaurant.requiresReservation,
    reservationStatus: restaurant.reservationStatus,
    reservationDate: restaurant.reservationDate,
    reservationTime: restaurant.reservationTime,
    reservationPeople: restaurant.reservationPeople,
    reservationName: restaurant.reservationName,
    reservationPhone: restaurant.reservationPhone,
    reservationReference: restaurant.reservationReference,
    reservationConfirmationUrl: restaurant.reservationConfirmationUrl,
    reservationNotes: restaurant.reservationNotes,
    priceLevel: restaurant.priceLevel,
    estimatedPricePerPerson: restaurant.estimatedPricePerPerson,
    estimatedTotalPrice: restaurant.estimatedTotalPrice,
    phone: restaurant.phone,
    websiteUrl: restaurant.websiteUrl,
    menuUrl: restaurant.menuUrl,
    openingHours: restaurant.openingHours,
    closingDay: restaurant.closingDay,
    hasTerrace: restaurant.hasTerrace,
    hasNearbyParking: restaurant.hasNearbyParking,
    isAccessible: restaurant.isAccessible,
    acceptsCard: restaurant.acceptsCard,
    recommendedDishes: restaurant.recommendedDishes,
    notes: restaurant.notes,
    visited: restaurant.visited,
    visitedDate: restaurant.visitedDate,
    fatiRating: restaurant.fatiRating,
    robertoRating: restaurant.robertoRating,
    jointRating: restaurant.jointRating,
    orderedItems: restaurant.orderedItems,
    visitComments: restaurant.visitComments,
    wouldReturn: restaurant.wouldReturn,
  }
}
