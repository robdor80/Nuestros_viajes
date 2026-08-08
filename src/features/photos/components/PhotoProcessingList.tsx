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

export function PhotoProcessingList({ photos }: { photos: SelectedPhoto[] }) {
  return <div className={styles.list} aria-label="Estado del procesamiento">
    {photos.map((photo) => {
      const output = photo.processing.result
      const errorMessage = getErrorMessage(photo)
      return <article className={styles.item} key={photo.id}>
        <div className={styles.thumbnail} aria-hidden="true">
          <img src={output?.objectUrl ?? photo.objectUrl} alt="" />
        </div>
        <div className={styles.body}>
          <h3>{photo.file.name}</h3>
          <p className={styles.status}>{getStatus(photo)}</p>
          {output && <p>WebP · {output.width} × {output.height} · {formatFileSize(output.sizeBytes)}</p>}
          {photo.processing.warnings.includes('large-output') && <p className={styles.warning}>El archivo sigue siendo grande tras comprimirlo.</p>}
          {errorMessage && <p className={styles.error}>{errorMessage}</p>}
        </div>
      </article>
    })}
  </div>
}
