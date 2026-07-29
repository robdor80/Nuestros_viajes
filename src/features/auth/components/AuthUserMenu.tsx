import { useAuth } from '../hooks/useAuth'
import styles from './AuthUserMenu.module.css'

export function AuthUserMenu() {
  const { user } = useAuth()

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
    </div>
  )
}
