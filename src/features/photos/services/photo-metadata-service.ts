import type { BaseTrip } from '../../trips/model/trip'
import type {
  PhotoAnalysis,
  PhotoAnalysisWarningCode,
  PhotoDimensionsInfo,
  PhotoLocationInfo,
  PhotoMetadata,
  PhotoOrientationInfo,
} from '../model/photo-analysis'
import type { SelectedPhoto } from '../model/selected-photo'
import { selectBestPhotoDate, type RawPhotoDateFields } from '../utils/photo-date'
import { assignPhotoToTripDay } from '../utils/trip-day-assignment'

type ExifrModule = typeof import('exifr')

type RawExifMetadata = RawPhotoDateFields & {
  latitude?: unknown
  longitude?: unknown
  GPSLatitude?: unknown
  GPSLongitude?: unknown
  GPSLatitudeRef?: unknown
  GPSLongitudeRef?: unknown
  GPSAltitude?: unknown
  GPSImgDirection?: unknown
  Orientation?: unknown
  ExifImageWidth?: unknown
  ExifImageHeight?: unknown
  PixelXDimension?: unknown
  PixelYDimension?: unknown
  ImageWidth?: unknown
  ImageHeight?: unknown
}

type BitmapDimensions = {
  width: number
  height: number
  source: 'bitmap' | 'image-element'
}

const EXIF_TAGS = [
  'DateTimeOriginal',
  'CreateDate',
  'DateTimeDigitized',
  'ModifyDate',
  'OffsetTimeOriginal',
  'OffsetTimeDigitized',
  'OffsetTime',
  'latitude',
  'longitude',
  'GPSLatitude',
  'GPSLongitude',
  'GPSLatitudeRef',
  'GPSLongitudeRef',
  'GPSAltitude',
  'GPSImgDirection',
  'Orientation',
  'ExifImageWidth',
  'ExifImageHeight',
  'PixelXDimension',
  'PixelYDimension',
  'ImageWidth',
  'ImageHeight',
] as const

let exifrModulePromise: Promise<ExifrModule> | null = null

function loadExifr() {
  exifrModulePromise ??= import('exifr')
  return exifrModulePromise
}

function addWarning(
  warnings: Set<PhotoAnalysisWarningCode>,
  warning: PhotoAnalysisWarningCode,
) {
  warnings.add(warning)
}

function isHeicFile(file: File) {
  const fileName = file.name.toLowerCase()

  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    fileName.endsWith('.heic') ||
    fileName.endsWith('.heif')
  )
}

function toFiniteNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsedValue = Number(value)
    if (Number.isFinite(parsedValue)) return parsedValue
  }

  return undefined
}

function toPositiveInteger(value: unknown) {
  const parsedValue = toFiniteNumber(value)
  if (!parsedValue || parsedValue <= 0) return undefined

  return Math.round(parsedValue)
}

function coordinateFromDms(value: unknown, ref: unknown) {
  if (!Array.isArray(value) || value.length < 3) return undefined

  const degrees = toFiniteNumber(value[0])
  const minutes = toFiniteNumber(value[1])
  const seconds = toFiniteNumber(value[2])

  if (
    degrees === undefined ||
    minutes === undefined ||
    seconds === undefined ||
    minutes < 0 ||
    minutes >= 60 ||
    seconds < 0 ||
    seconds >= 60
  ) {
    return undefined
  }

  const direction = typeof ref === 'string' ? ref.toUpperCase() : ''
  const sign = direction === 'S' || direction === 'W' ? -1 : 1

  return sign * (Math.abs(degrees) + minutes / 60 + seconds / 3600)
}

function isValidLatitude(value: number) {
  return value >= -90 && value <= 90
}

function isValidLongitude(value: number) {
  return value >= -180 && value <= 180
}

function normalizeLocation(rawMetadata: RawExifMetadata): PhotoLocationInfo {
  const latitude =
    toFiniteNumber(rawMetadata.latitude) ??
    coordinateFromDms(rawMetadata.GPSLatitude, rawMetadata.GPSLatitudeRef)
  const longitude =
    toFiniteNumber(rawMetadata.longitude) ??
    coordinateFromDms(rawMetadata.GPSLongitude, rawMetadata.GPSLongitudeRef)

  if (latitude === undefined && longitude === undefined) {
    return {
      status: 'unavailable',
    }
  }

  if (
    latitude === undefined ||
    longitude === undefined ||
    !isValidLatitude(latitude) ||
    !isValidLongitude(longitude)
  ) {
    return {
      status: 'invalid',
    }
  }

  const altitude = toFiniteNumber(rawMetadata.GPSAltitude)
  const direction = toFiniteNumber(rawMetadata.GPSImgDirection)

  return {
    status: 'available',
    latitude,
    longitude,
    ...(altitude !== undefined ? { altitude } : {}),
    ...(direction !== undefined ? { direction } : {}),
  }
}

function normalizeOrientation(value: unknown): PhotoOrientationInfo {
  const numericValue = toFiniteNumber(value)
  const orientationValue =
    numericValue !== undefined && numericValue >= 1 && numericValue <= 8
      ? Math.round(numericValue)
      : undefined

  if (!orientationValue) {
    return {
      requiresDimensionSwap: false,
      source: 'unavailable',
    }
  }

  return {
    value: orientationValue,
    requiresDimensionSwap: [5, 6, 7, 8].includes(orientationValue),
    source: 'exif',
  }
}

function buildExifDimensions(
  rawMetadata: RawExifMetadata,
  orientation: PhotoOrientationInfo,
): PhotoDimensionsInfo | null {
  const dimensionPairs = [
    [rawMetadata.ExifImageWidth, rawMetadata.ExifImageHeight],
    [rawMetadata.PixelXDimension, rawMetadata.PixelYDimension],
    [rawMetadata.ImageWidth, rawMetadata.ImageHeight],
  ] as const

  for (const [widthValue, heightValue] of dimensionPairs) {
    const originalWidth = toPositiveInteger(widthValue)
    const originalHeight = toPositiveInteger(heightValue)

    if (!originalWidth || !originalHeight) continue

    return {
      originalWidth,
      originalHeight,
      visualWidth: orientation.requiresDimensionSwap
        ? originalHeight
        : originalWidth,
      visualHeight: orientation.requiresDimensionSwap
        ? originalWidth
        : originalHeight,
      source: 'exif',
    }
  }

  return null
}

async function readImageElementDimensions(
  objectUrl: string,
): Promise<BitmapDimensions | null> {
  if (typeof Image === 'undefined') return null

  return new Promise((resolve) => {
    const image = new Image()

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
        source: 'image-element',
      })
    }
    image.onerror = () => resolve(null)
    image.src = objectUrl
  })
}

async function readBitmapDimensions(
  file: File,
  objectUrl: string,
): Promise<BitmapDimensions | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      const dimensions = {
        width: bitmap.width,
        height: bitmap.height,
        source: 'bitmap' as const,
      }

      bitmap.close()

      if (dimensions.width > 0 && dimensions.height > 0) {
        return dimensions
      }
    } catch {
      // Fallback below: some formats or browsers do not support createImageBitmap.
    }
  }

  const imageElementDimensions = await readImageElementDimensions(objectUrl)

  if (
    imageElementDimensions &&
    imageElementDimensions.width > 0 &&
    imageElementDimensions.height > 0
  ) {
    return imageElementDimensions
  }

  return null
}

async function normalizeDimensions({
  rawMetadata,
  orientation,
  photo,
}: {
  rawMetadata: RawExifMetadata
  orientation: PhotoOrientationInfo
  photo: SelectedPhoto
}): Promise<PhotoDimensionsInfo> {
  const exifDimensions = buildExifDimensions(rawMetadata, orientation)
  if (exifDimensions) return exifDimensions

  const bitmapDimensions = await readBitmapDimensions(photo.file, photo.objectUrl)
  if (bitmapDimensions) {
    return {
      visualWidth: bitmapDimensions.width,
      visualHeight: bitmapDimensions.height,
      source: bitmapDimensions.source,
    }
  }

  return {
    source: 'unavailable',
  }
}

async function readExifMetadata(file: File) {
  const exifr = await loadExifr()

  return (await exifr.parse(file, {
    pick: [...EXIF_TAGS],
    reviveValues: false,
  })) as RawExifMetadata | undefined
}

function buildAnalysisResult({
  metadata,
  warnings,
}: {
  metadata: PhotoMetadata
  warnings: Set<PhotoAnalysisWarningCode>
}): PhotoAnalysis {
  const warningList = [...warnings]

  return {
    status: warningList.length > 0 ? 'completed-with-warnings' : 'completed',
    metadata,
    warnings: warningList,
    analyzedAt: Date.now(),
  }
}

export async function analyzeSelectedPhotoMetadata({
  photo,
  trip,
}: {
  photo: SelectedPhoto
  trip: Pick<BaseTrip, 'startDate' | 'endDate'>
}): Promise<PhotoAnalysis> {
  const warnings = new Set<PhotoAnalysisWarningCode>()
  let rawMetadata: RawExifMetadata = {}

  try {
    rawMetadata = (await readExifMetadata(photo.file)) ?? {}
  } catch {
    addWarning(warnings, 'metadata-read-failed')
  }

  const date = selectBestPhotoDate(rawMetadata, photo.file)
  const tripDay = assignPhotoToTripDay({
    photoDate: date,
    tripStartDate: trip.startDate,
    tripEndDate: trip.endDate,
  })
  const location = normalizeLocation(rawMetadata)
  const orientation = normalizeOrientation(rawMetadata.Orientation)
  const dimensions = await normalizeDimensions({
    rawMetadata,
    orientation,
    photo,
  })

  if (date.source === 'file-last-modified') {
    addWarning(warnings, 'using-file-date')
  }

  if (date.source === 'exif-modify') {
    addWarning(warnings, 'using-exif-modify-date')
  }

  if (date.source === 'unavailable') {
    addWarning(warnings, 'missing-date')
  }

  if (
    tripDay.status === 'before-trip' ||
    tripDay.status === 'after-trip'
  ) {
    addWarning(warnings, 'outside-trip-range')
  }

  if (location.status === 'invalid') {
    addWarning(warnings, 'invalid-gps')
  }

  if (dimensions.source === 'unavailable') {
    addWarning(warnings, 'missing-dimensions')
  }

  if (photo.previewStatus === 'unavailable') {
    addWarning(warnings, 'preview-unavailable')
  }

  if (isHeicFile(photo.file)) {
    addWarning(warnings, 'heic-partial-support')
  }

  return buildAnalysisResult({
    metadata: {
      originalFileName: photo.file.name,
      originalMimeType: photo.file.type,
      originalSize: photo.file.size,
      date,
      location,
      orientation,
      dimensions,
      tripDay,
    },
    warnings,
  })
}
