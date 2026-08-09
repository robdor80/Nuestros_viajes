import type { TripPhoto } from '../model/photo'

function toValidDate(value: string | undefined) {
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getEffectivePhotoDate(photo: TripPhoto) {
  return (
    toValidDate(photo.editableMetadata?.capturedAt) ??
    (photo.captureMetadata?.dateSource !== 'unknown'
      ? toValidDate(photo.captureMetadata?.capturedAt)
      : null)
  )
}

export function getPhotoSortDate(photo: TripPhoto) {
  return getEffectivePhotoDate(photo)?.toISOString() ?? photo.createdAt
}

export function formatPhotoDate(photo: TripPhoto) {
  const date = getEffectivePhotoDate(photo)
  if (!date) return null

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function getPhotoLabel(photo: TripPhoto) {
  return photo.editableMetadata?.title || formatPhotoDate(photo)
}

export function getPhotoAlt(photo: TripPhoto, tripName: string) {
  return getPhotoLabel(photo)
    ? `${getPhotoLabel(photo)}. Fotografía de ${tripName}`
    : `Fotografía de ${tripName}`
}

export function getPhotoLocationLabel(photo: TripPhoto) {
  const { placeName, city, country } = photo.editableMetadata ?? {}
  return placeName || [city, country].filter(Boolean).join(', ') || null
}
