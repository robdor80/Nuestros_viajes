import { Link, useParams } from 'react-router-dom'

import { TripSectionIcon } from '../components/TripSectionIcon'
import {
  getTripWorkspacePath,
  getTripWorkspaceSection,
  type TripWorkspaceSectionId,
} from '../model/trip-workspace-section'
import styles from './TripSectionPage.module.css'

type TripSectionPageProps = {
  sectionId: TripWorkspaceSectionId
}

export function TripSectionPage({ sectionId }: TripSectionPageProps) {
  const { tripId } = useParams()
  const section = getTripWorkspaceSection(sectionId)

  if (!section || !tripId) {
    return null
  }

  return (
    <section aria-labelledby={`${section.id}-title`}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Sección del viaje</p>
        <h2 id={`${section.id}-title`}>{section.title}</h2>
        <p>{section.description}</p>
      </header>

      <div className={styles.emptyState}>
        <div className={styles.iconWrap}>
          <TripSectionIcon icon={section.icon} className={styles.icon} />
        </div>
        <div>
          <h3>Todavía no hay contenido</h3>
          <p>
            Esta sección se completará en una próxima fase. Por ahora ya está
            preparada para incorporarlo más adelante.
          </p>
        </div>
        <Link to={getTripWorkspacePath(tripId)}>Volver al Resumen</Link>
      </div>
    </section>
  )
}
