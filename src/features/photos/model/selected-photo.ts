export type SelectedPhotoPreviewStatus = 'ready' | 'unavailable'

export type SelectedPhoto = {
  id: string
  file: File
  fingerprint: string
  objectUrl: string
  previewStatus: SelectedPhotoPreviewStatus
}
