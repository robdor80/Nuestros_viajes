import { PlaceStatusBadge } from '../../places/components/PlaceStatusBadge'
import type { Budget } from '../model/budget'
import { formatBudgetAmount, type BudgetCalculations } from '../utils/budget-calculations'
import { BudgetActionsMenu } from './BudgetActionsMenu'
import styles from './BudgetCard.module.css'

type BudgetCardProps = {
  budget: Budget
  calculations: BudgetCalculations
  accommodationTotal: number
  disabled?: boolean
  onEdit: () => void
  onChangeStatus: (status: Budget['contentStatus']) => void
}

export function BudgetCard({ budget, calculations, accommodationTotal, disabled, onEdit, onChangeStatus }: BudgetCardProps) {
  const facts = [
    accommodationTotal > 0 && { icon: '🏨', label: 'Hotel', value: formatBudgetAmount(accommodationTotal) },
    calculations.gasoline > 0 && { icon: '⛽', label: 'Gasolina', value: formatBudgetAmount(calculations.gasoline) },
    calculations.payAlexander > 0 && { icon: '👤', label: 'Pagar a Alexander', value: formatBudgetAmount(calculations.payAlexander) },
    calculations.meals > 0 && { icon: '🍽️', label: 'Comidas y cenas', value: formatBudgetAmount(calculations.meals) },
    calculations.miscellaneous > 0 && { icon: '💸', label: 'Gastos varios', value: formatBudgetAmount(calculations.miscellaneous) },
    calculations.maximumBudget > 0 && { icon: '🎯', label: 'Presupuesto máximo', value: formatBudgetAmount(calculations.maximumBudget) },
    calculations.contingency > 0 && { icon: '➕', label: 'Imprevistos', value: formatBudgetAmount(calculations.contingency) },
  ].filter((fact): fact is { icon: string; label: string; value: string } => Boolean(fact))

  return (
    <article className={styles.card}>
      <div className={styles.topRow}>
        <PlaceStatusBadge status={budget.contentStatus} />
        <BudgetActionsMenu budget={budget} disabled={disabled} onEdit={onEdit} onChangeStatus={onChangeStatus} />
      </div>
      <div className={styles.heading}><h3>Presupuesto del viaje</h3><p>Previsión actualizada automáticamente.</p></div>
      {facts.length > 0 ? <dl className={styles.facts}>{facts.map((fact) => <div key={fact.label}><dt><span aria-hidden="true">{fact.icon}</span>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl> : <p className={styles.noContent}>Aún no hay importes previstos.</p>}
      {calculations.total > 0 && <div className={styles.total}><span><span aria-hidden="true">💶</span> Total previsto</span><strong>{formatBudgetAmount(calculations.total)}</strong></div>}
      {calculations.remainingMargin !== null && <div className={styles.margin}><span><span aria-hidden="true">💵</span> Margen restante</span><strong className={calculations.remainingMargin < 0 ? styles.negative : ''}>{formatBudgetAmount(calculations.remainingMargin)}</strong></div>}
    </article>
  )
}
