import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import { usePlaces } from '../../places/hooks/usePlaces'
import type { TripNotificationData } from '../../trips/components/TripNotification'
import type { BaseTrip } from '../../trips/model/trip'
import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import { DeletePlanningDayDialog } from '../components/DeletePlanningDayDialog'
import { PlanningDayCard } from '../components/PlanningDayCard'
import { PlanningDayFormModal } from '../components/PlanningDayFormModal'
import { usePlanningDays } from '../hooks/usePlanningDays'
import {
  planningDayToFormData,
  type PlanningDay,
  type SavePlanningDayData,
} from '../model/planning'
import {
  createPlanningDay,
  deletePlanningDay,
  updatePlanningDay,
} from '../services/planning-service'
import { getTripDates } from '../utils/planning-dates'
import { validatePlanningDay } from '../utils/planning-validation'
import styles from './PlanningPage.module.css'

type PlanningPageProps = {
  userId: string
  onNotify: (notification: TripNotificationData) => void
}

type EditingDay = {
  date: string
  day?: PlanningDay
}

const createMessages: Record<TripContentStatus, string> = {
  draft: 'Borrador del día guardado.',
  in_progress: 'Planning guardado en preparación.',
  completed: 'Día marcado como terminado.',
}

const statusMessages: Record<TripContentStatus, string> = {
  draft: 'El planning ha vuelto a Borrador.',
  in_progress: 'El planning está En preparación.',
  completed: 'Día marcado como terminado.',
}

export function PlanningPage({ userId, onNotify }: PlanningPageProps) {
  const trip = useOutletContext<BaseTrip>()
  const { days, status, error, retry } = usePlanningDays(trip.id)
  const { places, status: placesStatus } = usePlaces(trip.id)
  const [editing, setEditing] = useState<EditingDay | null>(null)
  const [dayToDelete, setDayToDelete] = useState<PlanningDay | null>(null)
  const [busyDate, setBusyDate] = useState<string | null>(null)

  const tripDates = useMemo(
    () => getTripDates(trip.startDate, trip.endDate),
    [trip.endDate, trip.startDate],
  )
  const daysByDate = useMemo(
    () => new Map(days.map((day) => [day.date, day])),
    [days],
  )
  const outsideDays = useMemo(
    () => days.filter((day) => !tripDates.includes(day.date)),
    [days, tripDates],
  )

  const saveDay = async (data: SavePlanningDayData) => {
    if (!editing) throw new Error('El día que intentas guardar ya no está disponible.')
    try {
      if (editing.day) {
        await updatePlanningDay(trip.id, editing.day, data, userId)
        onNotify({ message: 'Cambios guardados.', tone: 'success' })
      } else {
        await createPlanningDay(trip.id, editing.date, data, userId)
        onNotify({ message: createMessages[data.contentStatus], tone: 'success' })
      }
    } catch (caught) {
      onNotify({
        message: caught instanceof Error ? caught.message : 'No se ha podido guardar el planning.',
        tone: 'error',
      })
      throw caught
    }
  }

  const changeStatus = async (day: PlanningDay, nextStatus: TripContentStatus) => {
    if (busyDate) return
    const values = planningDayToFormData(day)
    if (Object.keys(validatePlanningDay(values, nextStatus)).length > 0) {
      setEditing({ date: day.date, day })
      onNotify({ message: 'Completa los datos necesarios antes de cambiar el estado.', tone: 'error' })
      return
    }

    setBusyDate(day.date)
    try {
      await updatePlanningDay(trip.id, day, { ...values, contentStatus: nextStatus }, userId)
      onNotify({ message: statusMessages[nextStatus], tone: 'success' })
    } catch (caught) {
      onNotify({
        message: caught instanceof Error ? caught.message : 'No se ha podido cambiar el estado.',
        tone: 'error',
      })
    } finally {
      setBusyDate(null)
    }
  }

  const confirmDelete = async () => {
    if (!dayToDelete) return
    try {
      await deletePlanningDay(trip.id, dayToDelete.date, userId)
      onNotify({ message: 'Planning del día eliminado.', tone: 'success' })
    } catch (caught) {
      onNotify({
        message: caught instanceof Error ? caught.message : 'No se ha podido eliminar el planning del día.',
        tone: 'error',
      })
      throw caught
    }
  }

  const openForm = (date: string, day?: PlanningDay) => setEditing({ date, day })
  const dayNumber = editing ? tripDates.indexOf(editing.date) + 1 : 0

  return (
    <section aria-labelledby="planning-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Sección del viaje</p>
          <h2 id="planning-title">Planning diario</h2>
          <p>Organiza cada día mediante actividades ordenadas, con horario opcional.</p>
        </div>
        {status === 'ready' && (
          <span className={styles.total} aria-live="polite">
            {tripDates.length} {tripDates.length === 1 ? 'día' : 'días'} · {days.filter((day) => tripDates.includes(day.date)).length} preparados
          </span>
        )}
      </header>

      {status === 'loading' && (
        <div className={styles.state} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <div><h3>Cargando planning…</h3><p>Estamos recuperando los días preparados.</p></div>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.state} role="alert">
          <div><h3>No se ha podido cargar el planning.</h3><p>{error}</p></div>
          <button type="button" onClick={retry}>Reintentar</button>
        </div>
      )}

      {status === 'ready' && tripDates.length === 0 && (
        <div className={styles.state} role="alert">
          <div><h3>Las fechas del viaje no son válidas.</h3><p>Edita el viaje para definir un intervalo correcto.</p></div>
        </div>
      )}

      {status === 'ready' && tripDates.length > 0 && (
        <div className={styles.timeline}>
          {tripDates.map((date, index) => (
            <PlanningDayCard
              key={date}
              date={date}
              dayNumber={index + 1}
              day={daysByDate.get(date)}
              disabled={busyDate === date}
              onEdit={openForm}
              onChangeStatus={(day, nextStatus) => void changeStatus(day, nextStatus)}
              onDelete={setDayToDelete}
            />
          ))}
        </div>
      )}

      {status === 'ready' && outsideDays.length > 0 && (
        <section className={styles.outsideSection} aria-labelledby="outside-planning-title">
          <div className={styles.outsideHeading}>
            <h3 id="outside-planning-title">Fuera de las fechas actuales</h3>
            <p>Estos días se conservan para que puedas editarlos o eliminarlos manualmente.</p>
          </div>
          <div className={styles.timeline}>
            {outsideDays.map((day) => (
              <PlanningDayCard
                key={day.id}
                date={day.date}
                day={day}
                outsideRange
                disabled={busyDate === day.date}
                onEdit={openForm}
                onChangeStatus={(item, nextStatus) => void changeStatus(item, nextStatus)}
                onDelete={setDayToDelete}
              />
            ))}
          </div>
        </section>
      )}

      {editing && (
        <PlanningDayFormModal
          date={editing.date}
          dayNumber={dayNumber > 0 ? dayNumber : undefined}
          day={editing.day}
          places={places}
          placesStatus={placesStatus}
          onCancel={() => setEditing(null)}
          onSave={saveDay}
          onActivityAdded={() => onNotify({ message: 'Actividad añadida.', tone: 'success' })}
        />
      )}

      {dayToDelete && (
        <DeletePlanningDayDialog day={dayToDelete} onCancel={() => setDayToDelete(null)} onConfirm={confirmDelete} />
      )}
    </section>
  )
}
