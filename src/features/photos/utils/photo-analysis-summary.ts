import type { PhotoAnalysisSummary } from '../model/photo-analysis'
import type { SelectedPhoto } from '../model/selected-photo'

function photoNeedsReview(photo: SelectedPhoto) {
  return (
    photo.analysis.status === 'failed' ||
    photo.analysis.warnings.some((warning) =>
      [
        'using-file-date',
        'using-exif-modify-date',
        'missing-date',
        'outside-trip-range',
        'missing-dimensions',
        'invalid-gps',
        'preview-unavailable',
        'heic-partial-support',
        'metadata-read-failed',
      ].includes(warning),
    )
  )
}

export function getPhotoAnalysisSummary(
  photos: SelectedPhoto[],
): PhotoAnalysisSummary {
  return photos.reduce<PhotoAnalysisSummary>(
    (summary, photo) => {
      const { analysis } = photo
      const { metadata } = analysis

      summary.total += 1
      summary.totalOriginalSize += metadata?.originalSize ?? photo.file.size

      if (analysis.status === 'pending') summary.pending += 1
      if (analysis.status === 'analyzing') summary.analyzing += 1
      if (analysis.status === 'completed') summary.completed += 1
      if (analysis.status === 'completed-with-warnings') {
        summary.completedWithWarnings += 1
      }
      if (analysis.status === 'failed') summary.failed += 1

      if (metadata?.date.source === 'exif-original') {
        summary.withExifDate += 1
      }
      if (metadata?.date.source === 'file-last-modified') {
        summary.withFallbackDate += 1
      }
      if (metadata?.date.source === 'unavailable') {
        summary.withoutDate += 1
      }
      if (metadata?.date.confidence === 'low') {
        summary.lowConfidenceDate += 1
      }
      if (metadata?.location.status === 'available') {
        summary.withGps += 1
      }
      if (metadata?.tripDay.status === 'before-trip') {
        summary.beforeTrip += 1
      }
      if (metadata?.tripDay.status === 'after-trip') {
        summary.afterTrip += 1
      }
      if (
        metadata?.tripDay.status === 'before-trip' ||
        metadata?.tripDay.status === 'after-trip'
      ) {
        summary.outsideTrip += 1
      }
      if (photoNeedsReview(photo)) {
        summary.needsReview += 1
      }

      return summary
    },
    {
      total: 0,
      pending: 0,
      analyzing: 0,
      completed: 0,
      completedWithWarnings: 0,
      failed: 0,
      withExifDate: 0,
      withFallbackDate: 0,
      withoutDate: 0,
      lowConfidenceDate: 0,
      withGps: 0,
      beforeTrip: 0,
      afterTrip: 0,
      outsideTrip: 0,
      needsReview: 0,
      totalOriginalSize: 0,
    },
  )
}
