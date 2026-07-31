import { useEffect, useRef, useState } from 'react'

import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import { tripContentStatusLabels } from '../../trip-workspace/model/trip-content'
import {
  planningActivityTypeLabels,
  planningMomentLabels,
  type PlanningActivity,
  type PlanningDay,
} from '../model/planning'
import { formatPlanningDate } from '../utils/planning-dates'
import styles from './PlanningDayCard.module.css'

type PlanningDayCardProps = {
  date: string
  dayNumber?: number
  day?: PlanningDay
  outsideRange?: boolean
  disabled?: boolean
  onEdit: (date: string, day?: PlanningDay) => void
  onChangeStatus: (day: PlanningDay, status: TripContentStatus) => void
  onDelete: (day: PlanningDay) => void
}

type ActionsMenuProps = {
  day: PlanningDay
  disabled: boolean
  onEdit: () => void
  onChangeStatus: (status: TripContentStatus) => void
  onDelete: () => void
}

function PlanningDayActionsMenu({
  day,
  disabled,
  onEdit,
  onChangeStatus,
  onDelete,
}: ActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const [statusesOpen, setStatusesOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = () => {
    setOpen(false)
    setStatusesOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const pointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) close()
    }
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', pointerDown)
    document.addEventListener('keydown', keyDown)
    const frame = requestAnimationFrame(() => menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus())
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('pointerdown', pointerDown)
      document.removeEventListener('keydown', keyDown)
    }
  }, [open])

  const run = (action: () => void) => {
    close()
    action()
  }

  return (
    <div ref={rootRef} className={styles.menuRoot}>
      <button
        ref={triggerRef}
        className={styles.menuTrigger}
        type="button"
        aria-label={`Acciones del planning de ${formatPlanningDate(day.date)}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => open ? close() : setOpen(true)}
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {open && (
        <div ref={menuRef} className={styles.menu} role="menu">
          <button type="button" role="menuitem" onClick={() => run(onEdit)}>Editar</button>
          {day.contentStatus === 'completed' ? (
            <button type="button" role="menuitem" onClick={() => run(() => onChangeStatus('in_progress'))}>Volver a En preparación</button>
          ) : (
            <>
              <button type="button" role="menuitem" aria-expanded={statusesOpen} onClick={() => setStatusesOpen((current) => !current)}>
                Cambiar estado <span aria-hidden="true">{statusesOpen ? '−' : '+'}</span>
              </button>
              {statusesOpen && (
                <div className={styles.statusActions} role="group" aria-label="Estados disponibles">
                  {(['draft', 'in_progress', 'completed'] as const)
                    .filter((status) => status !== day.contentStatus)
                    .map((status) => (
                      <button key={status} type="button" role="menuitem" onClick={() => run(() => onChangeStatus(status))}>
                        {tripContentStatusLabels[status]}
                      </button>
                    ))}
                </div>
              )}
            </>
          )}
          <button className={styles.destructive} type="button" role="menuitem" onClick={() => run(onDelete)}>Eliminar planning del día</button>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status?: TripContentStatus }) {
  return (
    <span className={`${styles.statusBadge} ${status ? styles[status] : styles.notStarted}`}>
      {status ? tripContentStatusLabels[status] : 'Sin comenzar'}
    </span>
  )
}

function ActivityDetails({ activity, index }: { activity: PlanningActivity; index: number }) {
  const [imageFailed, setImageFailed] = useState(false)
  const time = activity.startTime
    ? activity.endTime
      ? `${activity.startTime}–${activity.endTime}`
      : activity.startTime
    : activity.endTime
      ? `Hasta ${activity.endTime}`
      : ''

  return (
    <li className={styles.activity}>
      {activity.imageUrl && !imageFailed && (
        <div className={styles.activityImage}>
          <img src={activity.imageUrl} alt={activity.title} loading="lazy" onError={() => setImageFailed(true)} />
        </div>
      )}
      <div className={styles.activityBody}>
        <div className={styles.activityTop}>
          <span className={styles.order} aria-label={`Actividad ${index + 1}`}>{index + 1}</span>
          <div>
            {(time || activity.momentOfDay) && (
              <p className={styles.timing}>
                {[time, activity.momentOfDay ? planningMomentLabels[activity.momentOfDay] : ''].filter(Boolean).join(' · ')}
              </p>
            )}
            <h4>{activity.title}</h4>
            {(activity.type || activity.estimatedDuration) && (
              <p className={styles.activityMeta}>
                {[
                  activity.type ? planningActivityTypeLabels[activity.type] : '',
                  activity.estimatedDuration,
                ].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
        {activity.address && <p className={styles.address}>{activity.address}</p>}
        {activity.description && <p className={styles.activityText}>{activity.description}</p>}
        {activity.notes && <div className={styles.activityNotes}><strong>Notas</strong><p>{activity.notes}</p></div>}
        {activity.mapsUrl && <a className={styles.mapsLink} href={activity.mapsUrl} target="_blank" rel="noreferrer">Abrir en Maps</a>}
      </div>
    </li>
  )
}

export function PlanningDayCard({
  date,
  dayNumber,
  day,
  outsideRange = false,
  disabled = false,
  onEdit,
  onChangeStatus,
  onDelete,
}: PlanningDayCardProps) {
  const label = dayNumber ? `Día ${dayNumber}` : 'Fecha fuera del viaje'

  if (!day) {
    return (
      <article className={`${styles.card} ${styles.emptyCard}`}>
        <div className={styles.cardHeader}>
          <div><p className={styles.dayNumber}>{label}</p><h3>{formatPlanningDate(date)}</h3></div>
          <StatusBadge />
        </div>
        <p className={styles.emptyMessage}>Todavía no se ha preparado este día.</p>
        <button className={styles.primaryAction} type="button" onClick={() => onEdit(date)}>Preparar día</button>
      </article>
    )
  }

  const isCompleted = day.contentStatus === 'completed'
  const isDraft = day.contentStatus === 'draft'

  return (
    <article className={`${styles.card} ${isCompleted ? styles.completedCard : styles.pendingCard} ${outsideRange ? styles.outsideCard : ''}`}>
      {outsideRange && <p className={styles.warning}>Este planning pertenece a una fecha que ya no está dentro del viaje.</p>}
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.dayNumber}>{label}</p>
          <p className={styles.fullDate}>{formatPlanningDate(date)}</p>
        </div>
        <div className={styles.headerActions}>
          <StatusBadge status={day.contentStatus} />
          <PlanningDayActionsMenu day={day} disabled={disabled} onEdit={() => onEdit(date, day)} onChangeStatus={(status) => onChangeStatus(day, status)} onDelete={() => onDelete(day)} />
        </div>
      </div>

      <div className={styles.dayContent}>
        <h3>{day.title}</h3>
        {day.description && <p className={styles.description}>{day.description}</p>}
        {day.notes && <div className={styles.dayNotes}><strong>Notas generales</strong><p>{day.notes}</p></div>}
      </div>

      {isCompleted ? (
        <ol className={styles.completedActivities}>
          {day.activities.map((activity, index) => <ActivityDetails key={activity.id} activity={activity} index={index} />)}
        </ol>
      ) : (
        <div className={styles.pendingSummary}>
          <p>{day.activities.length > 0 ? `${day.activities.length} ${day.activities.length === 1 ? 'actividad añadida' : 'actividades añadidas'}.` : 'Todavía no se han añadido actividades.'}</p>
          {day.activities.length > 0 && <p className={styles.activityPreview}>{day.activities.slice(0, 3).map((activity) => activity.title).join(' · ')}</p>}
          <button className={styles.primaryAction} type="button" disabled={disabled} onClick={() => onEdit(date, day)}>{isDraft ? 'Completar' : 'Continuar'}</button>
        </div>
      )}
    </article>
  )
}
