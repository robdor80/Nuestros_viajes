import { useCallback, useEffect, useState } from 'react'

import type { Place, PlacesLoadStatus } from '../model/place'
import { subscribeToPlaces } from '../services/place-service'

type PlacesSnapshot = {
  tripId: string
  subscriptionVersion: number
  places: Place[]
  status: PlacesLoadStatus
  error: string | null
}

const initialSnapshot: PlacesSnapshot = {
  tripId: '',
  subscriptionVersion: -1,
  places: [],
  status: 'loading',
  error: null,
}

export function usePlaces(tripId: string) {
  const [subscriptionVersion, setSubscriptionVersion] = useState(0)
  const [snapshot, setSnapshot] = useState(initialSnapshot)

  useEffect(() => {
    return subscribeToPlaces(
      tripId,
      (places) => {
        setSnapshot({
          tripId,
          subscriptionVersion,
          places,
          status: 'ready',
          error: null,
        })
      },
      (error) => {
        setSnapshot({
          tripId,
          subscriptionVersion,
          places: [],
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
    places: isCurrentSnapshot ? snapshot.places : [],
    status: isCurrentSnapshot ? snapshot.status : ('loading' as const),
    error: isCurrentSnapshot ? snapshot.error : null,
    retry,
  }
}
