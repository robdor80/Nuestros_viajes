import type { TripPhoto } from '../model/photo'
import { getEffectivePhotoDate } from './photo-presentation'

export type PhotoSearchCriteria = {
  query: string
  date: string
  tripDay: string
}

export function normalizePhotoSearchText(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es-ES')
}

function getPhotoSearchText(photo: TripPhoto) {
  const metadata = photo.editableMetadata

  return [
    metadata?.title,
    metadata?.description,
    metadata?.placeName,
    metadata?.city,
    metadata?.country,
  ]
    .filter(Boolean)
    .join(' ')
}

export function getEffectivePhotoTripDay(photo: TripPhoto) {
  return photo.editableMetadata?.tripDay ?? photo.captureMetadata?.tripDay
}

function getPhotoLocalDateValue(photo: TripPhoto) {
  const date = getEffectivePhotoDate(photo)
  if (!date) return null

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function hasActivePhotoSearchCriteria(criteria: PhotoSearchCriteria) {
  return Boolean(criteria.query.trim() || criteria.date || criteria.tripDay)
}

export function getAvailablePhotoTripDays(photos: TripPhoto[]) {
  return [...new Set(
    photos
      .map(getEffectivePhotoTripDay)
      .filter((tripDay): tripDay is number => typeof tripDay === 'number'),
  )].sort((firstDay, secondDay) => firstDay - secondDay)
}

export function filterPhotos(
  photos: TripPhoto[],
  criteria: PhotoSearchCriteria,
) {
  const normalizedQuery = normalizePhotoSearchText(criteria.query)
  const selectedTripDay = Number(criteria.tripDay)

  return photos.filter((photo) => {
    if (
      normalizedQuery &&
      !normalizePhotoSearchText(getPhotoSearchText(photo)).includes(normalizedQuery)
    ) {
      return false
    }

    if (criteria.date && getPhotoLocalDateValue(photo) !== criteria.date) {
      return false
    }

    if (
      criteria.tripDay &&
      getEffectivePhotoTripDay(photo) !== selectedTripDay
    ) {
      return false
    }

    return true
  })
}
