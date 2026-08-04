import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import { TripSectionIcon } from '../../trip-workspace/components/TripSectionIcon'
import type { BaseTrip } from '../../trips/model/trip'
import { usePhotos } from '../hooks/usePhotos'
import styles from './PhotosPage.module.css'

export function PhotosPage() {
  const trip = useOutletContext<BaseTrip>()
  const { photos, isLoading, error } = usePhotos(trip.id)
  const [message, setMessage] = useState('')
  const photoCountLabel =
    photos.length === 1 ? '1 fotografía' : `${photos.length} fotografías`

  const announceNextPhase = () => {
    setMessage(
      'La subida de fotografías se añadirá en la siguiente fase.',
    )
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

      {!isLoading && !error && photos.length === 0 && (
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
          <button type="button" onClick={announceNextPhase}>
            Añadir fotografías
          </button>
          {message && (
            <p className={styles.statusMessage} role="status" aria-live="polite">
              {message}
            </p>
          )}
        </div>
      )}

      {!isLoading && !error && photos.length > 0 && (
        <div className={styles.summaryState}>
          <div className={styles.iconWrap} aria-hidden="true">
            <TripSectionIcon icon="photo" className={styles.icon} />
          </div>
          <div className={styles.emptyCopy}>
            <h3>{photoCountLabel} guardadas</h3>
            <p>
              La galería visual llegará en una próxima fase. Por ahora ya
              estamos leyendo el número real de fotografías guardadas en este
              viaje.
            </p>
          </div>
          <button type="button" onClick={announceNextPhase}>
            Añadir fotografías
          </button>
          {message && (
            <p className={styles.statusMessage} role="status" aria-live="polite">
              {message}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
