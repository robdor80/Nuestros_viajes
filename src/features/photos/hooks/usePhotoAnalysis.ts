import { useEffect, useMemo, useRef } from 'react'

import type { BaseTrip } from '../../trips/model/trip'
import type { PhotoAnalysis } from '../model/photo-analysis'
import { createPendingPhotoAnalysis } from '../model/photo-analysis'
import type { SelectedPhoto } from '../model/selected-photo'
import { analyzeSelectedPhotoMetadata } from '../services/photo-metadata-service'
import { getPhotoAnalysisSummary } from '../utils/photo-analysis-summary'

const MAX_CONCURRENT_ANALYSES = 2

type UpdatePhotoAnalysis = (
  photoId: string,
  fingerprint: string,
  analysis: PhotoAnalysis,
) => boolean

function mergeLatestPhotoWarnings(
  analysis: PhotoAnalysis,
  latestPhoto: SelectedPhoto,
): PhotoAnalysis {
  if (
    latestPhoto.previewStatus !== 'unavailable' ||
    analysis.warnings.includes('preview-unavailable')
  ) {
    return analysis
  }

  const warnings = [...analysis.warnings, 'preview-unavailable' as const]

  return {
    ...analysis,
    status:
      analysis.status === 'completed' ? 'completed-with-warnings' : analysis.status,
    warnings,
  }
}

export function usePhotoAnalysis({
  photos,
  trip,
  updatePhotoAnalysis,
}: {
  photos: SelectedPhoto[]
  trip: Pick<BaseTrip, 'startDate' | 'endDate'>
  updatePhotoAnalysis: UpdatePhotoAnalysis
}) {
  const { startDate, endDate } = trip
  const mountedRef = useRef(true)
  const latestPhotosRef = useRef(photos)
  const activeAnalysesRef = useRef(new Set<string>())

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    latestPhotosRef.current = photos
  }, [photos])

  useEffect(() => {
    const queuedPhotos = photos.filter(
      (photo) =>
        photo.analysis.status === 'pending' &&
        !activeAnalysesRef.current.has(photo.id),
    )

    if (queuedPhotos.length === 0) return

    const queue = [...queuedPhotos]

    async function analyzePhoto(photo: SelectedPhoto) {
      activeAnalysesRef.current.add(photo.id)
      updatePhotoAnalysis(photo.id, photo.fingerprint, {
        ...createPendingPhotoAnalysis(),
        status: 'analyzing',
      })

      try {
        const analysis = await analyzeSelectedPhotoMetadata({
          photo,
          trip: {
            startDate,
            endDate,
          },
        })
        const latestPhoto = latestPhotosRef.current.find(
          (currentPhoto) =>
            currentPhoto.id === photo.id &&
            currentPhoto.fingerprint === photo.fingerprint,
        )

        if (mountedRef.current && latestPhoto) {
          updatePhotoAnalysis(
            photo.id,
            photo.fingerprint,
            mergeLatestPhotoWarnings(analysis, latestPhoto),
          )
        }
      } catch {
        const latestPhoto = latestPhotosRef.current.find(
          (currentPhoto) =>
            currentPhoto.id === photo.id &&
            currentPhoto.fingerprint === photo.fingerprint,
        )

        if (mountedRef.current && latestPhoto) {
          updatePhotoAnalysis(photo.id, photo.fingerprint, {
            status: 'failed',
            warnings: ['metadata-read-failed'],
            errorCode: 'analysis-failed',
            analyzedAt: Date.now(),
          })
        }
      } finally {
        activeAnalysesRef.current.delete(photo.id)
        runNext()
      }
    }

    function runNext() {
      if (!mountedRef.current) return
      if (activeAnalysesRef.current.size >= MAX_CONCURRENT_ANALYSES) return

      const nextPhoto = queue.shift()
      if (!nextPhoto) return

      void analyzePhoto(nextPhoto)
    }

    runNext()
    runNext()
  }, [endDate, photos, startDate, updatePhotoAnalysis])

  return useMemo(() => getPhotoAnalysisSummary(photos), [photos])
}
