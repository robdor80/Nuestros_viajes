import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'

import { TripSectionIcon } from '../../trip-workspace/components/TripSectionIcon'
import { getTripWorkspacePath } from '../../trip-workspace/model/trip-workspace-section'
import type { BaseTrip } from '../../trips/model/trip'
import { PhotoGallery } from '../components/PhotoGallery'
import { PhotoLightbox } from '../components/PhotoLightbox'
import { usePhotos } from '../hooks/usePhotos'
import type { TripPhoto } from '../model/photo'
import styles from './PhotosPage.module.css'

export function PhotosPage() {
  const trip = useOutletContext<BaseTrip>()
  const navigate = useNavigate()
  const { photos, isLoading, error } = usePhotos(trip.id)
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const galleryPhotos = useMemo(
    () => photos.filter((photo): photo is TripPhoto & { imageKitAsset: NonNullable<TripPhoto['imageKitAsset']> } => Boolean(photo.imageKitAsset?.url)),
    [photos],
  )
  const photoCountLabel =
    galleryPhotos.length === 1
      ? '1 fotografía'
      : `${galleryPhotos.length} fotografías`

  const openPhotoUploadPage = () => {
    void navigate(`${getTripWorkspacePath(trip.id, 'fotos')}/subir`)
  }

  const openPhoto = (photo: TripPhoto) => {
    setSelectedPhotoId(photo.id)
  }

  return (
    <section aria-labelledby="photos-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Sección del viaje</p>
        <h2 id="photos-title">Fotos</h2>
        <p>Guarda aquí los mejores recuerdos de {trip.name}.</p>
      </header>

      {isLoading && (
        <div className={styles.state} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <div>
            <h3>Cargando fotografías…</h3>
            <p>Estamos recuperando los recuerdos guardados de este viaje.</p>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className={styles.state} role="alert">
          <div>
            <h3>No se han podido cargar las fotografías.</h3>
            <p>Prueba a recargar la sección dentro de unos segundos.</p>
          </div>
        </div>
      )}

      {!isLoading && !error && galleryPhotos.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.iconWrap} aria-hidden="true">
            <TripSectionIcon icon="photo" className={styles.icon} />
          </div>
          <div className={styles.emptyCopy}>
            <h3>Todavía no hay fotografías</h3>
            <p>
              Cuando empieces a añadirlas, aparecerán aquí organizadas para
              recordar cada momento del viaje.
            </p>
          </div>
          <button type="button" onClick={openPhotoUploadPage}>
            Añadir fotografías
          </button>
        </div>
      )}

      {!isLoading && !error && galleryPhotos.length > 0 && (
        <>
          <div className={styles.galleryToolbar}>
            <p>{photoCountLabel}</p>
            <button type="button" onClick={openPhotoUploadPage}>
              Añadir fotografías
            </button>
          </div>
          <PhotoGallery
            photos={galleryPhotos}
            tripName={trip.name}
            onOpen={openPhoto}
          />
        </>
      )}

      {selectedPhotoId && (
        <PhotoLightbox
          photos={galleryPhotos}
          selectedPhotoId={selectedPhotoId}
          tripName={trip.name}
          onClose={() => setSelectedPhotoId(null)}
          onSelect={setSelectedPhotoId}
        />
      )}
    </section>
  )
}
