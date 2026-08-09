import { useCallback, useEffect, useId, useRef, useState } from 'react'

import type { TripPhoto } from '../model/photo'
import { getPhotoImageAttributes } from '../utils/photo-image'
import {
  formatPhotoDate,
  getPhotoAlt,
  getPhotoLabel,
  getPhotoLocationLabel,
} from '../utils/photo-presentation'
import styles from './PhotoLightbox.module.css'

type PhotoLightboxProps = {
  photos: TripPhoto[]
  selectedPhotoId: string
  tripName: string
  onClose: () => void
  onSelect: (photoId: string) => void
}

export function PhotoLightbox({
  photos,
  selectedPhotoId,
  tripName,
  onClose,
  onSelect,
}: PhotoLightboxProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const pointerStartX = useRef<number | null>(null)
  const onCloseRef = useRef(onClose)
  const returnFocusRef = useRef<HTMLElement | null>(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  )
  const photoCountRef = useRef(photos.length)
  const selectRelativePhotoRef = useRef<(offset: number) => void>(() => undefined)
  const [useFallback, setUseFallback] = useState(false)
  const selectedIndex = photos.findIndex((photo) => photo.id === selectedPhotoId)
  const photo = photos[selectedIndex]
  const attributes = photo ? getPhotoImageAttributes(photo, 'lightbox') : null

  const selectRelativePhoto = useCallback((offset: number) => {
    const nextIndex = (selectedIndex + offset + photos.length) % photos.length
    const nextPhoto = photos[nextIndex]
    if (nextPhoto) {
      setUseFallback(false)
      onSelect(nextPhoto.id)
    }
  }, [onSelect, photos, selectedIndex])

  useEffect(() => {
    onCloseRef.current = onClose
    selectRelativePhotoRef.current = selectRelativePhoto
  }, [onClose, selectRelativePhoto])

  useEffect(() => {
    photoCountRef.current = photos.length
  }, [photos.length])

  useEffect(() => {
    const returnFocus = returnFocusRef.current
    closeButtonRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
      }
      if (event.key === 'ArrowLeft' && photoCountRef.current > 1) {
        event.preventDefault()
        selectRelativePhotoRef.current(-1)
      }
      if (event.key === 'ArrowRight' && photoCountRef.current > 1) {
        event.preventDefault()
        selectRelativePhotoRef.current(1)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      window.requestAnimationFrame(() => returnFocus?.focus())
    }
  }, [])

  if (!photo || !attributes || !photo.imageKitAsset) return null

  const label = getPhotoLabel(photo) || 'Fotografía'
  const date = formatPhotoDate(photo)
  const location = getPhotoLocationLabel(photo)
  const tripDay = photo.editableMetadata?.tripDay
  const hasNavigation = photos.length > 1

  return (
    <div
      className={styles.backdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={styles.topBar}>
          <p>{selectedIndex + 1} / {photos.length}</p>
          <button ref={closeButtonRef} type="button" onClick={onClose}>Cerrar</button>
        </div>

        <div
          className={styles.imageStage}
          onPointerDown={(event) => {
            pointerStartX.current = event.pointerType === 'touch' ? event.clientX : null
          }}
          onPointerUp={(event) => {
            if (pointerStartX.current === null) return
            const delta = event.clientX - pointerStartX.current
            pointerStartX.current = null
            if (Math.abs(delta) < 56 || !hasNavigation) return
            selectRelativePhoto(delta < 0 ? 1 : -1)
          }}
          onPointerCancel={() => { pointerStartX.current = null }}
        >
          <img
            src={useFallback ? attributes.fallbackSrc : attributes.src}
            srcSet={useFallback ? undefined : attributes.srcSet}
            sizes={useFallback ? undefined : attributes.sizes}
            width={photo.imageKitAsset.width}
            height={photo.imageKitAsset.height}
            alt={getPhotoAlt(photo, tripName)}
            decoding="async"
            onError={() => setUseFallback(true)}
          />
          {hasNavigation && <>
            <button className={styles.previousButton} type="button" onClick={() => selectRelativePhoto(-1)} aria-label="Fotografía anterior">‹</button>
            <button className={styles.nextButton} type="button" onClick={() => selectRelativePhoto(1)} aria-label="Fotografía siguiente">›</button>
          </>}
        </div>

        <div className={styles.details}>
          <h2 id={titleId}>{label}</h2>
          {(date || tripDay || location) && <p className={styles.meta}>{[date, tripDay ? `Día ${tripDay}` : null, location].filter(Boolean).join(' · ')}</p>}
          {photo.editableMetadata?.description && <p>{photo.editableMetadata.description}</p>}
        </div>
      </div>
    </div>
  )
}
