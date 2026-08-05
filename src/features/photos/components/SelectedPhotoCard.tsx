import type { SelectedPhoto } from '../model/selected-photo'
import { formatFileSize } from '../utils/photo-selection'
import styles from './SelectedPhotoCard.module.css'

type SelectedPhotoCardProps = {
  photo: SelectedPhoto
  onPreviewError: (photoId: string) => void
  onRemove: (photoId: string) => void
}

export function SelectedPhotoCard({
  photo,
  onPreviewError,
  onRemove,
}: SelectedPhotoCardProps) {
  const hasPreview = photo.previewStatus === 'ready'

  return (
    <article className={styles.card}>
      <div className={styles.preview}>
        {hasPreview ? (
          <img
            src={photo.objectUrl}
            alt={`Vista previa de ${photo.file.name}`}
            loading="lazy"
            decoding="async"
            onError={() => onPreviewError(photo.id)}
          />
        ) : (
          <div
            className={styles.previewFallback}
            role="img"
            aria-label="Vista previa no disponible"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 5h16v14H4z" />
              <path d="m4 17 5-5 4 4 2-2 5 5" />
              <path d="M8.5 9.5h.01" />
            </svg>
            <span>Vista previa no disponible</span>
          </div>
        )}
        <button
          className={styles.removeButton}
          type="button"
          aria-label={`Retirar ${photo.file.name}`}
          onClick={() => onRemove(photo.id)}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className={styles.details}>
        <h4 title={photo.file.name}>{photo.file.name}</h4>
        <p>{formatFileSize(photo.file.size)}</p>
        {!hasPreview && (
          <p className={styles.hint}>
            La compatibilidad se comprobará en una fase posterior.
          </p>
        )}
      </div>
    </article>
  )
}
