import { useCallback, useEffect, useState } from 'react'

import type {
  Restaurant,
  RestaurantsLoadStatus,
} from '../model/restaurant'
import { subscribeToRestaurants } from '../services/restaurant-service'

type RestaurantsSnapshot = {
  tripId: string
  subscriptionVersion: number
  restaurants: Restaurant[]
  status: RestaurantsLoadStatus
  error: string | null
}

const initialSnapshot: RestaurantsSnapshot = {
  tripId: '',
  subscriptionVersion: -1,
  restaurants: [],
  status: 'loading',
  error: null,
}

export function useRestaurants(tripId: string) {
  const [subscriptionVersion, setSubscriptionVersion] = useState(0)
  const [snapshot, setSnapshot] = useState(initialSnapshot)

  useEffect(() => {
    return subscribeToRestaurants(
      tripId,
      (restaurants) => {
        setSnapshot({
          tripId,
          subscriptionVersion,
          restaurants,
          status: 'ready',
          error: null,
        })
      },
      (error) => {
        setSnapshot({
          tripId,
          subscriptionVersion,
          restaurants: [],
          status: 'error',
          error: error.message,
        })
      },
    )
  }, [subscriptionVersion, tripId])

  const retry = useCallback(() => {
    setSubscriptionVersion((currentVersion) => currentVersion + 1)
  }, [])

  const isCurrentSnapshot =
    snapshot.tripId === tripId &&
    snapshot.subscriptionVersion === subscriptionVersion

  return {
    restaurants: isCurrentSnapshot ? snapshot.restaurants : [],
    status: isCurrentSnapshot ? snapshot.status : ('loading' as const),
    error: isCurrentSnapshot ? snapshot.error : null,
    retry,
  }
}
