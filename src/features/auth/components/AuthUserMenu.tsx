import { useAuth } from '../hooks/useAuth'
import styles from './AuthUserMenu.module.css'

export function AuthUserMenu() {
  const { user, signOut, isActionPending } = useAuth()

  if (!user) {
    return null
  }

  const initial = Array.from(user.displayName.trim())[0]?.toUpperCase() ?? 'U'

  return (
    <div
      className={styles.account}
      aria-label={`Sesión iniciada como ${user.displayName}`}
    >
      <span className={styles.initial} aria-hidden="true">
        {initial}
      </span>
      <strong className={styles.mobileName}>{user.displayName}</strong>

      <button
        className={styles.signOutButton}
        type="button"
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        disabled={isActionPending}
        onClick={() => void signOut()}
      >
        <svg
          className={styles.signOutIcon}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10M14.5 8.5 18 12l-3.5 3.5M18 12H9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
