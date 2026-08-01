import type { TripContentStatus } from '../../trip-workspace/model/trip-content'

export const accommodationTypes = [
  'hotel',
  'apartment',
  'rural_house',
  'hostel',
  'camping',
  'other',
] as const

export type AccommodationType = (typeof accommodationTypes)[number]

export const accommodationTypeLabels: Record<AccommodationType, string> = {
  hotel: 'Hotel',
  apartment: 'Apartamento',
  rural_house: 'Casa rural',
  hostel: 'Hostal',
  camping: 'Camping',
  other: 'Otro',
}

export const bookingPlatforms = [
  'booking',
  'expedia',
  'airbnb',
  'official_website',
  'other',
] as const

export type BookingPlatform = (typeof bookingPlatforms)[number]

export const bookingPlatformLabels: Record<BookingPlatform, string> = {
  booking: 'Booking',
  expedia: 'Expedia',
  airbnb: 'Airbnb',
  official_website: 'Web oficial',
  other: 'Otra',
}

export type Accommodation = {
  id: string
  name: string
  imageUrl: string
  type: AccommodationType | ''
  address: string
  mapsUrl: string
  websiteUrl: string
  checkInDate: string
  checkOutDate: string
  nights: string
  breakfastIncluded: boolean
  parkingIncluded: boolean
  parkingPricePerNight: string
  parkingTotalCost: string
  freeCancellation: boolean
  pool: boolean
  totalPrice: string
  pricePerNight: string
  isPaid: boolean | null
  freeCancellationDeadline: string
  checkInTime: string
  checkOutTime: string
  reservationCode: string
  bookingPlatform: BookingPlatform | ''
  notes: string
  contentStatus: TripContentStatus
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  completedAt?: string
  completedBy?: string
}

export type AccommodationFormData = Pick<
  Accommodation,
  | 'name'
  | 'imageUrl'
  | 'type'
  | 'address'
  | 'mapsUrl'
  | 'websiteUrl'
  | 'checkInDate'
  | 'checkOutDate'
  | 'nights'
  | 'breakfastIncluded'
  | 'parkingIncluded'
  | 'parkingPricePerNight'
  | 'parkingTotalCost'
  | 'freeCancellation'
  | 'pool'
  | 'totalPrice'
  | 'pricePerNight'
  | 'isPaid'
  | 'freeCancellationDeadline'
  | 'checkInTime'
  | 'checkOutTime'
  | 'reservationCode'
  | 'bookingPlatform'
  | 'notes'
>

export type SaveAccommodationData = AccommodationFormData & {
  contentStatus: TripContentStatus
}

export type AccommodationsLoadStatus = 'loading' | 'ready' | 'error'

export const emptyAccommodationFormData: AccommodationFormData = {
  name: '',
  imageUrl: '',
  type: '',
  address: '',
  mapsUrl: '',
  websiteUrl: '',
  checkInDate: '',
  checkOutDate: '',
  nights: '',
  breakfastIncluded: false,
  parkingIncluded: false,
  parkingPricePerNight: '',
  parkingTotalCost: '',
  freeCancellation: false,
  pool: false,
  totalPrice: '',
  pricePerNight: '',
  isPaid: null,
  freeCancellationDeadline: '',
  checkInTime: '',
  checkOutTime: '',
  reservationCode: '',
  bookingPlatform: '',
  notes: '',
}

export function accommodationToFormData(
  accommodation: Accommodation,
): AccommodationFormData {
  return {
    name: accommodation.name,
    imageUrl: accommodation.imageUrl,
    type: accommodation.type,
    address: accommodation.address,
    mapsUrl: accommodation.mapsUrl,
    websiteUrl: accommodation.websiteUrl,
    checkInDate: accommodation.checkInDate,
    checkOutDate: accommodation.checkOutDate,
    nights: accommodation.nights,
    breakfastIncluded: accommodation.breakfastIncluded,
    parkingIncluded: accommodation.parkingIncluded,
    parkingPricePerNight: accommodation.parkingPricePerNight,
    parkingTotalCost: accommodation.parkingTotalCost,
    freeCancellation: accommodation.freeCancellation,
    pool: accommodation.pool,
    totalPrice: accommodation.totalPrice,
    pricePerNight: accommodation.pricePerNight,
    isPaid: accommodation.isPaid,
    freeCancellationDeadline: accommodation.freeCancellationDeadline,
    checkInTime: accommodation.checkInTime,
    checkOutTime: accommodation.checkOutTime,
    reservationCode: accommodation.reservationCode,
    bookingPlatform: accommodation.bookingPlatform,
    notes: accommodation.notes,
  }
}
