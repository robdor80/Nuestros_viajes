import styles from './App.module.css'

export function App() {
  return (
    <main className={styles.page}>
      <section
        className={styles.introduction}
        aria-labelledby="application-title"
      >
        <h1 id="application-title" className={styles.title}>
          Nuestros viajes
        </h1>
        <p className={styles.description}>
          La aplicación está correctamente configurada.
        </p>
        <p className={styles.version}>Versión inicial del proyecto.</p>
      </section>
    </main>
  )
}
