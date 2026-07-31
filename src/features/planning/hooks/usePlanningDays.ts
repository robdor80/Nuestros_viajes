import { useCallback, useEffect, useState } from 'react'

import type { PlanningDay, PlanningDaysLoadStatus } from '../model/planning'
import { subscribeToPlanningDays } from '../services/planning-service'

type Snapshot = {
  tripId: string
  version: number
  days: PlanningDay[]
  status: PlanningDaysLoadStatus
  error: string | null
}

const initialSnapshot: Snapshot = {
  tripId: '',
  version: -1,
  days: [],
  status: 'loading',
  error: null,
}

export function usePlanningDays(tripId: string) {
  const [version, setVersion] = useState(0)
  const [snapshot, setSnapshot] = useState(initialSnapshot)

  useEffect(() => subscribeToPlanningDays(
    tripId,
    (days) => setSnapshot({ tripId, version, days, status: 'ready', error: null }),
    (error) => setSnapshot({ tripId, version, days: [], status: 'error', error: error.message }),
  ), [tripId, version])

  const retry = useCallback(() => setVersion((current) => current + 1), [])
  const current = snapshot.tripId === tripId && snapshot.version === version

  return {
    days: current ? snapshot.days : [],
    status: current ? snapshot.status : ('loading' as const),
    error: current ? snapshot.error : null,
    retry,
  }
}
