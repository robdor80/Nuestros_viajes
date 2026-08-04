import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import {
  mealTypes,
  priceLevels,
  reservationStatuses,
  restaurantStatuses,
  venueTypes,
  type MealType,
  type RestaurantFormData,
  type RestaurantListItem,
} from '../model/restaurant'

export type RestaurantFormErrorKey = keyof RestaurantFormData | 'form'

export type RestaurantFormErrors = Partial<
  Record<RestaurantFormErrorKey, string>
>

function uniqueStrings(values: string[]) {
  const seen = new Set<string>()

  return values
    .map((value) => value.trim())
    .filter((value) => {
      const normalized = value.toLocaleLowerCase('es-ES')
      if (!normalized || seen.has(normalized)) {
        return false
      }
      seen.add(normalized)
      return true
    })
}

function normalizePositiveNumber(value: string) {
  const trimmedValue = value.trim().replace(',', '.')
  if (!trimmedValue) return ''

  const numericValue = Number(trimmedValue)
  return Number.isFinite(numericValue) && numericValue > 0
    ? trimmedValue
    : value.trim()
}

function normalizeRating(value: string) {
  const trimmedValue = value.trim().replace(',', '.')
  if (!trimmedValue) return ''

  const numericValue = Number(trimmedValue)
  return Number.isFinite(numericValue) &&
    numericValue >= 1 &&
    numericValue <= 5
    ? trimmedValue
    : value.trim()
}

function normalizeList(items: RestaurantListItem[]) {
  return items
    .map((item, index) => ({
      id: item.id,
      name: item.name.trim(),
      notes: item.notes.trim(),
      order: index,
    }))
    .filter((item) => item.name)
}

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function normalizeRestaurantFormData(
  values: RestaurantFormData,
): RestaurantFormData {
  const requiresReservation = values.requiresReservation
  const reservationFields =
    requiresReservation === true
      ? {
          reservationStatus: values.reservationStatus,
          reservationDate: values.reservationDate.trim(),
          reservationTime: values.reservationTime.trim(),
          reservationPeople: normalizePositiveNumber(values.reservationPeople),
          reservationName: values.reservationName.trim(),
          reservationPhone: values.reservationPhone.trim(),
          reservationReference: values.reservationReference.trim(),
          reservationConfirmationUrl:
            values.reservationConfirmationUrl.trim(),
          reservationNotes: values.reservationNotes.trim(),
        }
      : {
          reservationStatus: '' as const,
          reservationDate: '',
          reservationTime: '',
          reservationPeople: '',
          reservationName: '',
          reservationPhone: '',
          reservationReference: '',
          reservationConfirmationUrl: '',
          reservationNotes: '',
        }

  return {
    name: values.name.trim(),
    venueType: values.venueType,
    mealTypes: values.mealTypes.filter((mealType): mealType is MealType =>
      mealTypes.includes(mealType),
    ),
    cuisineTypes: uniqueStrings(values.cuisineTypes),
    locality: values.locality.trim(),
    area: values.area.trim(),
    address: values.address.trim(),
    mapsUrl: values.mapsUrl.trim(),
    imageUrl: values.imageUrl.trim(),
    restaurantStatus: values.restaurantStatus,
    tripDay: normalizePositiveNumber(values.tripDay),
    plannedDate: values.plannedDate.trim(),
    plannedTime: values.plannedTime.trim(),
    peopleCount: normalizePositiveNumber(values.peopleCount),
    requiresReservation,
    ...reservationFields,
    priceLevel: values.priceLevel,
    estimatedPricePerPerson: normalizePositiveNumber(
      values.estimatedPricePerPerson,
    ),
    estimatedTotalPrice: normalizePositiveNumber(values.estimatedTotalPrice),
    phone: values.phone.trim(),
    websiteUrl: values.websiteUrl.trim(),
    menuUrl: values.menuUrl.trim(),
    openingHours: values.openingHours.trim(),
    closingDay: values.closingDay.trim(),
    hasTerrace: values.hasTerrace,
    hasNearbyParking: values.hasNearbyParking,
    isAccessible: values.isAccessible,
    acceptsCard: values.acceptsCard,
    recommendedDishes: normalizeList(values.recommendedDishes),
    notes: values.notes.trim(),
    visited: values.visited || values.restaurantStatus === 'visited',
    visitedDate: values.visitedDate.trim(),
    fatiRating: normalizeRating(values.fatiRating),
    robertoRating: normalizeRating(values.robertoRating),
    jointRating: normalizeRating(values.jointRating),
    orderedItems: normalizeList(values.orderedItems),
    visitComments: values.visitComments.trim(),
    wouldReturn: values.wouldReturn,
  }
}

export function hasReservationData(values: RestaurantFormData) {
  return Boolean(
    values.reservationStatus ||
      values.reservationDate.trim() ||
      values.reservationTime.trim() ||
      values.reservationPeople.trim() ||
      values.reservationName.trim() ||
      values.reservationPhone.trim() ||
      values.reservationReference.trim() ||
      values.reservationConfirmationUrl.trim() ||
      values.reservationNotes.trim(),
  )
}

export function hasUsefulRestaurantData(values: RestaurantFormData) {
  return Boolean(
    values.venueType ||
      values.mealTypes.length > 0 ||
      values.cuisineTypes.length > 0 ||
      values.locality.trim() ||
      values.area.trim() ||
      values.address.trim() ||
      values.mapsUrl.trim() ||
      values.imageUrl.trim() ||
      values.tripDay.trim() ||
      values.plannedDate.trim() ||
      values.plannedTime.trim() ||
      values.peopleCount.trim() ||
      values.requiresReservation !== null ||
      hasReservationData(values) ||
      values.priceLevel ||
      values.estimatedPricePerPerson.trim() ||
      values.estimatedTotalPrice.trim() ||
      values.phone.trim() ||
      values.websiteUrl.trim() ||
      values.menuUrl.trim() ||
      values.openingHours.trim() ||
      values.closingDay.trim() ||
      values.hasTerrace !== null ||
      values.hasNearbyParking !== null ||
      values.isAccessible !== null ||
      values.acceptsCard !== null ||
      values.recommendedDishes.length > 0 ||
      values.notes.trim() ||
      values.visited ||
      values.visitedDate.trim() ||
      values.fatiRating.trim() ||
      values.robertoRating.trim() ||
      values.jointRating.trim() ||
      values.orderedItems.length > 0 ||
      values.visitComments.trim() ||
      values.wouldReturn !== null,
  )
}

function isPositiveNumber(value: string) {
  if (!value.trim()) return true
  const numericValue = Number(value.trim().replace(',', '.'))
  return Number.isFinite(numericValue) && numericValue > 0
}

function isRating(value: string) {
  if (!value.trim()) return true
  const numericValue = Number(value.trim().replace(',', '.'))
  return Number.isFinite(numericValue) &&
    numericValue >= 1 &&
    numericValue <= 5
}

export function validateRestaurant(
  values: RestaurantFormData,
  contentStatus: TripContentStatus,
) {
  const errors: RestaurantFormErrors = {}

  const urlFields: Array<{
    field:
      | 'mapsUrl'
      | 'imageUrl'
      | 'reservationConfirmationUrl'
      | 'websiteUrl'
      | 'menuUrl'
    label: string
  }> = [
    { field: 'mapsUrl', label: 'El enlace de Google Maps' },
    { field: 'imageUrl', label: 'La URL de la imagen' },
    {
      field: 'reservationConfirmationUrl',
      label: 'El enlace de confirmación',
    },
    { field: 'websiteUrl', label: 'La página web' },
    { field: 'menuUrl', label: 'La carta o menú' },
  ]

  urlFields.forEach(({ field, label }) => {
    const value = values[field].trim()
    if (value && !isValidHttpUrl(value)) {
      errors[field] = `${label} debe comenzar por http:// o https://.`
    }
  })

  if (values.venueType && !venueTypes.includes(values.venueType)) {
    errors.venueType = 'Selecciona un tipo válido.'
  }

  if (!restaurantStatuses.includes(values.restaurantStatus)) {
    errors.restaurantStatus = 'Selecciona un estado válido.'
  }

  if (
    values.reservationStatus &&
    !reservationStatuses.includes(values.reservationStatus)
  ) {
    errors.reservationStatus = 'Selecciona un estado de reserva válido.'
  }

  if (values.priceLevel && !priceLevels.includes(values.priceLevel)) {
    errors.priceLevel = 'Selecciona un nivel de precio válido.'
  }

  ;[
    'tripDay',
    'peopleCount',
    'reservationPeople',
    'estimatedPricePerPerson',
    'estimatedTotalPrice',
  ].forEach((field) => {
    const key = field as keyof RestaurantFormData
    const value = values[key]
    if (typeof value === 'string' && !isPositiveNumber(value)) {
      errors[key] = 'Introduce un número mayor que cero.'
    }
  })

  ;(['fatiRating', 'robertoRating', 'jointRating'] as const).forEach(
    (field) => {
      if (!isRating(values[field])) {
        errors[field] = 'La nota debe estar entre 1 y 5.'
      }
    },
  )

  if (contentStatus === 'draft') {
    if (!values.name.trim() && !values.address.trim() && !values.notes.trim()) {
      errors.form =
        'Para guardar un borrador, escribe al menos nombre, dirección o notas.'
    }
  }

  if (contentStatus === 'in_progress') {
    if (!values.name.trim()) {
      errors.name = 'Escribe el nombre del restaurante.'
    }
    if (!hasUsefulRestaurantData(values)) {
      errors.form =
        'Para guardar en preparación, añade al menos otro dato además del nombre.'
    }
  }

  if (contentStatus === 'completed') {
    if (!values.name.trim()) {
      errors.name = 'Escribe el nombre del restaurante.'
    }
    if (
      !values.venueType &&
      values.mealTypes.length === 0 &&
      !values.address.trim() &&
      !values.locality.trim() &&
      !values.mapsUrl.trim() &&
      !values.tripDay.trim() &&
      !values.plannedDate.trim() &&
      !values.restaurantStatus
    ) {
      errors.form =
        'Para marcar como terminado, añade al menos tipo, comida, dirección, localidad, enlace, día o estado.'
    }
  }

  return errors
}
