import type { PhotoAnalysis } from './photo-analysis'
import type { PhotoProcessing } from './photo-processing'
import type { PhotoPersistence } from './photo-persistence'
import type { PhotoUpload } from './photo-upload'

export type SelectedPhotoPreviewStatus = 'ready' | 'unavailable'

export type SelectedPhoto = {
  id: string
  file: File
  fingerprint: string
  objectUrl: string
  previewStatus: SelectedPhotoPreviewStatus
  analysis: PhotoAnalysis
  processing: PhotoProcessing
  upload: PhotoUpload
  persistence: PhotoPersistence
}
