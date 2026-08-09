import type { PhotoReviewData } from '../model/photo-review'
import type { SelectedPhoto } from '../model/selected-photo'
import {
  describePhotoReviewStatus,
  formatPhotoReviewMeta,
  shouldPhotoNeedReview,
} from '../utils/photo-review'
import styles from './PhotoReviewList.module.css'

type TripDayOption = {
  dayNumber: number
  date: string
  label: string
}

type PhotoReviewListProps = {
  photos: SelectedPhoto[]
  reviews: Record<string, PhotoReviewData>
  tripDayOptions: TripDayOption[]
  onEditPhoto: (photoId: string) => void
}

export function PhotoReviewList({
  photos,
  reviews,
  tripDayOptions,
  onEditPhoto,
}: PhotoReviewListProps) {
  return (
    <div className={styles.list} aria-label="Fotografías para revisar">
      {photos.map((photo) => {
        const review = reviews[photo.id]
        const status = describePhotoReviewStatus({ photo, review })
        const meta = formatPhotoReviewMeta({ review, tripDayOptions })
        const needsReview = shouldPhotoNeedReview(photo) && !review?.isConfirmed
        const hasLocation = photo.analysis.metadata?.location.status === 'available'
        const title = review?.title || 'Fotografía sin nombre'

        return (
          <button
            key={photo.id}
            className={styles.item}
            type="button"
            onClick={() => onEditPhoto(photo.id)}
            aria-label={`Editar ${title}. ${status}. ${meta.join(', ')}`}
          >
            <span className={styles.thumbnail} aria-hidden="true">
              {photo.previewStatus === 'ready' ? (
                <img src={photo.objectUrl} alt="" loading="lazy" />
              ) : (
                <span className={styles.thumbnailFallback}>Foto</span>
              )}
            </span>
            <span className={styles.itemBody}>
              <span className={styles.itemTitle}>{title}</span>
              <span className={styles.itemMeta}>
                {[status, ...meta].join(' · ') || 'Sin datos de fecha'}
              </span>
              {hasLocation && (
                <span className={styles.location}>Ubicación disponible</span>
              )}
            </span>
            <span
              className={
                needsReview ? styles.statusNeedsReview : styles.statusReady
              }
              aria-hidden="true"
            >
              {needsReview ? '!' : '✓'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
