import type { SelectedPhoto } from '../model/selected-photo'
import { AddPhotoTile } from './AddPhotoTile'
import { SelectedPhotoCard } from './SelectedPhotoCard'
import styles from './PhotoSelectionGrid.module.css'

type PhotoSelectionGridProps = {
  photos: SelectedPhoto[]
  canAddMore: boolean
  onAddPhotos: () => void
  onPreviewError: (photoId: string) => void
  onRemove: (photoId: string) => void
}

export function PhotoSelectionGrid({
  photos,
  canAddMore,
  onAddPhotos,
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
      {canAddMore && <AddPhotoTile onClick={onAddPhotos} />}
    </div>
  )
}
