import { useCallback, useEffect, useState } from 'react'

import {
  emptyTransfersByDirection,
  type TransfersByDirection,
  type TransfersLoadStatus,
} from '../model/transfer'
import { subscribeToTransfers } from '../services/transfer-service'

type TransfersSnapshot = {
  tripId: string
  subscriptionVersion: number
  transfers: TransfersByDirection
  status: TransfersLoadStatus
  error: string | null
}

const initialSnapshot: TransfersSnapshot = {
  tripId: '',
  subscriptionVersion: -1,
  transfers: emptyTransfersByDirection,
  status: 'loading',
  error: null,
}

export function useTransfers(tripId: string) {
  const [subscriptionVersion, setSubscriptionVersion] = useState(0)
  const [snapshot, setSnapshot] = useState(initialSnapshot)

  useEffect(() => {
    return subscribeToTransfers(
      tripId,
      (transfers) => {
        setSnapshot({
          tripId,
          subscriptionVersion,
          transfers,
          status: 'ready',
          error: null,
        })
      },
      (error) => {
        setSnapshot({
          tripId,
          subscriptionVersion,
          transfers: emptyTransfersByDirection,
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
    transfers: isCurrentSnapshot
      ? snapshot.transfers
      : emptyTransfersByDirection,
    status: isCurrentSnapshot ? snapshot.status : ('loading' as const),
    error: isCurrentSnapshot ? snapshot.error : null,
    retry,
  }
}
