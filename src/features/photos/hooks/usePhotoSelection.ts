import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { PhotoAnalysis } from '../model/photo-analysis'
import type { PhotoProcessing } from '../model/photo-processing'
import type { PhotoPersistence } from '../model/photo-persistence'
import type { PhotoUpload } from '../model/photo-upload'
import type { SelectedPhoto } from '../model/selected-photo'
import {
  createSelectedPhoto,
  getLocalPhotoFingerprint,
  isValidImageFile,
  revokeSelectedPhotoUrl,
} from '../utils/photo-selection'

function buildSelectionMessage({
  addedCount,
  duplicateCount,
  invalidCount,
}: {
  addedCount: number
  duplicateCount: number
  invalidCount: number
}) {
  const messages = [
    addedCount > 0 &&
      `${addedCount} ${
        addedCount === 1 ? 'fotografía añadida' : 'fotografías añadidas'
      }.`,
    duplicateCount > 0 &&
      `${duplicateCount} ${
        duplicateCount === 1
          ? 'archivo ya estaba incluido'
          : 'archivos ya estaban incluidos'
      }.`,
    invalidCount > 0 &&
      `${invalidCount} ${
        invalidCount === 1
          ? 'archivo no era una imagen válida'
          : 'archivos no eran imágenes válidas'
      }.`,
  ].filter((message): message is string => Boolean(message))

  return messages.join(' ')
}

export function usePhotoSelection() {
  const [photos, setPhotos] = useState<SelectedPhoto[]>([])
  const [statusMessage, setStatusMessage] = useState('')
  const selectedPhotosRef = useRef<SelectedPhoto[]>([])

  const replacePhotos = useCallback((nextPhotos: SelectedPhoto[]) => {
    selectedPhotosRef.current = nextPhotos
    setPhotos(nextPhotos)
  }, [])

  useEffect(() => {
    return () => {
      selectedPhotosRef.current.forEach(revokeSelectedPhotoUrl)
      selectedPhotosRef.current = []
    }
  }, [])

  const totalSize = useMemo(
    () => photos.reduce((total, photo) => total + photo.file.size, 0),
    [photos],
  )

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList)

      if (files.length === 0) return

      const currentPhotos = selectedPhotosRef.current
      const existingFingerprints = new Set(
        currentPhotos.map((photo) => photo.fingerprint),
      )
      const acceptedPhotos: SelectedPhoto[] = []
      let duplicateCount = 0
      let invalidCount = 0

      files.forEach((file) => {
        if (!isValidImageFile(file)) {
          invalidCount += 1
          return
        }

        const fingerprint = getLocalPhotoFingerprint(file)
        if (existingFingerprints.has(fingerprint)) {
          duplicateCount += 1
          return
        }

        existingFingerprints.add(fingerprint)
        acceptedPhotos.push(createSelectedPhoto(file))
      })

      replacePhotos([...currentPhotos, ...acceptedPhotos])
      setStatusMessage(
        buildSelectionMessage({
          addedCount: acceptedPhotos.length,
          duplicateCount,
          invalidCount,
        }),
      )
    },
    [replacePhotos],
  )

  const markPreviewUnavailable = useCallback(
    (photoId: string) => {
      replacePhotos(
        selectedPhotosRef.current.map((photo) =>
          photo.id === photoId
            ? {
                ...photo,
                previewStatus: 'unavailable',
                analysis: photo.analysis.warnings.includes('preview-unavailable')
                  ? photo.analysis
                  : {
                      ...photo.analysis,
                      status:
                        photo.analysis.status === 'completed'
                          ? 'completed-with-warnings'
                          : photo.analysis.status,
                      warnings: [
                        ...photo.analysis.warnings,
                        'preview-unavailable',
                      ],
                    },
              }
            : photo,
        ),
      )
    },
    [replacePhotos],
  )

  const updatePhotoAnalysis = useCallback(
    (photoId: string, fingerprint: string, analysis: PhotoAnalysis) => {
      const currentPhotos = selectedPhotosRef.current
      const nextPhotos = currentPhotos.map((photo) =>
        photo.id === photoId && photo.fingerprint === fingerprint
          ? { ...photo, analysis }
          : photo,
      )
      const wasUpdated = nextPhotos.some(
        (photo, index) => photo !== currentPhotos[index],
      )

      if (wasUpdated) {
        replacePhotos(nextPhotos)
      }

      return wasUpdated
    },
    [replacePhotos],
  )

  const updatePhotoProcessing = useCallback(
    (photoId: string, fingerprint: string, processing: PhotoProcessing) => {
      const currentPhotos = selectedPhotosRef.current
      const currentPhoto = currentPhotos.find((photo) => photo.id === photoId)
      const nextPhotos = currentPhotos.map((photo) =>
        photo.id === photoId && photo.fingerprint === fingerprint
          ? { ...photo, processing }
          : photo,
      )
      const wasUpdated = nextPhotos.some(
        (photo, index) => photo !== currentPhotos[index],
      )

      if (wasUpdated) {
        const previousResult = currentPhoto?.processing.result
        if (previousResult && previousResult.objectUrl !== processing.result?.objectUrl) {
          URL.revokeObjectURL(previousResult.objectUrl)
        }
        replacePhotos(nextPhotos)
      }

      return wasUpdated
    },
    [replacePhotos],
  )

  const updatePhotoUpload = useCallback(
    (photoId: string, fingerprint: string, upload: PhotoUpload) => {
      const currentPhotos = selectedPhotosRef.current
      const nextPhotos = currentPhotos.map((photo) =>
        photo.id === photoId && photo.fingerprint === fingerprint
          ? { ...photo, upload }
          : photo,
      )
      const wasUpdated = nextPhotos.some(
        (photo, index) => photo !== currentPhotos[index],
      )

      if (wasUpdated) {
        replacePhotos(nextPhotos)
      }

      return wasUpdated
    },
    [replacePhotos],
  )

  const updatePhotoPersistence = useCallback(
    (photoId: string, fingerprint: string, persistence: PhotoPersistence) => {
      const currentPhotos = selectedPhotosRef.current
      const nextPhotos = currentPhotos.map((photo) =>
        photo.id === photoId && photo.fingerprint === fingerprint
          ? { ...photo, persistence }
          : photo,
      )
      const wasUpdated = nextPhotos.some(
        (photo, index) => photo !== currentPhotos[index],
      )

      if (wasUpdated) {
        replacePhotos(nextPhotos)
      }

      return wasUpdated
    },
    [replacePhotos],
  )

  const removePhoto = useCallback(
    (photoId: string) => {
      const currentPhotos = selectedPhotosRef.current
      const photoToRemove = currentPhotos.find((photo) => photo.id === photoId)

      if (photoToRemove) {
        revokeSelectedPhotoUrl(photoToRemove)
      }

      replacePhotos(currentPhotos.filter((photo) => photo.id !== photoId))
      setStatusMessage('Fotografía retirada de la selección.')
    },
    [replacePhotos],
  )

  const clearSelection = useCallback(() => {
    selectedPhotosRef.current.forEach(revokeSelectedPhotoUrl)
    replacePhotos([])
    setStatusMessage('Selección vaciada.')
  }, [replacePhotos])

  const discardSelection = useCallback(() => {
    selectedPhotosRef.current.forEach(revokeSelectedPhotoUrl)
    replacePhotos([])
    setStatusMessage('')
  }, [replacePhotos])

  return {
    photos,
    statusMessage,
    totalSize,
    hasSelection: photos.length > 0,
    addFiles,
    markPreviewUnavailable,
    updatePhotoAnalysis,
    updatePhotoProcessing,
    updatePhotoUpload,
    updatePhotoPersistence,
    removePhoto,
    clearSelection,
    discardSelection,
  }
}
