import { useCallback, useRef, useState } from 'react'
import {
  useBeforeUnload,
  useBlocker,
  type BlockerFunction,
} from 'react-router-dom'

type UsePhotoUploadNavigationGuardParams = {
  hasPendingChanges: boolean
  onConfirmExit: () => void
}

export function usePhotoUploadNavigationGuard({
  hasPendingChanges,
  onConfirmExit,
}: UsePhotoUploadNavigationGuardParams) {
  const isConfirmingExitRef = useRef(false)
  const [isConfirmingExit, setIsConfirmingExit] = useState(false)

  const shouldBlockNavigation = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) => {
      const isSameLocation =
        currentLocation.pathname === nextLocation.pathname &&
        currentLocation.search === nextLocation.search &&
        currentLocation.hash === nextLocation.hash

      return (
        hasPendingChanges &&
        !isConfirmingExitRef.current &&
        !isSameLocation
      )
    },
    [hasPendingChanges],
  )
  const blocker = useBlocker(shouldBlockNavigation)
  const isExitConfirmationOpen = blocker.state === 'blocked'

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!hasPendingChanges || isConfirmingExitRef.current) return

        event.preventDefault()
        event.returnValue = ''
      },
      [hasPendingChanges],
    ),
  )

  const cancelExit = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset()
    }

    isConfirmingExitRef.current = false
    setIsConfirmingExit(false)
  }, [blocker])

  const confirmExit = useCallback(() => {
    if (blocker.state !== 'blocked' || isConfirmingExitRef.current) return

    isConfirmingExitRef.current = true
    setIsConfirmingExit(true)
    onConfirmExit()
    blocker.proceed()
  }, [blocker, onConfirmExit])

  return {
    isExitConfirmationOpen,
    isConfirmingExit,
    cancelExit,
    confirmExit,
  }
}
