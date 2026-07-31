import { Link } from 'react-router-dom'

import type { TripWorkspaceSection } from '../model/trip-workspace-section'
import { TripSectionIcon } from './TripSectionIcon'
import styles from './TripSectionCard.module.css'

type TripSectionCardProps = {
  section: TripWorkspaceSection
  to: string
}

export function TripSectionCard({ section, to }: TripSectionCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.iconWrap}>
        <TripSectionIcon icon={section.icon} className={styles.icon} />
      </div>
      <div className={styles.content}>
        <div className={styles.heading}>
          <h2>{section.title}</h2>
          <span className={styles.emptyBadge}>Sin contenido</span>
        </div>
        <p>{section.description}</p>
      </div>
      <Link className={styles.link} to={to}>
        Abrir sección
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Link>
    </article>
  )
}
