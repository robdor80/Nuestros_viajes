import { useCallback, useEffect, useState } from 'react'
import type { Budget, BudgetLoadStatus } from '../model/budget'
import { subscribeToBudget } from '../services/budget-service'

type BudgetSnapshot = { tripId: string; subscriptionVersion: number; budget: Budget | null; status: BudgetLoadStatus; error: string | null }
const initialSnapshot: BudgetSnapshot = { tripId: '', subscriptionVersion: -1, budget: null, status: 'loading', error: null }

export function useBudget(tripId: string) {
  const [subscriptionVersion, setSubscriptionVersion] = useState(0)
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  useEffect(() => subscribeToBudget(tripId, (budget) => setSnapshot({ tripId, subscriptionVersion, budget, status: 'ready', error: null }), (error) => setSnapshot({ tripId, subscriptionVersion, budget: null, status: 'error', error: error.message })), [subscriptionVersion, tripId])
  const retry = useCallback(() => setSubscriptionVersion((currentVersion) => currentVersion + 1), [])
  const isCurrentSnapshot = snapshot.tripId === tripId && snapshot.subscriptionVersion === subscriptionVersion
  return { budget: isCurrentSnapshot ? snapshot.budget : null, status: isCurrentSnapshot ? snapshot.status : ('loading' as const), error: isCurrentSnapshot ? snapshot.error : null, retry }
}
