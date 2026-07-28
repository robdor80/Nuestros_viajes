import { useState, type ReactNode } from 'react'

import styles from './AppLayout.module.css'

const navigationItems = ['Inicio', 'Nuevo viaje', 'Mis viajes', 'Ajustes'] as const

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className={styles.application}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.identity}>
            <p className={styles.brand}>Nuestros viajes</p>
            <p className={styles.greeting}>¿A dónde nos iremos, Fati?</p>
          </div>

          <button
            className={styles.menuButton}
            type="button"
            aria-controls="primary-navigation"
            aria-expanded={isMenuOpen}
            aria-label={
              isMenuOpen ? 'Cerrar menú principal' : 'Abrir menú principal'
            }
            onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
          >
            <span className={styles.menuIcon} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>

          <nav
            id="primary-navigation"
            className={`${styles.navigation} ${
              isMenuOpen ? styles.navigationOpen : ''
            }`}
            aria-label="Navegación principal"
          >
            <ul className={styles.navigationList}>
              {navigationItems.map((item) => (
                <li key={item}>
                  <span
                    className={`${styles.navigationItem} ${
                      item === 'Inicio' ? styles.navigationItemActive : ''
                    }`}
                    aria-current={item === 'Inicio' ? 'page' : undefined}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main-content" className={styles.main}>
        {children}
      </main>
    </div>
  )
}
