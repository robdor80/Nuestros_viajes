import { FirebaseError } from 'firebase/app'
import {
  Timestamp,
  collection,
  onSnapshot,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore'

import {
  firebaseConfigurationError,
  firestore,
} from '../../../infrastructure/firebase/firebaseClient'
import { cleanEmptyValues } from '../../../shared/utils/clean-empty-values'
import {
  photoAssetVisibilities,
  photoDateSources,
  photoSyncStatuses,
  type PhotoAssetVisibility,
  type PhotoCaptureMetadata,
  type PhotoDateSource,
  type PhotoEditableMetadata,
  type PhotoImageKitAsset,
  type PhotoOriginalMetadata,
  type PhotoSearchMetadata,
  type PhotoSyncStatus,
  type TripPhoto,
} from '../model/photo'

type PhotosSubscriber = (photos: TripPhoto[]) => void
type PhotosSubscriptionErrorHandler = (error: Error) => void
type PhotoOperation = 'load'

class PhotoServiceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'PhotoServiceError'
  }
}

function requireFirestore() {
  if (!firestore) {
    throw new PhotoServiceError(
      firebaseConfigurationError ?? 'Cloud Firestore no está disponible.',
    )
  }

  return firestore
}

function requireIdentifier(value: string, label: string) {
  if (!value.trim()) {
    throw new PhotoServiceError(`No se ha podido identificar ${label}.`)
  }
}

function optionalString(data: DocumentData, field: string) {
  const value = data[field]
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : undefined
}

function optionalNumber(data: DocumentData, field: string) {
  const value = data[field]
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined
}

function optionalTimestamp(data: DocumentData, field: string) {
  const value = data[field]
  return value instanceof Timestamp ? value.toDate().toISOString() : undefined
}

function optionalStringArray(data: DocumentData, field: string) {
  const value = data[field]
  if (!Array.isArray(value)) return undefined

  const strings = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)

  return strings.length > 0 ? strings : undefined
}

function optionalEnum<T extends string>(
  data: DocumentData,
  field: string,
  values: readonly T[],
) {
  const value = data[field]
  return typeof value === 'string' && values.includes(value as T)
    ? (value as T)
    : undefined
}

function optionalTrue(data: DocumentData, field: string) {
  return data[field] === true ? true : undefined
}

function optionalObject(data: DocumentData, field: string) {
  const value = data[field]
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as DocumentData)
    : undefined
}

function normalizeOriginalMetadata(
  data: DocumentData | undefined,
): PhotoOriginalMetadata | undefined {
  if (!data) return undefined

  return cleanEmptyValues({
    fileName: optionalString(data, 'fileName'),
    mimeType: optionalString(data, 'mimeType'),
    sizeBytes: optionalNumber(data, 'sizeBytes'),
    format: optionalString(data, 'format'),
    width: optionalNumber(data, 'width'),
    height: optionalNumber(data, 'height'),
    lastModifiedAt: optionalTimestamp(data, 'lastModifiedAt'),
  })
}

function normalizeCaptureMetadata(
  data: DocumentData | undefined,
): PhotoCaptureMetadata | undefined {
  if (!data) return undefined

  return cleanEmptyValues({
    capturedAt: optionalTimestamp(data, 'capturedAt'),
    dateSource: optionalEnum<PhotoDateSource>(
      data,
      'dateSource',
      photoDateSources,
    ),
    latitude: optionalNumber(data, 'latitude'),
    longitude: optionalNumber(data, 'longitude'),
    orientation: optionalNumber(data, 'orientation'),
    width: optionalNumber(data, 'width'),
    height: optionalNumber(data, 'height'),
    tripDay: optionalNumber(data, 'tripDay'),
  })
}

function normalizeEditableMetadata(
  data: DocumentData | undefined,
): PhotoEditableMetadata | undefined {
  if (!data) return undefined

  return cleanEmptyValues({
    title: optionalString(data, 'title'),
    description: optionalString(data, 'description'),
    placeId: optionalString(data, 'placeId'),
    placeName: optionalString(data, 'placeName'),
    city: optionalString(data, 'city'),
    country: optionalString(data, 'country'),
    capturedAt: optionalTimestamp(data, 'capturedAt'),
    tripDay: optionalNumber(data, 'tripDay'),
    people: optionalStringArray(data, 'people'),
    tags: optionalStringArray(data, 'tags'),
    favorite: optionalTrue(data, 'favorite'),
    featured: optionalTrue(data, 'featured'),
    altText: optionalString(data, 'altText'),
    caption: optionalString(data, 'caption'),
  })
}

function normalizeImageKitAsset(
  data: DocumentData | undefined,
): PhotoImageKitAsset | undefined {
  if (!data) return undefined

  const fileId = optionalString(data, 'fileId')
  const url = optionalString(data, 'url')
  const filePath = optionalString(data, 'filePath')
  const visibility = optionalEnum<PhotoAssetVisibility>(
    data,
    'visibility',
    photoAssetVisibilities,
  )

  if (!fileId || !url || !filePath || !visibility) {
    return undefined
  }

  return cleanEmptyValues({
    fileId,
    url,
    filePath,
    visibility,
    width: optionalNumber(data, 'width'),
    height: optionalNumber(data, 'height'),
    sizeBytes: optionalNumber(data, 'sizeBytes'),
    format: optionalString(data, 'format'),
    thumbnailUrl: optionalString(data, 'thumbnailUrl'),
  })
}

function normalizeSearchMetadata(
  data: DocumentData | undefined,
): PhotoSearchMetadata | undefined {
  if (!data) return undefined

  return cleanEmptyValues({
    normalizedText: optionalString(data, 'normalizedText'),
    tokens: optionalStringArray(data, 'tokens'),
  })
}

export function normalizeTripPhotoDocument(
  snapshot: DocumentSnapshot<DocumentData>,
  tripId: string,
): TripPhoto | null {
  if (!snapshot.exists()) return null

  const data = snapshot.data({ serverTimestamps: 'estimate' })
  const createdBy = optionalString(data, 'createdBy')
  const createdAt = optionalTimestamp(data, 'createdAt')
  const updatedAt = optionalTimestamp(data, 'updatedAt')
  const syncStatus = optionalEnum<PhotoSyncStatus>(
    data,
    'syncStatus',
    photoSyncStatuses,
  )

  if (!createdBy || !createdAt || !updatedAt || !syncStatus) {
    return null
  }

  return {
    id: snapshot.id,
    tripId,
    createdBy,
    createdAt,
    updatedAt,
    updatedBy: optionalString(data, 'updatedBy'),
    originalMetadata: normalizeOriginalMetadata(
      optionalObject(data, 'originalMetadata'),
    ),
    captureMetadata: normalizeCaptureMetadata(
      optionalObject(data, 'captureMetadata'),
    ),
    editableMetadata: normalizeEditableMetadata(
      optionalObject(data, 'editableMetadata'),
    ),
    imageKitAsset: normalizeImageKitAsset(optionalObject(data, 'imageKitAsset')),
    searchMetadata: normalizeSearchMetadata(
      optionalObject(data, 'searchMetadata'),
    ),
    syncStatus,
    syncError: optionalString(data, 'syncError'),
  }
}

function sortPhotos(photos: TripPhoto[]) {
  return [...photos].sort((firstPhoto, secondPhoto) => {
    const firstDate =
      firstPhoto.captureMetadata?.capturedAt ?? firstPhoto.createdAt
    const secondDate =
      secondPhoto.captureMetadata?.capturedAt ?? secondPhoto.createdAt
    const dateDifference = firstDate.localeCompare(secondDate)

    if (dateDifference !== 0) {
      return dateDifference
    }

    return firstPhoto.id.localeCompare(secondPhoto.id)
  })
}

const operationErrorMessages: Record<PhotoOperation, string> = {
  load: 'No se han podido cargar las fotografías. Inténtalo de nuevo.',
}

const permissionErrorMessages: Record<PhotoOperation, string> = {
  load: 'Firestore no permite consultar las fotografías con esta cuenta.',
}

function toPhotoServiceError(error: unknown, operation: PhotoOperation) {
  if (error instanceof PhotoServiceError) {
    return error
  }

  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        return new PhotoServiceError(permissionErrorMessages[operation], {
          cause: error,
        })
      case 'unavailable':
      case 'network-request-failed':
        return new PhotoServiceError(
          'No se ha podido conectar con Firestore. Comprueba tu conexión e inténtalo de nuevo.',
          { cause: error },
        )
    }
  }

  return new PhotoServiceError(operationErrorMessages[operation], {
    cause: error,
  })
}

export function subscribeToPhotos(
  tripId: string,
  onData: PhotosSubscriber,
  onError: PhotosSubscriptionErrorHandler,
) {
  try {
    requireIdentifier(tripId, 'el viaje')

    return onSnapshot(
      collection(requireFirestore(), 'trips', tripId, 'photos'),
      (photosSnapshot) => {
        const photos = photosSnapshot.docs
          .map((snapshot) => normalizeTripPhotoDocument(snapshot, tripId))
          .filter((photo): photo is TripPhoto => photo !== null)

        onData(sortPhotos(photos))
      },
      (error) => {
        onError(toPhotoServiceError(error, 'load'))
      },
    )
  } catch (error) {
    onError(toPhotoServiceError(error, 'load'))
    return () => undefined
  }
}
