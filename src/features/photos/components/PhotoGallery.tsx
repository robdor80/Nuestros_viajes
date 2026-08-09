import type { TripPhoto } from '../model/photo'
import { PhotoCard } from './PhotoCard'
import styles from './PhotoGallery.module.css'

type PhotoGalleryProps = {
  photos: TripPhoto[]
  tripName: string
  onOpen: (photo: TripPhoto) => void
}

export function PhotoGallery({ photos, tripName, onOpen }: PhotoGalleryProps) {
  return <div className={styles.gallery} aria-label="Galería de fotografías">
    {photos.map((photo, index) => <PhotoCard key={photo.id} photo={photo} tripName={tripName} index={index} onOpen={onOpen} />)}
  </div>
}
