import { useCallback, useMemo, useRef, useState } from 'react'

import type { PhotoPersistence } from '../model/photo-persistence'
import type { PhotoReviewData } from '../model/photo-review'
import type { SelectedPhoto } from '../model/selected-photo'
import { saveTripPhoto } from '../services/photo-service'

const MAX_CONCURRENT_SAVES = 2

type PhotoPersistenceSummary = Record<PhotoPersistence['status'], number> & {
  total: number
}

function getPersistenceSummary(photos: SelectedPhoto[]): PhotoPersistenceSummary {
  return photos.reduce<PhotoPersistenceSummary>(
    (summary, photo) => {
      summary.total += 1
      summary[photo.persistence.status] += 1
      return summary
    },
    { total: 0, pending: 0, saving: 0, completed: 0, failed: 0 },
  )
}

export function usePhotoPersistence({
  photos,
  reviews,
  tripId,
  userId,
  updatePhotoPersistence,
}: {
  photos: SelectedPhoto[]
  reviews: Record<string, PhotoReviewData>
  tripId: string
  userId: string | undefined
  updatePhotoPersistence: (
    photoId: string,
    fingerprint: string,
    persistence: PhotoPersistence,
  ) => boolean
}) {
  const [isSaving, setIsSaving] = useState(false)
  const saveActiveRef = useRef(false)
  const summary = useMemo(() => getPersistenceSummary(photos), [photos])

  const savePhotos = useCallback(async () => {
    if (saveActiveRef.current) return

    const queue = photos.filter(
      (photo) =>
        photo.upload.status === 'completed' &&
        photo.upload.asset &&
        reviews[photo.id] &&
        (photo.persistence.status === 'pending' ||
          photo.persistence.status === 'failed'),
    )

    if (queue.length === 0) return

    saveActiveRef.current = true
    setIsSaving(true)

    const saveNext = async () => {
      while (queue.length > 0) {
        const photo = queue.shift()
        const review = photo && reviews[photo.id]
        if (!photo || !review) continue

        updatePhotoPersistence(photo.id, photo.fingerprint, {
          status: 'saving',
        })

        try {
          await saveTripPhoto({
            tripId,
            photo,
            review,
            userId: userId ?? '',
          })
          updatePhotoPersistence(photo.id, photo.fingerprint, {
            status: 'completed',
            savedAt: Date.now(),
          })
        } catch (error) {
          updatePhotoPersistence(photo.id, photo.fingerprint, {
            status: 'failed',
            errorMessage:
              error instanceof Error
                ? error.message
                : 'No se ha podido guardar la fotografía en el viaje.',
          })
        }
      }
    }

    try {
      await Promise.all(
        Array.from(
          { length: Math.min(MAX_CONCURRENT_SAVES, queue.length) },
          saveNext,
        ),
      )
    } finally {
      saveActiveRef.current = false
      setIsSaving(false)
    }
  }, [photos, reviews, tripId, updatePhotoPersistence, userId])

  return { isSaving, summary, savePhotos }
}
