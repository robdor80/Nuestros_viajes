import { createPendingPhotoAnalysis } from '../model/photo-analysis'
import { createPendingPhotoProcessing } from '../model/photo-processing'
import { createPendingPhotoPersistence } from '../model/photo-persistence'
import { createPendingPhotoUpload } from '../model/photo-upload'
import type { SelectedPhoto } from '../model/selected-photo'

export function createSelectedPhotoId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function getLocalPhotoFingerprint(file: File) {
  return [file.name, file.size, file.lastModified, file.type].join('|')
}

export function isValidImageFile(file: File) {
  return file.type.startsWith('image/') && file.size > 0
}

export function createSelectedPhoto(file: File): SelectedPhoto {
  return {
    id: createSelectedPhotoId(),
    file,
    fingerprint: getLocalPhotoFingerprint(file),
    objectUrl: URL.createObjectURL(file),
    previewStatus: 'ready',
    analysis: createPendingPhotoAnalysis(),
    processing: createPendingPhotoProcessing(),
    upload: createPendingPhotoUpload(),
    persistence: createPendingPhotoPersistence(),
  }
}

export function revokeSelectedPhotoUrl(photo: SelectedPhoto) {
  URL.revokeObjectURL(photo.objectUrl)
  if (photo.processing.result) {
    URL.revokeObjectURL(photo.processing.result.objectUrl)
  }
}

export function formatFileSize(sizeInBytes: number) {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`
  }

  const sizeInKilobytes = sizeInBytes / 1024
  if (sizeInKilobytes < 1024) {
    return `${sizeInKilobytes.toLocaleString('es-ES', {
      maximumFractionDigits: 1,
    })} KB`
  }

  return `${(sizeInKilobytes / 1024).toLocaleString('es-ES', {
    maximumFractionDigits: 1,
  })} MB`
}
