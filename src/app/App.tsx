import styles from './App.module.css'

export function App() {
  return (
    <main className={styles.shell}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>Travel Companion</p>
        <h1 className={styles.title}>Cada viaje empieza aquí.</h1>
        <p className={styles.description}>
          Los cimientos están preparados. El próximo destino lo construiremos
          paso a paso.
        </p>
      </div>
    </main>
  )
}
