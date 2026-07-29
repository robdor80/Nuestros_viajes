import { useAuth } from '../hooks/useAuth'
import styles from './PrivateAccessPage.module.css'

type PrivateAccessPageProps = {
  isLoading?: boolean
}

export function PrivateAccessPage({
  isLoading = false,
}: PrivateAccessPageProps) {
  const { error, isActionPending, signIn, clearError } = useAuth()

  return (
    <div className={styles.page}>
      <section className={styles.card} aria-labelledby="private-access-title">
        <p className={styles.eyebrow}>Nuestros viajes</p>
        <h1 id="private-access-title" className={styles.title}>
          Acceso privado a Nuestros viajes
        </h1>
        <p className={styles.description}>
          Inicia sesión con tu cuenta de Google para entrar en vuestro espacio
          de viajes.
        </p>

        {isLoading ? (
          <div className={styles.loading} role="status" aria-live="polite">
            <span className={styles.spinner} aria-hidden="true" />
            Comprobando la sesión…
          </div>
        ) : (
          <>
            {error && (
              <div className={styles.error} role="alert">
                <p>{error}</p>
                <button
                  type="button"
                  aria-label="Cerrar mensaje de error"
                  onClick={clearError}
                >
                  ×
                </button>
              </div>
            )}

            <button
              className={styles.googleButton}
              type="button"
              disabled={isActionPending}
              onClick={() => void signIn()}
            >
              <span className={styles.googleMark} aria-hidden="true">
                G
              </span>
              {isActionPending ? 'Abriendo Google…' : 'Entrar con Google'}
            </button>
          </>
        )}

        <p className={styles.note}>
          La sesión permanecerá iniciada en este dispositivo hasta que la
          cierres.
        </p>
      </section>
    </div>
  )
}
