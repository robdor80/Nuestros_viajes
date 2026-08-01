import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import type { BudgetFormData } from '../model/budget'
import { calculateBudget } from './budget-calculations'

export type BudgetFormErrorKey = keyof BudgetFormData | 'form'
export type BudgetFormErrors = Partial<Record<BudgetFormErrorKey, string>>

export function normalizeBudgetFormData(values: BudgetFormData): BudgetFormData {
  return { gasoline: values.gasoline.trim(), payAlexander: values.payAlexander.trim(), meals: values.meals.trim(), miscellaneous: values.miscellaneous.trim(), maximumBudget: values.maximumBudget.trim(), contingencyEnabled: values.contingencyEnabled, contingencyPercentage: values.contingencyPercentage }
}

export function validateBudget(values: BudgetFormData, contentStatus: TripContentStatus, accommodationTotal: number) {
  const errors: BudgetFormErrors = {}
  const calculations = calculateBudget(values, accommodationTotal)
  const enteredAmountCount = [calculations.gasoline, calculations.payAlexander, calculations.meals, calculations.miscellaneous, calculations.maximumBudget, accommodationTotal].filter((amount) => amount > 0).length
  const expenseCount = [calculations.gasoline, calculations.payAlexander, calculations.meals, calculations.miscellaneous, accommodationTotal].filter((amount) => amount > 0).length
  if (contentStatus === 'in_progress' && enteredAmountCount === 0) errors.form = 'Para guardar en preparación, introduce al menos un importe.'
  if (contentStatus === 'completed' && expenseCount === 0) errors.form = 'Para marcar como terminado, añade al menos un concepto económico.'
  return errors
}
