import { useCallback, useMemo, useRef, useState } from 'react'

import type { PhotoProcessing } from '../model/photo-processing'
import type { SelectedPhoto } from '../model/selected-photo'
import { PhotoProcessingError, processPhotoLocally } from '../services/photo-processing-service'

type UpdatePhotoProcessing = (photoId: string, fingerprint: string, processing: PhotoProcessing) => boolean

function getProcessingErrorCode(error: unknown): PhotoProcessing['errorCode'] {
  return error instanceof PhotoProcessingError ? error.code : 'conversion-failed'
}

export function usePhotoProcessing({ photos, updatePhotoProcessing }: { photos: SelectedPhoto[]; updatePhotoProcessing: UpdatePhotoProcessing }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const processingInProgressRef = useRef(false)
  const summary = useMemo(() => photos.reduce((current, photo) => {
    current.total += 1
    current[photo.processing.status] += 1
    return current
  }, {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    'completed-with-warnings': 0,
    failed: 0,
  }), [photos])

  const processPhotos = useCallback(async () => {
    if (processingInProgressRef.current) return
    const queue = photos.filter((photo) => photo.processing.status === 'pending' || photo.processing.status === 'failed')
    if (queue.length === 0) return

    processingInProgressRef.current = true
    setIsProcessing(true)
    try {
      for (const photo of queue) {
        updatePhotoProcessing(photo.id, photo.fingerprint, { status: 'processing', warnings: [] })
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0))

        try {
          const { result, isLarge } = await processPhotoLocally({
            file: photo.file,
            orientation: photo.analysis.metadata?.orientation.value,
          })
          const updated = updatePhotoProcessing(photo.id, photo.fingerprint, {
            status: isLarge ? 'completed-with-warnings' : 'completed',
            result,
            warnings: isLarge ? ['large-output'] : [],
            processedAt: Date.now(),
          })
          if (!updated) URL.revokeObjectURL(result.objectUrl)
        } catch (error) {
          updatePhotoProcessing(photo.id, photo.fingerprint, {
            status: 'failed',
            warnings: [],
            errorCode: getProcessingErrorCode(error),
            processedAt: Date.now(),
          })
        }
      }
    } finally {
      processingInProgressRef.current = false
      setIsProcessing(false)
    }
  }, [photos, updatePhotoProcessing])

  return { isProcessing, processPhotos, summary }
}
