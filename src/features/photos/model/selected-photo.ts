import type { PhotoAnalysis } from './photo-analysis'
import type { PhotoProcessing } from './photo-processing'

export type SelectedPhotoPreviewStatus = 'ready' | 'unavailable'

export type SelectedPhoto = {
  id: string
  file: File
  fingerprint: string
  objectUrl: string
  previewStatus: SelectedPhotoPreviewStatus
  analysis: PhotoAnalysis
  processing: PhotoProcessing
}
