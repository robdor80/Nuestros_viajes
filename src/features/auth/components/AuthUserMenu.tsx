import { useAuth } from '../hooks/useAuth'
import styles from './AuthUserMenu.module.css'

export function AuthUserMenu() {
  const { user, error, isActionPending, signOut, clearError } = useAuth()

  if (!user) {
    return null
  }

  const initials = user.displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={styles.account}>
      <div className={styles.identity}>
        {user.photoUrl ? (
          <img
            className={styles.avatar}
            src={user.photoUrl}
            alt=""
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={styles.avatarFallback} aria-hidden="true">
            {initials}
          </span>
        )}

        <div className={styles.details}>
          <strong>{user.displayName}</strong>
          <span>{user.email}</span>
          <span className={styles.uid} title={user.uid}>
            UID: {user.uid}
          </span>
        </div>
      </div>

      <button
        className={styles.signOutButton}
        type="button"
        disabled={isActionPending}
        onClick={() => void signOut()}
      >
        {isActionPending ? 'Cerrando…' : 'Cerrar sesión'}
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
    </div>
  )
}
