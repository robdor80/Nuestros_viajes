import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import { useAccommodations } from '../../accommodations/hooks/useAccommodations'
import { usePlaces } from '../../places/hooks/usePlaces'
import type { TripNotificationData } from '../../trips/components/TripNotification'
import type { BaseTrip } from '../../trips/model/trip'
import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import { BudgetCard } from '../components/BudgetCard'
import { BudgetFormModal } from '../components/BudgetFormModal'
import { useBudget } from '../hooks/useBudget'
import { budgetToFormData, type SaveBudgetData } from '../model/budget'
import { createOrUpdateBudget } from '../services/budget-service'
import {
  calculateBudget,
  calculateBudgetAutomaticCosts,
} from '../utils/budget-calculations'
import { validateBudget } from '../utils/budget-validation'
import styles from './BudgetPage.module.css'

type BudgetPageProps = {
  userId: string
  onNotify: (notification: TripNotificationData) => void
}

const successMessages: Record<TripContentStatus, string> = {
  completed: 'Presupuesto marcado como terminado.',
  draft: 'Borrador guardado.',
  in_progress: 'Presupuesto guardado en preparación.',
}

export function BudgetPage({ userId, onNotify }: BudgetPageProps) {
  const trip = useOutletContext<BaseTrip>()
  const { budget, status, error, retry } = useBudget(trip.id)
  const {
    accommodations,
    status: accommodationsStatus,
  } = useAccommodations(trip.id)
  const { places, status: placesStatus } = usePlaces(trip.id)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const automaticCosts = useMemo(
    () =>
      calculateBudgetAutomaticCosts(
        accommodations,
        places,
        trip.participants.length,
      ),
    [accommodations, places, trip.participants.length],
  )
  const calculations = useMemo(
    () =>
      budget ? calculateBudget(budgetToFormData(budget), automaticCosts) : null,
    [automaticCosts, budget],
  )
  const isSyncing =
    accommodationsStatus === 'loading' || placesStatus === 'loading'

  const saveBudget = async (data: SaveBudgetData) => {
    setIsSaving(true)
    try {
      await createOrUpdateBudget(trip.id, data, userId)
      onNotify({
        message: successMessages[data.contentStatus],
        tone: 'success',
      })
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'No se ha podido guardar el presupuesto. Inténtalo de nuevo.'
      onNotify({ message, tone: 'error' })
      throw saveError
    } finally {
      setIsSaving(false)
    }
  }

  const changeStatus = async (nextStatus: TripContentStatus) => {
    if (!budget || isSaving) return
    const data = budgetToFormData(budget)
    const validationErrors = validateBudget(data, nextStatus, automaticCosts)
    if (Object.keys(validationErrors).length > 0) {
      setIsEditing(true)
      onNotify({
        message: 'Completa los datos necesarios antes de cambiar el estado.',
        tone: 'error',
      })
      return
    }
    await saveBudget({ ...data, contentStatus: nextStatus })
  }

  return (
    <section aria-labelledby="budget-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Sección del viaje</p>
          <h2 id="budget-title">Presupuesto</h2>
          <p>Organiza los gastos previstos y consulta el margen disponible.</p>
        </div>
        {status === 'ready' && !budget && (
          <button type="button" onClick={() => setIsEditing(true)}>
            Añadir presupuesto
          </button>
        )}
      </header>

      {status === 'loading' && (
        <div className={styles.state} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <div>
            <h3>Cargando presupuesto…</h3>
            <p>Estamos recuperando el contenido de esta sección.</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.state} role="alert">
          <div>
            <h3>No se ha podido cargar el presupuesto.</h3>
            <p>{error}</p>
          </div>
          <button type="button" onClick={retry}>
            Reintentar
          </button>
        </div>
      )}

      {status === 'ready' && !budget && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true">
            €
          </div>
          <div>
            <h3>Todavía no hay un presupuesto para este viaje.</h3>
            <p>
              Añade una previsión de gastos para tener todos los importes a
              mano.
            </p>
          </div>
          <button type="button" onClick={() => setIsEditing(true)}>
            Añadir el presupuesto
          </button>
        </div>
      )}

      {status === 'ready' && budget && calculations && (
        <div className={styles.content}>
          <BudgetCard
            budget={budget}
            calculations={calculations}
            disabled={isSaving}
            onEdit={() => setIsEditing(true)}
            onChangeStatus={(nextStatus) => void changeStatus(nextStatus)}
          />
          {isSyncing && (
            <p className={styles.syncing} aria-live="polite">
              Actualizando importes automáticos…
            </p>
          )}
        </div>
      )}

      {isEditing && (
        <BudgetFormModal
          budget={budget ?? undefined}
          automaticCosts={automaticCosts}
          onCancel={() => setIsEditing(false)}
          onSave={saveBudget}
        />
      )}
    </section>
  )
}
