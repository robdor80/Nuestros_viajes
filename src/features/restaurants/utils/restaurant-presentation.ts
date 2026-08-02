import type { Restaurant, RestaurantStatus } from '../model/restaurant'

const restaurantStatusOrder: Record<RestaurantStatus, number> = {
  reserved: 0,
  chosen: 1,
  option: 2,
  visited: 3,
  discarded: 4,
}

export function formatRestaurantDate(date: string) {
  if (!date) return ''

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00.000Z`))
}

export function normalizeRestaurantSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es-ES')
}

export function sortRestaurants(restaurants: Restaurant[]) {
  return [...restaurants].sort((first, second) => {
    const statusDifference =
      restaurantStatusOrder[first.restaurantStatus] -
      restaurantStatusOrder[second.restaurantStatus]

    if (statusDifference !== 0) return statusDifference

    const firstDate = first.plannedDate || first.reservationDate
    const secondDate = second.plannedDate || second.reservationDate

    if (firstDate !== secondDate) {
      if (!firstDate) return 1
      if (!secondDate) return -1
      return firstDate.localeCompare(secondDate)
    }

    if (first.plannedTime !== second.plannedTime) {
      if (!first.plannedTime) return 1
      if (!second.plannedTime) return -1
      return first.plannedTime.localeCompare(second.plannedTime)
    }

    return first.name.localeCompare(second.name, 'es', {
      sensitivity: 'base',
    })
  })
}

export function matchesRestaurantSearch(
  restaurant: Restaurant,
  searchQuery: string,
) {
  const normalizedQuery = normalizeRestaurantSearch(searchQuery.trim())
  if (!normalizedQuery) return true

  return normalizeRestaurantSearch(
    [
      restaurant.name,
      restaurant.locality,
      restaurant.area,
      restaurant.venueType,
      ...restaurant.cuisineTypes,
    ].join(' '),
  ).includes(normalizedQuery)
}
