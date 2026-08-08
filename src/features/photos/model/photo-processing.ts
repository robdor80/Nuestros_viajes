export type PhotoProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'completed-with-warnings'
  | 'failed'

export type PhotoProcessingWarningCode = 'large-output'

export type PhotoProcessingErrorCode =
  | 'decode-failed'
  | 'webp-not-supported'
  | 'conversion-failed'

export type ProcessedPhoto = {
  file: File
  objectUrl: string
  width: number
  height: number
  sizeBytes: number
  quality: number
}

export type PhotoProcessing = {
  status: PhotoProcessingStatus
  result?: ProcessedPhoto
  warnings: PhotoProcessingWarningCode[]
  errorCode?: PhotoProcessingErrorCode
  processedAt?: number
}

export function createPendingPhotoProcessing(): PhotoProcessing {
  return { status: 'pending', warnings: [] }
}
