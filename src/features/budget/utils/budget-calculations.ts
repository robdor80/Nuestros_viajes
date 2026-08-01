import type { Accommodation } from '../../accommodations/model/accommodation'
import type { Place } from '../../places/model/place'
import type { BudgetFormData } from '../model/budget'

export type BudgetTicketDetail = {
  id: string
  name: string
  pricePerPerson: number
  participantCount: number
  total: number
}

export type BudgetAutomaticCosts = {
  accommodationTotal: number
  parkingTotal: number
  ticketsTotal: number
  ticketDetails: BudgetTicketDetail[]
  participantCount: number
}

export const emptyBudgetAutomaticCosts: BudgetAutomaticCosts = {
  accommodationTotal: 0,
  parkingTotal: 0,
  ticketsTotal: 0,
  ticketDetails: [],
  participantCount: 0,
}

export function parseBudgetAmount(value: string) {
  const rawValue = value
    .trim()
    .replace(/[€\s]/g, '')
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
  return new Intl.NumberFormat('es-ES', {
    currency: 'EUR',
    maximumFractionDigits: 2,
    style: 'currency',
  }).format(value)
}

export function calculateBudgetAutomaticCosts(
  accommodations: Accommodation[],
  places: Place[],
  participantCount: number,
): BudgetAutomaticCosts {
  const accommodationTotal = accommodations.reduce(
    (total, accommodation) =>
      total + parseBudgetAmount(accommodation.totalPrice),
    0,
  )
  const parkingTotal = accommodations.reduce(
    (total, accommodation) =>
      total + parseBudgetAmount(accommodation.parkingTotalCost),
    0,
  )
  const ticketDetails =
    participantCount > 0
      ? places
          .map((place): BudgetTicketDetail | null => {
            const pricePerPerson = parseBudgetAmount(place.price)
            if (pricePerPerson <= 0) return null

            return {
              id: place.id,
              name: place.name,
              participantCount,
              pricePerPerson,
              total: pricePerPerson * participantCount,
            }
          })
          .filter((detail): detail is BudgetTicketDetail => Boolean(detail))
      : []
  const ticketsTotal = ticketDetails.reduce(
    (total, detail) => total + detail.total,
    0,
  )

  return {
    accommodationTotal,
    parkingTotal,
    ticketsTotal,
    ticketDetails,
    participantCount,
  }
}

export type BudgetCalculations = {
  gasoline: number
  payAlexander: number
  meals: number
  miscellaneous: number
  maximumBudget: number
  contingency: number
  total: number
  remainingMargin: number | null
  automaticCosts: BudgetAutomaticCosts
}

export function calculateBudget(
  values: BudgetFormData,
  automaticCosts: BudgetAutomaticCosts = emptyBudgetAutomaticCosts,
): BudgetCalculations {
  const gasoline = parseBudgetAmount(values.gasoline)
  const payAlexander = parseBudgetAmount(values.payAlexander)
  const meals = parseBudgetAmount(values.meals)
  const miscellaneous = parseBudgetAmount(values.miscellaneous)
  const maximumBudget = parseBudgetAmount(values.maximumBudget)
  const baseTotal =
    automaticCosts.accommodationTotal +
    automaticCosts.parkingTotal +
    automaticCosts.ticketsTotal +
    gasoline +
    payAlexander +
    meals +
    miscellaneous
  const contingency = values.contingencyEnabled
    ? baseTotal * (values.contingencyPercentage / 100)
    : 0
  const total = baseTotal + contingency

  return {
    automaticCosts,
    contingency,
    gasoline,
    maximumBudget,
    meals,
    miscellaneous,
    payAlexander,
    remainingMargin: maximumBudget > 0 ? maximumBudget - total : null,
    total,
  }
}
