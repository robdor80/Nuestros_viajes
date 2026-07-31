import { Link } from 'react-router-dom'

import type { TripWorkspaceSection } from '../model/trip-workspace-section'
import { TripSectionIcon } from './TripSectionIcon'
import styles from './TripSectionCard.module.css'

type TripSectionCardProps = {
  section: TripWorkspaceSection
  to: string
  contentSummary?: {
    kind?: 'places' | 'planning'
    status: 'loading' | 'ready' | 'error'
    total: number
    contentCount?: number
    completed: number
    inProgress: number
    draft: number
    notStarted?: number
  }
}

export function TripSectionCard({
  section,
  to,
  contentSummary,
}: TripSectionCardProps) {
  const isPlanning = contentSummary?.kind === 'planning'
  const hasContent =
    contentSummary?.status === 'ready' &&
    (isPlanning
      ? (contentSummary.contentCount ?? 0) > 0
      : contentSummary.total > 0)
  const summaryItems = hasContent
    ? [
        contentSummary.completed > 0 &&
          `${contentSummary.completed} ${contentSummary.completed === 1 ? 'terminado' : 'terminados'}`,
        contentSummary.inProgress > 0 &&
          `${contentSummary.inProgress} en preparación`,
        contentSummary.draft > 0 &&
          `${contentSummary.draft} ${contentSummary.draft === 1 ? 'borrador' : 'borradores'}`,
        isPlanning &&
          Boolean(contentSummary.notStarted) &&
          `${contentSummary.notStarted} sin comenzar`,
      ].filter((item): item is string => Boolean(item))
    : isPlanning && contentSummary?.status === 'ready' && contentSummary.total > 0
      ? [`${contentSummary.total} ${contentSummary.total === 1 ? 'día' : 'días'} del viaje`]
      : []

  const statusLabel =
    contentSummary?.status === 'loading'
      ? 'Cargando…'
      : contentSummary?.status === 'error'
        ? 'No disponible'
        : hasContent
          ? `${contentSummary.total} ${isPlanning ? (contentSummary.total === 1 ? 'día' : 'días') : (contentSummary.total === 1 ? 'ficha' : 'fichas')}`
          : 'Sin contenido'

  return (
    <article className={styles.card}>
      <div className={styles.iconWrap}>
        <TripSectionIcon icon={section.icon} className={styles.icon} />
      </div>
      <div className={styles.content}>
        <div className={styles.heading}>
          <h2>{section.title}</h2>
          <span className={styles.emptyBadge}>{statusLabel}</span>
        </div>
        <p>{section.description}</p>
        {summaryItems.length > 0 && (
          <ul className={styles.summary} aria-label="Resumen de estados">
            {summaryItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
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
