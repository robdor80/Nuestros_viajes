import { NavLink } from 'react-router-dom'

import {
  getTripWorkspacePath,
  tripWorkspaceSections,
} from '../model/trip-workspace-section'
import styles from './TripSectionNavigation.module.css'

type TripSectionNavigationProps = {
  tripId: string
}

export function TripSectionNavigation({ tripId }: TripSectionNavigationProps) {
  const getClassName = ({ isActive }: { isActive: boolean }) =>
    `${styles.link} ${isActive ? styles.activeLink : ''}`

  return (
    <nav className={styles.navigation} aria-label="Secciones del viaje">
      <div className={styles.scroller}>
        <NavLink
          className={getClassName}
          to={getTripWorkspacePath(tripId)}
          end
        >
          Resumen
        </NavLink>
        {tripWorkspaceSections.map((section) => (
          <NavLink
            key={section.id}
            className={getClassName}
            to={getTripWorkspacePath(tripId, section.slug)}
          >
            {section.navigationLabel}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
