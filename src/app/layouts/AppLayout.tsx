import { useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

import headerImage from '../../assets/images/header-fati-rober.webp'
import styles from './AppLayout.module.css'

type AppLayoutProps = {
  children: ReactNode
  accountControls?: ReactNode
  showNavigation?: boolean
}

export function AppLayout({
  children,
  accountControls,
  showNavigation = true,
}: AppLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const closeMobileMenu = () => {
    setIsMenuOpen(false)
  }

  const navigationClassName = ({ isActive }: { isActive: boolean }) =>
    `${styles.navigationItem} ${
      isActive ? styles.navigationItemActive : ''
    }`

  return (
    <div className={styles.application}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <img
            className={styles.headerImage}
            src={headerImage}
            alt="Fati y Rober disfrutando de un viaje"
          />

          <p
            className={styles.headerTagline}
            aria-label="¿Nos hacemos un viajecito?"
          >
            <span className={styles.taglineStart} aria-hidden="true">
              ¿Nos hacemos...
            </span>
            <span className={styles.taglineEnd} aria-hidden="true">
              ...un viajecito?
            </span>
          </p>

          {showNavigation && (
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
          )}
        </div>
      </header>

      {showNavigation && (
        <div className={styles.navigationBar}>
          <nav
            id="primary-navigation"
            className={`${styles.navigation} ${
              isMenuOpen ? styles.navigationOpen : ''
            }`}
            aria-label="Navegación principal"
          >
            <ul className={styles.navigationList}>
              <li>
                <NavLink
                  className={navigationClassName}
                  to="/"
                  end
                  onClick={closeMobileMenu}
                >
                  Inicio
                </NavLink>
              </li>
              <li>
                <Link
                  className={`${styles.navigationItem} ${
                    location.pathname === '/nuevo-viaje'
                      ? styles.navigationItemActive
                      : ''
                  }`}
                  to="/nuevo-viaje"
                  state={{ backgroundLocation: location }}
                  onClick={closeMobileMenu}
                >
                  Nuevo viaje
                </Link>
              </li>
              <li>
                <NavLink
                  className={navigationClassName}
                  to="/mis-viajes"
                  onClick={closeMobileMenu}
                >
                  Mis viajes
                </NavLink>
              </li>
              <li>
                <NavLink
                  className={navigationClassName}
                  to="/ajustes"
                  onClick={closeMobileMenu}
                >
                  Ajustes
                </NavLink>
              </li>
            </ul>

            {accountControls && (
              <div className={styles.accountControls}>{accountControls}</div>
            )}
          </nav>
        </div>
      )}

      <main id="main-content" className={styles.main}>
        {children}
      </main>
    </div>
  )
}
