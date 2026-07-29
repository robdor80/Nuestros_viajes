import { useAuth } from '../hooks/useAuth'
import type { AuthStatus } from '../context/AuthContext'
import styles from './AccessStatusPage.module.css'

type AccessStatusPageProps = {
  status: Extract<
    AuthStatus,
    'checkingAccess' | 'unauthorized' | 'error'
  >
}

export function AccessStatusPage({ status }: AccessStatusPageProps) {
  const {
    error,
    isActionPending,
    retryAccessCheck,
    signOut,
  } = useAuth()

  if (status === 'checkingAccess') {
    return (
      <div className={styles.page}>
        <section
          className={styles.card}
          aria-labelledby="checking-access-title"
        >
          <span className={styles.spinner} aria-hidden="true" />
          <h1 id="checking-access-title" className={styles.title}>
            Comprobando acceso…
          </h1>
          <p className={styles.description} role="status" aria-live="polite">
            Estamos verificando si esta cuenta puede entrar en Nuestros viajes.
          </p>
        </section>
      </div>
    )
  }

  const isUnauthorized = status === 'unauthorized'

  return (
    <div className={styles.page}>
      <section
        className={`${styles.card} ${
          isUnauthorized ? styles.unauthorizedCard : ''
        }`}
        aria-labelledby="access-status-title"
      >
        {!isUnauthorized && (
          <p className={styles.eyebrow}>Nuestros viajes</p>
        )}
        <h1 id="access-status-title" className={styles.title}>
          {isUnauthorized
            ? 'Cuenta no autorizada'
            : 'No se ha podido comprobar el acceso'}
        </h1>
        <p
          className={isUnauthorized ? styles.description : styles.error}
          role={isUnauthorized ? undefined : 'alert'}
        >
          {isUnauthorized
            ? 'Esta cuenta de Google no tiene acceso a Nuestros viajes.'
            : error}
        </p>

        <div className={styles.actions}>
          {!isUnauthorized && (
            <button
              className={styles.primaryButton}
              type="button"
              disabled={isActionPending}
              onClick={retryAccessCheck}
            >
              Reintentar
            </button>
          )}

          <button
            className={styles.secondaryButton}
            type="button"
            disabled={isActionPending}
            onClick={() => void signOut()}
          >
            {isActionPending ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </button>
        </div>
      </section>
    </div>
  )
}
