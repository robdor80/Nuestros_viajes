import type { BaseTrip } from '../../trips/model/trip'
import type { PhotoDateInfo } from '../model/photo-analysis'
import type {
  PhotoReviewData,
  PhotoReviewDraft,
  PhotoReviewSummary,
} from '../model/photo-review'
import type { SelectedPhoto } from '../model/selected-photo'
import { assignPhotoToTripDay } from './trip-day-assignment'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

type TripDayOption = {
  dayNumber: number
  date: string
  label: string
}

function parseIsoDate(value: string | undefined) {
  if (!value) return null

  const match = ISO_DATE_PATTERN.exec(value)
  if (!match) return null

  const [, yearText, monthText, dayText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const utcTime = Date.UTC(year, month - 1, day)
  const date = new Date(utcTime)

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return {
    utcTime,
    value,
  }
}

function formatShortDate(value: string) {
  const parsed = parseIsoDate(value)
  if (!parsed) return value

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(parsed.utcTime))
}

export function getTripDayOptions(trip: Pick<BaseTrip, 'startDate' | 'endDate'>) {
  const startDate = parseIsoDate(trip.startDate)
  const endDate = parseIsoDate(trip.endDate)

  if (!startDate || !endDate || startDate.utcTime > endDate.utcTime) {
    return []
  }

  const dayCount =
    Math.floor((endDate.utcTime - startDate.utcTime) / MILLISECONDS_PER_DAY) + 1

  return Array.from({ length: dayCount }, (_, index): TripDayOption => {
    const utcTime = startDate.utcTime + index * MILLISECONDS_PER_DAY
    const date = new Date(utcTime)
    const year = date.getUTCFullYear()
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
    const day = `${date.getUTCDate()}`.padStart(2, '0')
    const value = `${year}-${month}-${day}`

    return {
      dayNumber: index + 1,
      date: value,
      label: `Día ${index + 1} · ${formatShortDate(value)}`,
    }
  })
}

export function shouldPhotoNeedReview(photo: SelectedPhoto) {
  const { analysis } = photo
  const { metadata } = analysis

  return (
    analysis.status === 'failed' ||
    analysis.status === 'completed-with-warnings' ||
    metadata?.date.source === 'file-last-modified' ||
    metadata?.date.source === 'exif-modify' ||
    metadata?.date.source === 'unavailable' ||
    metadata?.date.confidence === 'low' ||
    metadata?.tripDay.status === 'before-trip' ||
    metadata?.tripDay.status === 'after-trip' ||
    metadata?.location.status === 'invalid' ||
    analysis.warnings.includes('heic-partial-support') ||
    analysis.warnings.includes('metadata-read-failed')
  )
}

export function createReviewFromPhoto(photo: SelectedPhoto): PhotoReviewData {
  const { metadata } = photo.analysis
  const tripDayNumber =
    metadata?.tripDay.status === 'matched' ? metadata.tripDay.dayNumber : null

  return {
    photoId: photo.id,
    fingerprint: photo.fingerprint,
    dateMode: metadata?.date.localDate ? 'analyzed' : 'without-date',
    localDate: metadata?.date.localDate ?? null,
    localTime: metadata?.date.localTime ?? null,
    tripDayMode: tripDayNumber ? 'analyzed' : 'unassigned',
    tripDayNumber,
    description: '',
    isConfirmed: !shouldPhotoNeedReview(photo),
  }
}

export function buildReviewDateInfo(review: PhotoReviewData): PhotoDateInfo {
  if (review.dateMode === 'without-date' || !review.localDate) {
    return {
      source: 'unavailable',
      confidence: 'unknown',
      offsetSource: 'unknown',
    }
  }

  return {
    source: review.dateMode === 'manual' ? 'file-last-modified' : 'exif-original',
    confidence: review.dateMode === 'manual' ? 'medium' : 'high',
    localDate: review.localDate,
    localTime: review.localTime ?? undefined,
    offsetSource: 'unknown',
  }
}

export function applyReviewDraft({
  currentReview,
  draft,
  trip,
}: {
  currentReview: PhotoReviewData
  draft: PhotoReviewDraft
  trip: Pick<BaseTrip, 'startDate' | 'endDate'>
}): PhotoReviewData {
  const normalizedDate =
    draft.dateMode === 'without-date' || !draft.localDate
      ? null
      : draft.localDate
  const normalizedTime = normalizedDate ? draft.localTime || null : null
  const reviewWithDate = {
    ...currentReview,
    ...draft,
    localDate: normalizedDate,
    localTime: normalizedTime,
  }

  if (draft.tripDayMode === 'manual') {
    return {
      ...reviewWithDate,
      isConfirmed: true,
    }
  }

  if (draft.dateMode === 'without-date') {
    return {
      ...reviewWithDate,
      tripDayMode: 'unassigned',
      tripDayNumber: null,
      isConfirmed: true,
    }
  }

  const tripDay = assignPhotoToTripDay({
    photoDate: buildReviewDateInfo(reviewWithDate),
    tripStartDate: trip.startDate,
    tripEndDate: trip.endDate,
  })

  return {
    ...reviewWithDate,
    tripDayMode: tripDay.status === 'matched' ? 'analyzed' : 'unassigned',
    tripDayNumber: tripDay.status === 'matched' ? tripDay.dayNumber : null,
    isConfirmed: true,
  }
}

export function getPhotoReviewSummary({
  photos,
  reviews,
}: {
  photos: SelectedPhoto[]
  reviews: Record<string, PhotoReviewData>
}): PhotoReviewSummary {
  return photos.reduce<PhotoReviewSummary>(
    (summary, photo) => {
      const review = reviews[photo.id]
      const needsReview = shouldPhotoNeedReview(photo) && !review?.isConfirmed

      summary.total += 1
      if (needsReview) {
        summary.needsReview += 1
      } else {
        summary.ready += 1
      }
      if (review?.isConfirmed && shouldPhotoNeedReview(photo)) {
        summary.manuallyConfirmed += 1
      }
      if (review?.dateMode === 'without-date' && review.isConfirmed) {
        summary.acceptedWithoutDate += 1
      }
      if (
        photo.analysis.metadata?.tripDay.status === 'before-trip' ||
        photo.analysis.metadata?.tripDay.status === 'after-trip'
      ) {
        summary.outsideTrip += 1
      }
      if (photo.analysis.metadata?.location.status === 'available') {
        summary.withLocation += 1
      }

      return summary
    },
    {
      total: 0,
      ready: 0,
      needsReview: 0,
      manuallyConfirmed: 0,
      acceptedWithoutDate: 0,
      outsideTrip: 0,
      withLocation: 0,
    },
  )
}

export function describePhotoReviewStatus({
  photo,
  review,
}: {
  photo: SelectedPhoto
  review?: PhotoReviewData
}) {
  if (review?.isConfirmed) return 'Lista'
  if (photo.analysis.status === 'failed') return 'Análisis incompleto'
  if (!photo.analysis.metadata?.date.localDate) return 'Fecha por revisar'
  if (
    photo.analysis.metadata.tripDay.status === 'before-trip' ||
    photo.analysis.metadata.tripDay.status === 'after-trip'
  ) {
    return 'Fuera del viaje'
  }
  if (
    photo.analysis.metadata.date.source === 'file-last-modified' ||
    photo.analysis.metadata.date.source === 'exif-modify' ||
    photo.analysis.metadata.date.confidence === 'low'
  ) {
    return 'Fecha por revisar'
  }
  if (photo.analysis.metadata.location.status === 'invalid') {
    return 'Ubicación por revisar'
  }

  return shouldPhotoNeedReview(photo) ? 'Necesita revisión' : 'Lista'
}

export function formatPhotoReviewMeta({
  review,
  tripDayOptions,
}: {
  review?: PhotoReviewData
  tripDayOptions: TripDayOption[]
}) {
  const tripDay = tripDayOptions.find(
    (option) => option.dayNumber === review?.tripDayNumber,
  )
  const date = review?.localDate ? formatShortDate(review.localDate) : null
  const time = review?.localTime || null

  return [
    tripDay ? `Día ${tripDay.dayNumber}` : 'Sin día',
    date,
    time,
  ].filter((value): value is string => Boolean(value))
}
