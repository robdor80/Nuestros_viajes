import type { TripContentStatus } from '../../trip-workspace/model/trip-content'

export const contingencyPercentages = [5, 10, 15, 20] as const
export type ContingencyPercentage = (typeof contingencyPercentages)[number]

export type Budget = {
  gasoline: string
  payAlexander: string
  meals: string
  miscellaneous: string
  maximumBudget: string
  contingencyEnabled: boolean
  contingencyPercentage: ContingencyPercentage
  contentStatus: TripContentStatus
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  completedAt?: string
  completedBy?: string
}

export type BudgetFormData = Pick<Budget, 'gasoline' | 'payAlexander' | 'meals' | 'miscellaneous' | 'maximumBudget' | 'contingencyEnabled' | 'contingencyPercentage'>
export type SaveBudgetData = BudgetFormData & { contentStatus: TripContentStatus }
export type BudgetLoadStatus = 'loading' | 'ready' | 'error'

export const emptyBudgetFormData: BudgetFormData = { gasoline: '', payAlexander: '', meals: '', miscellaneous: '', maximumBudget: '', contingencyEnabled: false, contingencyPercentage: 10 }

export function budgetToFormData(budget: Budget): BudgetFormData {
  return { gasoline: budget.gasoline, payAlexander: budget.payAlexander, meals: budget.meals, miscellaneous: budget.miscellaneous, maximumBudget: budget.maximumBudget, contingencyEnabled: budget.contingencyEnabled, contingencyPercentage: budget.contingencyPercentage }
}
