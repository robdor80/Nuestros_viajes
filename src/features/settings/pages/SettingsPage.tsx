import { ComingSoonPage } from '../../../shared/components/ComingSoonPage/ComingSoonPage'
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
    <ComingSoonPage
      eyebrow="Ajustes"
      title="Un espacio que se adaptará a nosotros."
      description="Aquí configuraremos más adelante las preferencias generales de Nuestros viajes."
    >
      <section className={styles.session} aria-labelledby="session-title">
        <h2 id="session-title" className={styles.title}>
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
    </ComingSoonPage>
  )
}
