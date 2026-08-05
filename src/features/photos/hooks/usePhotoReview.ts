import { useCallback, useMemo, useState } from 'react'

import type { BaseTrip } from '../../trips/model/trip'
import type {
  PhotoReviewData,
  PhotoReviewDraft,
} from '../model/photo-review'
import type { SelectedPhoto } from '../model/selected-photo'
import {
  applyReviewDraft,
  createReviewFromPhoto,
  getPhotoReviewSummary,
  getTripDayOptions,
} from '../utils/photo-review'

export function usePhotoReview({
  photos,
  trip,
}: {
  photos: SelectedPhoto[]
  trip: Pick<BaseTrip, 'startDate' | 'endDate'>
}) {
  const { startDate, endDate } = trip
  const [reviewEdits, setReviewEdits] = useState<
    Record<string, PhotoReviewData>
  >({})

  const reviews = useMemo(() => {
    const nextReviews: Record<string, PhotoReviewData> = {}

    photos.forEach((photo) => {
      const editedReview = reviewEdits[photo.id]
      const canInitializeReview =
        photo.analysis.status !== 'pending' &&
        photo.analysis.status !== 'analyzing'

      if (editedReview?.fingerprint === photo.fingerprint) {
        nextReviews[photo.id] = editedReview
        return
      }

      if (canInitializeReview) {
        nextReviews[photo.id] = createReviewFromPhoto(photo)
      }
    })

    return nextReviews
  }, [photos, reviewEdits])

  const updateReview = useCallback(
    (photoId: string, draft: PhotoReviewDraft) => {
      const currentReview = reviews[photoId]
      if (!currentReview) return

      setReviewEdits((currentEdits) => ({
        ...currentEdits,
        [photoId]: applyReviewDraft({
          currentReview,
          draft,
          trip: {
            startDate,
            endDate,
          },
        }),
      }))
    },
    [endDate, reviews, startDate],
  )

  const removeReview = useCallback((photoId: string) => {
    setReviewEdits((currentEdits) => {
      if (!currentEdits[photoId]) return currentEdits

      const remainingEdits = { ...currentEdits }
      delete remainingEdits[photoId]

      return remainingEdits
    })
  }, [])

  const clearReviews = useCallback(() => {
    setReviewEdits({})
  }, [])

  const tripDayOptions = useMemo(
    () =>
      getTripDayOptions({
        startDate,
        endDate,
      }),
    [endDate, startDate],
  )
  const reviewSummary = useMemo(
    () => getPhotoReviewSummary({ photos, reviews }),
    [photos, reviews],
  )

  return {
    reviews,
    reviewSummary,
    tripDayOptions,
    updateReview,
    removeReview,
    clearReviews,
  }
}
