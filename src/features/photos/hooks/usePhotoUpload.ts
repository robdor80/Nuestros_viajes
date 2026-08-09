import { useCallback, useMemo, useRef, useState } from 'react'

import type { PhotoUpload } from '../model/photo-upload'
import type { SelectedPhoto } from '../model/selected-photo'
import {
  ImageKitUploadError,
  uploadProcessedPhoto,
} from '../services/imagekit-upload-service'

const MAX_CONCURRENT_UPLOADS = 2

type PhotoUploadSummary = Record<PhotoUpload['status'], number> & { total: number }

function getUploadSummary(photos: SelectedPhoto[]): PhotoUploadSummary {
  return photos.reduce<PhotoUploadSummary>(
    (summary, photo) => {
      summary.total += 1
      summary[photo.upload.status] += 1
      return summary
    },
    { total: 0, pending: 0, uploading: 0, completed: 0, failed: 0 },
  )
}

export function usePhotoUpload({
  photos,
  tripId,
  updatePhotoUpload,
}: {
  photos: SelectedPhoto[]
  tripId: string
  updatePhotoUpload: (
    photoId: string,
    fingerprint: string,
    upload: PhotoUpload,
  ) => boolean
}) {
  const [isUploading, setIsUploading] = useState(false)
  const uploadActiveRef = useRef(false)
  const summary = useMemo(() => getUploadSummary(photos), [photos])

  const uploadPhotos = useCallback(async () => {
    if (uploadActiveRef.current) return

    const queue = photos.filter(
      (photo) =>
        (photo.processing.status === 'completed' ||
          photo.processing.status === 'completed-with-warnings') &&
        photo.processing.result &&
        (photo.upload.status === 'pending' || photo.upload.status === 'failed'),
    )

    if (queue.length === 0) return

    uploadActiveRef.current = true
    setIsUploading(true)

    const uploadNext = async () => {
      while (queue.length > 0) {
        const photo = queue.shift()
        if (!photo?.processing.result) continue

        const uploading: PhotoUpload = { status: 'uploading', progress: 0 }
        updatePhotoUpload(photo.id, photo.fingerprint, uploading)

        try {
          const asset = await uploadProcessedPhoto({
            tripId,
            photoId: photo.id,
            file: photo.processing.result.file,
            onProgress: (progress) => {
              updatePhotoUpload(photo.id, photo.fingerprint, {
                status: 'uploading',
                progress,
              })
            },
          })
          updatePhotoUpload(photo.id, photo.fingerprint, {
            status: 'completed',
            progress: 100,
            asset,
            uploadedAt: Date.now(),
          })
        } catch (error) {
          const uploadError =
            error instanceof ImageKitUploadError
              ? error
              : new ImageKitUploadError(
                  'Ha ocurrido un error inesperado al subir la fotografía.',
                  'unknown',
                )
          updatePhotoUpload(photo.id, photo.fingerprint, {
            status: 'failed',
            progress: 0,
            errorCode: uploadError.code,
            errorMessage: uploadError.message,
          })
        }
      }
    }

    try {
      await Promise.all(
        Array.from(
          { length: Math.min(MAX_CONCURRENT_UPLOADS, queue.length) },
          uploadNext,
        ),
      )
    } finally {
      uploadActiveRef.current = false
      setIsUploading(false)
    }
  }, [photos, tripId, updatePhotoUpload])

  return { isUploading, summary, uploadPhotos }
}
