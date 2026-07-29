import { useAuth } from '../../auth/hooks/useAuth'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
  const {
    clearError,
    error,
    isActionPending,
    signOut,
  } = useAuth()

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Ajustes</h1>

      <section className={styles.session} aria-labelledby="session-title">
        <h2 id="session-title" className={styles.sectionTitle}>
          Sesión
        </h2>
        <p className={styles.description}>
          Puedes cerrar la sesión de Google en este dispositivo.
        </p>

        <button
          className={styles.signOutButton}
          type="button"
          disabled={isActionPending}
          onClick={() => void signOut()}
        >
          {isActionPending ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </button>

        {error && (
          <div className={styles.error} role="alert">
            <span>{error}</span>
            <button
              type="button"
              aria-label="Cerrar mensaje de error"
              onClick={clearError}
            >
              ×
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
