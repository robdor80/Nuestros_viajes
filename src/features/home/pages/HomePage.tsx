import styles from './HomePage.module.css'

export function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.welcome} aria-labelledby="welcome-title">
        <p className={styles.eyebrow}>Inicio</p>
        <h1 id="welcome-title" className={styles.title}>
          Bienvenido a Nuestros viajes.
        </h1>
        <p className={styles.introduction}>
          Aquí aparecerán tus próximos viajes y los viajes que quieras conservar
          para siempre.
        </p>
      </section>

      <section className={styles.emptyState} aria-labelledby="empty-state-title">
        <div className={styles.emptyStateMark} aria-hidden="true">
          <span />
        </div>
        <div>
          <p className={styles.emptyStateLabel}>Tu espacio de viaje</p>
          <h2 id="empty-state-title" className={styles.emptyStateTitle}>
            Aún no hay viajes disponibles.
          </h2>
          <p className={styles.emptyStateDescription}>
            Cuando creemos el primero, aparecerá aquí con todo lo necesario para
            empezar a prepararlo.
          </p>
        </div>
      </section>
    </div>
  )
}
