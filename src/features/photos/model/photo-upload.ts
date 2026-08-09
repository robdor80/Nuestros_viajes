import type { PhotoImageKitAsset } from './photo'

export type PhotoUploadStatus =
  | 'pending'
  | 'uploading'
  | 'completed'
  | 'failed'

export type PhotoUploadErrorCode =
  | 'authentication-failed'
  | 'authentication-unavailable'
  | 'duplicate-file'
  | 'network-failed'
  | 'request-failed'
  | 'server-failed'
  | 'unknown'

export type PhotoUpload = {
  status: PhotoUploadStatus
  progress: number
  asset?: PhotoImageKitAsset
  errorCode?: PhotoUploadErrorCode
  errorMessage?: string
  uploadedAt?: number
}

export function createPendingPhotoUpload(): PhotoUpload {
  return { status: 'pending', progress: 0 }
}
