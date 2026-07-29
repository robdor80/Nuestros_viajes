import styles from './TripNotification.module.css'

export type TripNotificationData = {
  message: string
  tone: 'success' | 'error'
}

type TripNotificationProps = {
  notification: TripNotificationData
  onDismiss: () => void
}

export function TripNotification({
  notification,
  onDismiss,
}: TripNotificationProps) {
  return (
    <div
      className={`${styles.notification} ${
        notification.tone === 'error' ? styles.error : styles.success
      }`}
      role={notification.tone === 'error' ? 'alert' : 'status'}
      aria-live={notification.tone === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <span className={styles.mark} aria-hidden="true">
        {notification.tone === 'error' ? '!' : '✓'}
      </span>
      <p>{notification.message}</p>
      <button
        type="button"
        aria-label="Cerrar aviso"
        onClick={onDismiss}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}
