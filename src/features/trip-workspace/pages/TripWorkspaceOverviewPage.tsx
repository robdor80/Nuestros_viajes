import { useOutletContext, useParams } from 'react-router-dom'

import { useAccommodations } from '../../accommodations/hooks/useAccommodations'
import { useBudget } from '../../budget/hooks/useBudget'
import {
  calculateBudget,
  calculateBudgetAutomaticCosts,
  formatBudgetAmount,
} from '../../budget/utils/budget-calculations'
import { budgetToFormData } from '../../budget/model/budget'
import { usePlaces } from '../../places/hooks/usePlaces'
import { usePlanningDays } from '../../planning/hooks/usePlanningDays'
import { getTripDates } from '../../planning/utils/planning-dates'
import { useRestaurants } from '../../restaurants/hooks/useRestaurants'
import { useTransfers } from '../../transfers/hooks/useTransfers'
import {
  transferDirections,
  transferDirectionLabels,
  type TransferDirection,
} from '../../transfers/model/transfer'
import type { BaseTrip } from '../../trips/model/trip'
import { TripSectionCard } from '../components/TripSectionCard'
import {
  getTripWorkspacePath,
  tripWorkspaceSections,
} from '../model/trip-workspace-section'
import styles from './TripWorkspaceOverviewPage.module.css'

const transferStatusSummaryLabels = {
  draft: 'borrador',
  in_progress: 'en preparación',
  completed: 'terminada',
} as const

function formatTransferDirection(direction: TransferDirection) {
  const label = transferDirectionLabels[direction].toLowerCase()

  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`
}

export function TripWorkspaceOverviewPage() {
  const { tripId } = useParams()
  const trip = useOutletContext<BaseTrip>()
  const {
    places,
    status: placesStatus,
  } = usePlaces(tripId ?? '')
  const {
    days: planningDays,
    status: planningStatus,
  } = usePlanningDays(tripId ?? '')
  const {
    accommodations,
    status: accommodationsStatus,
  } = useAccommodations(tripId ?? '')
  const { budget, status: budgetStatus } = useBudget(tripId ?? '')
  const { restaurants, status: restaurantsStatus } = useRestaurants(tripId ?? '')
  const { transfers, status: transfersStatus } = useTransfers(tripId ?? '')

  if (!tripId) {
    return null
  }

  const placesSummary = {
    status: placesStatus,
    total: places.length,
    completed: places.filter(
      (place) => place.contentStatus === 'completed',
    ).length,
    inProgress: places.filter(
      (place) => place.contentStatus === 'in_progress',
    ).length,
    draft: places.filter((place) => place.contentStatus === 'draft').length,
  }
  const tripDates = getTripDates(trip.startDate, trip.endDate)
  const currentPlanningDays = planningDays.filter((day) =>
    tripDates.includes(day.date),
  )
  const planningSummary = {
    kind: 'planning' as const,
    status: planningStatus,
    total: tripDates.length,
    contentCount: planningDays.length,
    completed: currentPlanningDays.filter(
      (day) => day.contentStatus === 'completed',
    ).length,
    inProgress: currentPlanningDays.filter(
      (day) => day.contentStatus === 'in_progress',
    ).length,
    draft: currentPlanningDays.filter(
      (day) => day.contentStatus === 'draft',
    ).length,
    notStarted: Math.max(0, tripDates.length - currentPlanningDays.length),
  }
  const accommodationsSummary = {
    kind: 'accommodations' as const,
    status: accommodationsStatus,
    total: accommodations.length,
    completed: accommodations.filter(
      (accommodation) => accommodation.contentStatus === 'completed',
    ).length,
    inProgress: accommodations.filter(
      (accommodation) => accommodation.contentStatus === 'in_progress',
    ).length,
    draft: accommodations.filter(
      (accommodation) => accommodation.contentStatus === 'draft',
    ).length,
  }
  const automaticCosts = calculateBudgetAutomaticCosts(
    accommodations,
    places,
    trip.participants.length,
  )
  const budgetCalculations = budget
    ? calculateBudget(budgetToFormData(budget), automaticCosts)
    : null
  const budgetSummary = {
    kind: 'budget' as const,
    status: budgetStatus,
    total: budget ? 1 : 0,
    completed: budget?.contentStatus === 'completed' ? 1 : 0,
    inProgress: budget?.contentStatus === 'in_progress' ? 1 : 0,
    draft: budget?.contentStatus === 'draft' ? 1 : 0,
    detail:
      budgetCalculations && budgetCalculations.total > 0
        ? `Total previsto: ${formatBudgetAmount(budgetCalculations.total)}`
        : undefined,
  }
  const reservedRestaurants = restaurants.filter(
    (restaurant) => restaurant.restaurantStatus === 'reserved',
  ).length
  const chosenRestaurants = restaurants.filter(
    (restaurant) => restaurant.restaurantStatus === 'chosen',
  ).length
  const visitedRestaurants = restaurants.filter(
    (restaurant) => restaurant.restaurantStatus === 'visited',
  ).length
  const restaurantDetail = [
    restaurants.length > 0 &&
      `${restaurants.length} ${
        restaurants.length === 1 ? 'restaurante' : 'restaurantes'
      }`,
    reservedRestaurants > 0 &&
      `${reservedRestaurants} reservado${
        reservedRestaurants === 1 ? '' : 's'
      }`,
    chosenRestaurants > 0 &&
      `${chosenRestaurants} elegido${chosenRestaurants === 1 ? '' : 's'}`,
    visitedRestaurants > 0 &&
      `${visitedRestaurants} visitado${visitedRestaurants === 1 ? '' : 's'}`,
  ]
    .filter((item): item is string => Boolean(item))
    .join(' · ')
  const restaurantsSummary = {
    kind: 'restaurants' as const,
    status: restaurantsStatus,
    total: restaurants.length,
    completed: restaurants.filter(
      (restaurant) => restaurant.contentStatus === 'completed',
    ).length,
    inProgress: restaurants.filter(
      (restaurant) => restaurant.contentStatus === 'in_progress',
    ).length,
    draft: restaurants.filter(
      (restaurant) => restaurant.contentStatus === 'draft',
    ).length,
    detail: restaurantDetail || undefined,
  }
  const transfersList = transferDirections.map((direction) => ({
    direction,
    transfer: transfers[direction],
  }))
  const transfersSummaryDetail = transfersList
    .map(({ direction, transfer }) => {
      const statusLabel = transfer
        ? transferStatusSummaryLabels[transfer.contentStatus]
        : 'sin comenzar'

      return `${formatTransferDirection(direction)} ${statusLabel}`
    })
    .join(' · ')
  const transfersSummary = {
    kind: 'transfers' as const,
    status: transfersStatus,
    total: transfersList.filter(({ transfer }) => transfer !== null).length,
    completed: transfersList.filter(
      ({ transfer }) => transfer?.contentStatus === 'completed',
    ).length,
    inProgress: transfersList.filter(
      ({ transfer }) => transfer?.contentStatus === 'in_progress',
    ).length,
    draft: transfersList.filter(
      ({ transfer }) => transfer?.contentStatus === 'draft',
    ).length,
    detail:
      transfersList.some(({ transfer }) => transfer !== null)
        ? transfersSummaryDetail
        : undefined,
  }

  return (
    <section aria-labelledby="trip-summary-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Vista general</p>
        <h2 id="trip-summary-title">Resumen del viaje</h2>
        <p>
          Accede a cada apartado para preparar y consultar la información del
          viaje.
        </p>
      </header>

      <div className={styles.grid}>
        {tripWorkspaceSections.map((section) => (
          <TripSectionCard
            key={section.id}
            section={section}
            to={getTripWorkspacePath(tripId, section.slug)}
            contentSummary={
              section.id === 'places'
                ? placesSummary
                : section.id === 'planning'
                  ? planningSummary
                  : section.id === 'accommodation'
                    ? accommodationsSummary
                    : section.id === 'budget'
                      ? budgetSummary
                      : section.id === 'restaurants'
                        ? restaurantsSummary
                        : section.id === 'transfers'
                          ? transfersSummary
                  : undefined
            }
          />
        ))}
      </div>
    </section>
  )
}
