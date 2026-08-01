import { PlaceStatusBadge } from '../../places/components/PlaceStatusBadge'
import type { Budget } from '../model/budget'
import {
  formatBudgetAmount,
  type BudgetCalculations,
} from '../utils/budget-calculations'
import { BudgetActionsMenu } from './BudgetActionsMenu'
import styles from './BudgetCard.module.css'

type BudgetCardProps = {
  budget: Budget
  calculations: BudgetCalculations
  disabled?: boolean
  onEdit: () => void
  onChangeStatus: (status: Budget['contentStatus']) => void
}

export function BudgetCard({
  budget,
  calculations,
  disabled,
  onEdit,
  onChangeStatus,
}: BudgetCardProps) {
  const { automaticCosts } = calculations
  const facts = [
    automaticCosts.accommodationTotal > 0 && {
      icon: '🏨',
      label: 'Hotel',
      value: formatBudgetAmount(automaticCosts.accommodationTotal),
    },
    automaticCosts.parkingTotal > 0 && {
      icon: '🅿️',
      label: 'Parking',
      value: formatBudgetAmount(automaticCosts.parkingTotal),
    },
    automaticCosts.ticketsTotal > 0 && {
      icon: '🎟️',
      label: 'Entradas',
      value: formatBudgetAmount(automaticCosts.ticketsTotal),
    },
    calculations.gasoline > 0 && {
      icon: '⛽',
      label: 'Gasolina',
      value: formatBudgetAmount(calculations.gasoline),
    },
    calculations.payAlexander > 0 && {
      icon: '👤',
      label: 'Pagar a Alexander',
      value: formatBudgetAmount(calculations.payAlexander),
    },
    calculations.meals > 0 && {
      icon: '🍽️',
      label: 'Comidas y cenas',
      value: formatBudgetAmount(calculations.meals),
    },
    calculations.miscellaneous > 0 && {
      icon: '💸',
      label: 'Gastos varios',
      value: formatBudgetAmount(calculations.miscellaneous),
    },
    calculations.maximumBudget > 0 && {
      icon: '🎯',
      label: 'Presupuesto máximo',
      value: formatBudgetAmount(calculations.maximumBudget),
    },
    calculations.contingency > 0 && {
      icon: '➕',
      label: 'Imprevistos',
      value: formatBudgetAmount(calculations.contingency),
    },
  ].filter((fact): fact is { icon: string; label: string; value: string } =>
    Boolean(fact),
  )

  return (
    <article className={styles.card}>
      <div className={styles.topRow}>
        <PlaceStatusBadge status={budget.contentStatus} />
        <BudgetActionsMenu
          budget={budget}
          disabled={disabled}
          onEdit={onEdit}
          onChangeStatus={onChangeStatus}
        />
      </div>

      <div className={styles.heading}>
        <h3>Presupuesto del viaje</h3>
        <p>Previsión actualizada automáticamente.</p>
      </div>

      {facts.length > 0 ? (
        <dl className={styles.facts}>
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt>
                <span aria-hidden="true">{fact.icon}</span>
                {fact.label}
              </dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={styles.noContent}>Aún no hay importes previstos.</p>
      )}

      {automaticCosts.ticketDetails.length > 0 && (
        <details className={styles.ticketDetails}>
          <summary>Detalle de entradas</summary>
          <ul>
            {automaticCosts.ticketDetails.map((detail) => (
              <li key={detail.id}>
                <span>{detail.name}</span>
                <small>
                  {formatBudgetAmount(detail.pricePerPerson)} ×{' '}
                  {detail.participantCount} ={' '}
                  <strong>{formatBudgetAmount(detail.total)}</strong>
                </small>
              </li>
            ))}
          </ul>
        </details>
      )}

      {calculations.total > 0 && (
        <div className={styles.total}>
          <span>
            <span aria-hidden="true">💶</span> Total previsto
          </span>
          <strong>{formatBudgetAmount(calculations.total)}</strong>
        </div>
      )}

      {calculations.remainingMargin !== null && (
        <div className={styles.margin}>
          <span>
            <span aria-hidden="true">💵</span> Margen restante
          </span>
          <strong
            className={calculations.remainingMargin < 0 ? styles.negative : ''}
          >
            {formatBudgetAmount(calculations.remainingMargin)}
          </strong>
        </div>
      )}
    </article>
  )
}
