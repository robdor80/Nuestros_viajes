import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import { TripSectionIcon } from '../../trip-workspace/components/TripSectionIcon'
import type { BaseTrip } from '../../trips/model/trip'
import styles from './PhotosPage.module.css'

export function PhotosPage() {
  const trip = useOutletContext<BaseTrip>()
  const [message, setMessage] = useState('')

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
    </section>
  )
}
