import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import type { AccommodationFormData } from '../model/accommodation'
import {
  calculateNights,
  calculatePricePerNight,
} from './accommodation-calculations'

export type AccommodationFormErrorKey =
  | keyof AccommodationFormData
  | 'form'

export type AccommodationFormErrors = Partial<
  Record<AccommodationFormErrorKey, string>
>

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function normalizeAccommodationFormData(
  values: AccommodationFormData,
): AccommodationFormData {
  const checkInDate = values.checkInDate.trim()
  const checkOutDate = values.checkOutDate.trim()
  const nights = calculateNights(checkInDate, checkOutDate)
  const totalPrice = values.totalPrice.trim()

  return {
    name: values.name.trim(),
    imageUrl: values.imageUrl.trim(),
    type: values.type,
    address: values.address.trim(),
    mapsUrl: values.mapsUrl.trim(),
    websiteUrl: values.websiteUrl.trim(),
    checkInDate,
    checkOutDate,
    nights,
    breakfastIncluded: values.breakfastIncluded,
    parkingIncluded: values.parkingIncluded,
    freeCancellation: values.freeCancellation,
    pool: values.pool,
    totalPrice,
    pricePerNight: calculatePricePerNight(totalPrice, nights),
    isPaid: values.isPaid,
    freeCancellationDeadline: values.freeCancellationDeadline.trim(),
    checkInTime: values.checkInTime.trim(),
    checkOutTime: values.checkOutTime.trim(),
    reservationCode: values.reservationCode.trim(),
    bookingPlatform: values.bookingPlatform,
    notes: values.notes.trim(),
  }
}

export function hasUsefulAccommodationData(values: AccommodationFormData) {
  return Boolean(
    values.imageUrl.trim() ||
      values.type ||
      values.address.trim() ||
      values.mapsUrl.trim() ||
      values.websiteUrl.trim() ||
      values.checkInDate.trim() ||
      values.checkOutDate.trim() ||
      values.nights.trim() ||
      values.breakfastIncluded ||
      values.parkingIncluded ||
      values.freeCancellation ||
      values.pool ||
      values.totalPrice.trim() ||
      values.pricePerNight.trim() ||
      values.isPaid !== null ||
      values.freeCancellationDeadline.trim() ||
      values.checkInTime.trim() ||
      values.checkOutTime.trim() ||
      values.reservationCode.trim() ||
      values.bookingPlatform ||
      values.notes.trim(),
  )
}

export function validateAccommodation(
  values: AccommodationFormData,
  contentStatus: TripContentStatus,
) {
  const errors: AccommodationFormErrors = {}

  if (!values.name.trim()) {
    errors.name = 'Escribe el nombre del alojamiento.'
  }

  const urlFields: Array<{
    field: 'imageUrl' | 'mapsUrl' | 'websiteUrl'
    label: string
  }> = [
    { field: 'imageUrl', label: 'La URL de la imagen' },
    { field: 'mapsUrl', label: 'El enlace de Google Maps' },
    { field: 'websiteUrl', label: 'La página web' },
  ]

  urlFields.forEach(({ field, label }) => {
    const value = values[field].trim()
    if (value && !isValidHttpUrl(value)) {
      errors[field] = `${label} debe comenzar por http:// o https://.`
    }
  })

  if (values.checkInDate && values.checkOutDate && !values.nights) {
    errors.checkOutDate =
      'La fecha de salida debe ser posterior a la fecha de entrada.'
  }

  if (
    contentStatus === 'in_progress' &&
    !hasUsefulAccommodationData(values)
  ) {
    errors.form =
      'Para guardar en preparación, añade al menos otro dato además del nombre.'
  }

  if (contentStatus === 'completed') {
    if (!values.checkInDate) {
      errors.checkInDate = 'Indica la fecha de entrada.'
    }
    if (!values.checkOutDate) {
      errors.checkOutDate = 'Indica la fecha de salida.'
    }
    if (values.checkInDate && values.checkOutDate && !values.nights) {
      errors.checkOutDate =
        'La fecha de salida debe ser posterior a la fecha de entrada.'
    }
    if (!values.totalPrice.trim()) {
      errors.totalPrice = 'Indica el precio total.'
    }
  }

  return errors
}
