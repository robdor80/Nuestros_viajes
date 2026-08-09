import { useState } from 'react'

import type { TripPhoto } from '../model/photo'
import { getPhotoImageAttributes } from '../utils/photo-image'
import { getPhotoAlt, getPhotoLabel } from '../utils/photo-presentation'
import styles from './PhotoCard.module.css'

type PhotoCardProps = {
  photo: TripPhoto
  tripName: string
  index: number
  onOpen: (photo: TripPhoto) => void
}

export function PhotoCard({ photo, tripName, index, onOpen }: PhotoCardProps) {
  const attributes = getPhotoImageAttributes(photo, 'gallery')
  const [useFallback, setUseFallback] = useState(false)
  const label = getPhotoLabel(photo)
  const asset = photo.imageKitAsset

  if (!attributes || !asset) return null

  return (
    <article className={styles.card}>
      <button
        className={styles.imageButton}
        type="button"
        onClick={() => onOpen(photo)}
        aria-label={`Abrir ${getPhotoAlt(photo, tripName)}`}
      >
        <img
          src={useFallback ? attributes.fallbackSrc : attributes.src}
          srcSet={useFallback ? undefined : attributes.srcSet}
          sizes={useFallback ? undefined : attributes.sizes}
          width={asset.width}
          height={asset.height}
          alt={getPhotoAlt(photo, tripName)}
          loading={index === 0 ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setUseFallback(true)}
        />
      </button>
      {label && <p>{label}</p>}
    </article>
  )
}
