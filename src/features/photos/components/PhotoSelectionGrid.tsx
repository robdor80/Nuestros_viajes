import type { SelectedPhoto } from '../model/selected-photo'
import { SelectedPhotoCard } from './SelectedPhotoCard'
import styles from './PhotoSelectionGrid.module.css'

type PhotoSelectionGridProps = {
  photos: SelectedPhoto[]
  onPreviewError: (photoId: string) => void
  onRemove: (photoId: string) => void
}

export function PhotoSelectionGrid({
  photos,
  onPreviewError,
  onRemove,
}: PhotoSelectionGridProps) {
  return (
    <div className={styles.grid} aria-label="Fotografías seleccionadas">
      {photos.map((photo) => (
        <SelectedPhotoCard
          key={photo.id}
          photo={photo}
          onPreviewError={onPreviewError}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}
