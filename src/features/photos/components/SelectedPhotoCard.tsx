import type { SelectedPhoto } from '../model/selected-photo'
import { formatFileSize } from '../utils/photo-selection'
import styles from './SelectedPhotoCard.module.css'

type SelectedPhotoCardProps = {
  photo: SelectedPhoto
  onPreviewError: (photoId: string) => void
  onRemove: (photoId: string) => void
}

function getAnalysisIndicator(photo: SelectedPhoto) {
  const { analysis } = photo

  if (analysis.status === 'pending' || analysis.status === 'analyzing') {
    return {
      className: styles.analysisIndicatorAnalyzing,
      label: `Analizando metadatos de ${photo.file.name}`,
    }
  }

  if (analysis.status === 'failed') {
    return {
      className: styles.analysisIndicatorWarning,
      label: `No se pudieron analizar los metadatos de ${photo.file.name}`,
    }
  }

  if (analysis.status === 'completed-with-warnings') {
    return {
      className: styles.analysisIndicatorWarning,
      label: `Los metadatos de ${photo.file.name} necesitan revisión`,
    }
  }

  return null
}

export function SelectedPhotoCard({
  photo,
  onPreviewError,
  onRemove,
}: SelectedPhotoCardProps) {
  const hasPreview = photo.previewStatus === 'ready'
  const analysisIndicator = getAnalysisIndicator(photo)

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
        {analysisIndicator && (
          <span
            className={`${styles.analysisIndicator} ${analysisIndicator.className}`}
            role="img"
            aria-label={analysisIndicator.label}
            title={analysisIndicator.label}
          />
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
