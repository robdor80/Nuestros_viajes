import { useState, type ReactNode } from 'react'

import headerImage from '../../assets/images/header-fati-rober.webp'
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
          <img
            className={styles.headerImage}
            src={headerImage}
            alt="Fati y Rober disfrutando de un viaje"
          />

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
        </div>
      </header>

      <div className={styles.navigationBar}>
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

      <main id="main-content" className={styles.main}>
        {children}
      </main>
    </div>
  )
}
