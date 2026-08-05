import type {
  PhotoDateInfo,
  TripDayAssignment,
} from '../model/photo-analysis'

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

type ParsedIsoDate = {
  value: string
  serialDay: number
}

function parseIsoDate(value: string | undefined): ParsedIsoDate | null {
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
    value,
    serialDay: Math.floor(utcTime / MILLISECONDS_PER_DAY),
  }
}

export function assignPhotoToTripDay({
  photoDate,
  tripStartDate,
  tripEndDate,
}: {
  photoDate: PhotoDateInfo
  tripStartDate?: string
  tripEndDate?: string
}): TripDayAssignment {
  if (!photoDate.localDate) {
    return {
      status: 'missing-photo-date',
    }
  }

  if (!tripStartDate || !tripEndDate) {
    return {
      status: 'missing-trip-dates',
    }
  }

  const photoDateInfo = parseIsoDate(photoDate.localDate)
  const startDateInfo = parseIsoDate(tripStartDate)
  const endDateInfo = parseIsoDate(tripEndDate)

  if (
    !photoDateInfo ||
    !startDateInfo ||
    !endDateInfo ||
    startDateInfo.serialDay > endDateInfo.serialDay
  ) {
    return {
      status: 'invalid-trip-dates',
    }
  }

  if (photoDateInfo.serialDay < startDateInfo.serialDay) {
    return {
      status: 'before-trip',
      date: photoDateInfo.value,
    }
  }

  if (photoDateInfo.serialDay > endDateInfo.serialDay) {
    return {
      status: 'after-trip',
      date: photoDateInfo.value,
    }
  }

  return {
    status: 'matched',
    dayNumber: photoDateInfo.serialDay - startDateInfo.serialDay + 1,
    date: photoDateInfo.value,
  }
}
