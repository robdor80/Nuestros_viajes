import type { PhotoReviewData } from '../model/photo-review'
import type { SelectedPhoto } from '../model/selected-photo'
import { formatFileSize } from '../utils/photo-selection'
import styles from './PhotoProcessingList.module.css'

function getStatus(photo: SelectedPhoto) {
  switch (photo.processing.status) {
    case 'pending': return 'Pendiente'
    case 'processing': return 'Procesando…'
    case 'completed': return 'Preparada'
    case 'completed-with-warnings': return 'Preparada con aviso'
    case 'failed': return 'No se pudo procesar'
  }
}

function getErrorMessage(photo: SelectedPhoto) {
  switch (photo.processing.errorCode) {
    case 'decode-failed': return 'El navegador no ha podido leer este formato.'
    case 'webp-not-supported': return 'El navegador no puede generar WebP.'
    case 'conversion-failed': return 'No se ha podido convertir la imagen.'
    default: return null
  }
}

function getUploadStatus(photo: SelectedPhoto) {
  switch (photo.upload.status) {
    case 'pending': return 'Preparada para subir'
    case 'uploading': return `Subiendo: ${photo.upload.progress}%`
    case 'completed': return 'Subida correctamente'
    case 'failed': return 'No se pudo subir'
  }
}

function getPersistenceStatus(photo: SelectedPhoto) {
  switch (photo.persistence.status) {
    case 'pending': return 'Pendiente de guardar en el viaje'
    case 'saving': return 'Guardando en el viaje…'
    case 'completed': return 'Guardada en el viaje'
    case 'failed': return 'No se pudo guardar en el viaje'
  }
}

export function PhotoProcessingList({
  photos,
  reviews,
}: {
  photos: SelectedPhoto[]
  reviews: Record<string, PhotoReviewData>
}) {
  return <div className={styles.list} aria-label="Estado del procesamiento">
    {photos.map((photo) => {
      const output = photo.processing.result
      const errorMessage = getErrorMessage(photo)
      const title = reviews[photo.id]?.title || 'Fotografía sin nombre'
      return <article className={styles.item} key={photo.id}>
        <div className={styles.thumbnail} aria-hidden="true">
          <img src={output?.objectUrl ?? photo.objectUrl} alt="" />
        </div>
        <div className={styles.body}>
          <h3>{title}</h3>
          <p className={styles.originalFile}>Archivo original: {photo.file.name}</p>
          <p className={styles.status}>{getStatus(photo)}</p>
          {output && <p>WebP · {output.width} × {output.height} · {formatFileSize(output.sizeBytes)}</p>}
          {photo.processing.warnings.includes('large-output') && <p className={styles.warning}>El archivo sigue siendo grande tras comprimirlo.</p>}
          {errorMessage && <p className={styles.error}>{errorMessage}</p>}
          {output && <p className={photo.upload.status === 'failed' ? styles.error : styles.uploadStatus}>{getUploadStatus(photo)}</p>}
          {photo.upload.status === 'failed' && photo.upload.errorMessage && <p className={styles.error}>{photo.upload.errorMessage}</p>}
          {photo.upload.status === 'completed' && <p className={photo.persistence.status === 'failed' ? styles.error : styles.persistenceStatus}>{getPersistenceStatus(photo)}</p>}
          {photo.persistence.status === 'failed' && photo.persistence.errorMessage && <p className={styles.error}>{photo.persistence.errorMessage}</p>}
        </div>
      </article>
    })}
  </div>
}
