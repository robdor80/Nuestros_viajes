import { Link } from 'react-router-dom'

import styles from './TripWorkspaceState.module.css'

type TripWorkspaceStateProps =
  | {
      state: 'loading'
    }
  | {
      state: 'error'
      message: string
      onRetry: () => void
    }
  | {
      state: 'not-found'
    }

export function TripWorkspaceState(props: TripWorkspaceStateProps) {
  if (props.state === 'loading') {
    return (
      <section className={styles.state} role="status" aria-live="polite">
        <span className={styles.spinner} aria-hidden="true" />
        <div>
          <h1>Cargando viaje…</h1>
          <p>Estamos preparando su espacio interior.</p>
        </div>
      </section>
    )
  }

  if (props.state === 'error') {
    return (
      <section className={styles.state} role="alert">
        <div>
          <p className={styles.eyebrow}>No hemos podido abrir el viaje</p>
          <h1>Ha ocurrido un problema.</h1>
          <p>{props.message}</p>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={props.onRetry}>
            Reintentar
          </button>
          <Link className={styles.secondaryAction} to="/">
            Volver a Inicio
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.state} role="status">
      <div>
        <p className={styles.eyebrow}>Espacio no disponible</p>
        <h1>Viaje no encontrado</h1>
        <p>No hemos podido encontrar este viaje o ya no está disponible.</p>
      </div>
      <div className={styles.actions}>
        <Link className={styles.primaryAction} to="/">
          Volver a Inicio
        </Link>
        <Link className={styles.secondaryAction} to="/mis-viajes">
          Volver a Mis viajes
        </Link>
      </div>
    </section>
  )
}
