import type { PhotoDateInfo } from '../model/photo-analysis'

export type RawPhotoDateFields = {
  DateTimeOriginal?: unknown
  CreateDate?: unknown
  DateTimeDigitized?: unknown
  ModifyDate?: unknown
  OffsetTimeOriginal?: unknown
  OffsetTimeDigitized?: unknown
  OffsetTime?: unknown
}

type ParsedExifDate = {
  originalValue: string
  localDate: string
  localTime: string
}

const EXIF_DATE_PATTERN =
  /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/
const OFFSET_PATTERN = /^([+-])(\d{2}):?(\d{2})$/

function padNumber(value: number) {
  return value.toString().padStart(2, '0')
}

function isValidCalendarDate(year: number, month: number, day: number) {
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false
  }

  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

function isValidTime(hour: number, minute: number, second: number) {
  return (
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59 &&
    second >= 0 &&
    second <= 59
  )
}

function parseExifDate(value: unknown): ParsedExifDate | null {
  if (typeof value !== 'string') return null

  const trimmedValue = value.trim()
  const match = EXIF_DATE_PATTERN.exec(trimmedValue)

  if (!match) return null

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
    match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const second = Number(secondText)

  if (
    !isValidCalendarDate(year, month, day) ||
    !isValidTime(hour, minute, second)
  ) {
    return null
  }

  return {
    originalValue: trimmedValue,
    localDate: `${yearText}-${monthText}-${dayText}`,
    localTime: `${hourText}:${minuteText}:${secondText}`,
  }
}

function normalizeOffset(value: unknown) {
  if (typeof value !== 'string') return undefined

  const trimmedValue = value.trim()
  if (trimmedValue === 'Z') return '+00:00'

  const match = OFFSET_PATTERN.exec(trimmedValue)
  if (!match) return undefined

  const [, sign, hourText, minuteText] = match
  const hour = Number(hourText)
  const minute = Number(minuteText)

  if (hour > 23 || minute > 59) return undefined

  return `${sign}${hourText}:${minuteText}`
}

function buildExifDateInfo({
  parsedDate,
  source,
  confidence,
  offset,
}: {
  parsedDate: ParsedExifDate
  source: PhotoDateInfo['source']
  confidence: PhotoDateInfo['confidence']
  offset?: string
}): PhotoDateInfo {
  return {
    source,
    confidence,
    originalValue: parsedDate.originalValue,
    localDate: parsedDate.localDate,
    localTime: parsedDate.localTime,
    offset,
    offsetSource: offset ? 'exif' : 'unknown',
  }
}

function buildFileLastModifiedDate(file: File): PhotoDateInfo | null {
  if (!Number.isFinite(file.lastModified) || file.lastModified <= 0) {
    return null
  }

  const date = new Date(file.lastModified)

  if (Number.isNaN(date.getTime())) return null

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  if (
    !isValidCalendarDate(year, month, day) ||
    !isValidTime(hour, minute, second)
  ) {
    return null
  }

  return {
    source: 'file-last-modified',
    confidence: 'low',
    originalValue: String(file.lastModified),
    localDate: `${year}-${padNumber(month)}-${padNumber(day)}`,
    localTime: `${padNumber(hour)}:${padNumber(minute)}:${padNumber(second)}`,
    offsetSource: 'unknown',
  }
}

export function selectBestPhotoDate(
  rawDateFields: RawPhotoDateFields,
  file: File,
): PhotoDateInfo {
  const originalDate = parseExifDate(rawDateFields.DateTimeOriginal)
  if (originalDate) {
    return buildExifDateInfo({
      parsedDate: originalDate,
      source: 'exif-original',
      confidence: 'high',
      offset: normalizeOffset(
        rawDateFields.OffsetTimeOriginal ?? rawDateFields.OffsetTime,
      ),
    })
  }

  const createDate =
    parseExifDate(rawDateFields.CreateDate) ??
    parseExifDate(rawDateFields.DateTimeDigitized)
  if (createDate) {
    return buildExifDateInfo({
      parsedDate: createDate,
      source: 'exif-create',
      confidence: 'medium',
      offset: normalizeOffset(
        rawDateFields.OffsetTimeDigitized ?? rawDateFields.OffsetTime,
      ),
    })
  }

  const modifyDate = parseExifDate(rawDateFields.ModifyDate)
  if (modifyDate) {
    return buildExifDateInfo({
      parsedDate: modifyDate,
      source: 'exif-modify',
      confidence: 'low',
      offset: normalizeOffset(rawDateFields.OffsetTime),
    })
  }

  const fallbackDate = buildFileLastModifiedDate(file)
  if (fallbackDate) return fallbackDate

  return {
    source: 'unavailable',
    confidence: 'unknown',
    offsetSource: 'unknown',
  }
}
