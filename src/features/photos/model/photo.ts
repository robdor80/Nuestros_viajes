export const photoDateSources = [
  'exif',
  'file',
  'manual',
  'unknown',
] as const

export type PhotoDateSource = (typeof photoDateSources)[number]

export const photoAssetVisibilities = ['public', 'private'] as const

export type PhotoAssetVisibility =
  (typeof photoAssetVisibilities)[number]

export const photoSyncStatuses = [
  'ready',
  'metadata_pending',
  'delete_pending',
  'error',
] as const

export type PhotoSyncStatus = (typeof photoSyncStatuses)[number]

export type PhotoOriginalMetadata = {
  fileName?: string
  mimeType?: string
  sizeBytes?: number
  format?: string
  width?: number
  height?: number
  lastModifiedAt?: string
}

export type PhotoCaptureMetadata = {
  capturedAt?: string
  dateSource?: PhotoDateSource
  latitude?: number
  longitude?: number
  orientation?: number
  width?: number
  height?: number
  tripDay?: number
}

export type PhotoEditableMetadata = {
  title?: string
  description?: string
  placeId?: string
  placeName?: string
  city?: string
  country?: string
  capturedAt?: string
  tripDay?: number
  people?: string[]
  tags?: string[]
  favorite?: true
  featured?: true
  altText?: string
  caption?: string
}

export type PhotoImageKitAsset = {
  fileId: string
  url: string
  filePath: string
  visibility: PhotoAssetVisibility
  width?: number
  height?: number
  sizeBytes?: number
  format?: string
  thumbnailUrl?: string
}

export type PhotoSearchMetadata = {
  normalizedText?: string
  tokens?: string[]
}

export type TripPhoto = {
  id: string
  tripId: string
  createdBy: string
  createdAt: string
  updatedAt: string
  updatedBy?: string
  originalMetadata?: PhotoOriginalMetadata
  captureMetadata?: PhotoCaptureMetadata
  editableMetadata?: PhotoEditableMetadata
  imageKitAsset?: PhotoImageKitAsset
  searchMetadata?: PhotoSearchMetadata
  syncStatus: PhotoSyncStatus
  syncError?: string
}

export type PhotosLoadError = string | null
