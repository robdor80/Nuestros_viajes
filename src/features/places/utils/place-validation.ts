import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import type { PlaceFormData } from '../model/place'

export type PlaceFormErrorKey = keyof PlaceFormData | 'form'

export type PlaceFormErrors = Partial<Record<PlaceFormErrorKey, string>>

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function hasAdditionalPlaceInformation(values: PlaceFormData) {
  return Boolean(
    values.imageUrl.trim() ||
      values.category ||
      values.priority ||
      values.description.trim() ||
      values.address.trim() ||
      values.mapsUrl.trim() ||
      values.websiteUrl.trim() ||
      values.openingHours.trim() ||
      values.price.trim() ||
      values.estimatedDuration.trim() ||
      values.bestTime ||
      values.requiresReservation !== null ||
      values.notes.trim(),
  )
}

export function validatePlace(
  values: PlaceFormData,
  contentStatus: TripContentStatus,
) {
  const errors: PlaceFormErrors = {}

  if (!values.name.trim()) {
    errors.name = 'Escribe el nombre del lugar.'
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

  if (
    contentStatus === 'in_progress' &&
    !hasAdditionalPlaceInformation(values)
  ) {
    errors.form =
      'Para guardar en preparación, añade al menos otro dato además del nombre.'
  }

  if (contentStatus === 'completed') {
    if (!values.category) {
      errors.category = 'Selecciona una categoría.'
    }

    if (!values.priority) {
      errors.priority = 'Selecciona una prioridad.'
    }

    const hasCompletionDetail = Boolean(
      values.description.trim() ||
        values.address.trim() ||
        values.mapsUrl.trim() ||
        values.openingHours.trim() ||
        values.notes.trim(),
    )

    if (!hasCompletionDetail) {
      errors.form =
        'Para marcarlo como terminado, añade una descripción, dirección, enlace de Maps, horario o notas.'
    }
  }

  return errors
}

export function normalizePlaceFormData(
  values: PlaceFormData,
): PlaceFormData {
  return {
    name: values.name.trim(),
    imageUrl: values.imageUrl.trim(),
    category: values.category,
    priority: values.priority,
    description: values.description.trim(),
    address: values.address.trim(),
    mapsUrl: values.mapsUrl.trim(),
    websiteUrl: values.websiteUrl.trim(),
    openingHours: values.openingHours.trim(),
    price: values.price.trim(),
    estimatedDuration: values.estimatedDuration.trim(),
    bestTime: values.bestTime,
    requiresReservation: values.requiresReservation,
    notes: values.notes.trim(),
  }
}
