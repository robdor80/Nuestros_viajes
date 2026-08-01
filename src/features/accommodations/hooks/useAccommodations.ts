import { useCallback, useEffect, useState } from 'react'

import type {
  Accommodation,
  AccommodationsLoadStatus,
} from '../model/accommodation'
import { subscribeToAccommodations } from '../services/accommodation-service'

type AccommodationsSnapshot = {
  tripId: string
  subscriptionVersion: number
  accommodations: Accommodation[]
  status: AccommodationsLoadStatus
  error: string | null
}

const initialSnapshot: AccommodationsSnapshot = {
  tripId: '',
  subscriptionVersion: -1,
  accommodations: [],
  status: 'loading',
  error: null,
}

export function useAccommodations(tripId: string) {
  const [subscriptionVersion, setSubscriptionVersion] = useState(0)
  const [snapshot, setSnapshot] = useState(initialSnapshot)

  useEffect(() => {
    return subscribeToAccommodations(
      tripId,
      (accommodations) => {
        setSnapshot({
          tripId,
          subscriptionVersion,
          accommodations,
          status: 'ready',
          error: null,
        })
      },
      (error) => {
        setSnapshot({
          tripId,
          subscriptionVersion,
          accommodations: [],
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
    accommodations: isCurrentSnapshot ? snapshot.accommodations : [],
    status: isCurrentSnapshot ? snapshot.status : ('loading' as const),
    error: isCurrentSnapshot ? snapshot.error : null,
    retry,
  }
}
