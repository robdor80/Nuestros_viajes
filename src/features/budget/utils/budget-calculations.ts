import type { BudgetFormData } from '../model/budget'

export function parseBudgetAmount(value: string) {
  const rawValue = value
    .trim()
    .replace(/\s|€/g, '')
    .replace(/[^\d,.-]/g, '')
  const lastComma = rawValue.lastIndexOf(',')
  const lastDot = rawValue.lastIndexOf('.')
  const normalized =
    lastComma > lastDot
      ? rawValue.replace(/\./g, '').replace(',', '.')
      : lastComma >= 0
        ? rawValue.replace(/,/g, '')
        : rawValue
  const amount = Number(normalized)
  return Number.isFinite(amount) && amount > 0 ? amount : 0
}

export function formatBudgetAmount(value: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value)
}

export type BudgetCalculations = { gasoline: number; payAlexander: number; meals: number; miscellaneous: number; maximumBudget: number; contingency: number; total: number; remainingMargin: number | null }

export function calculateBudget(values: BudgetFormData, accommodationTotal: number): BudgetCalculations {
  const gasoline = parseBudgetAmount(values.gasoline)
  const payAlexander = parseBudgetAmount(values.payAlexander)
  const meals = parseBudgetAmount(values.meals)
  const miscellaneous = parseBudgetAmount(values.miscellaneous)
  const maximumBudget = parseBudgetAmount(values.maximumBudget)
  const baseTotal = accommodationTotal + gasoline + payAlexander + meals + miscellaneous
  const contingency = values.contingencyEnabled ? baseTotal * (values.contingencyPercentage / 100) : 0
  const total = baseTotal + contingency
  return { gasoline, payAlexander, meals, miscellaneous, maximumBudget, contingency, total, remainingMargin: maximumBudget > 0 ? maximumBudget - total : null }
}
