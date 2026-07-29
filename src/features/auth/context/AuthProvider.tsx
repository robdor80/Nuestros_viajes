import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  getAuthenticationErrorMessage,
  observeAuthentication,
  prepareAuthentication,
  signInWithGoogle,
  signOut as signOutFromFirebase,
} from '../services/authService'
import type { AuthUser } from '../model/authUser'
import { AuthContext, type AuthContextValue } from './AuthContext'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionPending, setIsActionPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true
    let stopObserving: (() => void) | undefined

    void prepareAuthentication()
      .then(() => {
        if (!isActive) {
          return
        }

        stopObserving = observeAuthentication(
          (nextUser) => {
            if (!isActive) {
              return
            }

            setUser(nextUser)
            setIsLoading(false)
          },
          (authError) => {
            if (!isActive) {
              return
            }

            setError(getAuthenticationErrorMessage(authError))
            setIsLoading(false)
          },
        )
      })
      .catch((authError: unknown) => {
        if (!isActive) {
          return
        }

        setError(getAuthenticationErrorMessage(authError))
        setIsLoading(false)
      })

    return () => {
      isActive = false
      stopObserving?.()
    }
  }, [])

  const signIn = useCallback(async () => {
    setError(null)
    setIsActionPending(true)

    try {
      await signInWithGoogle()
    } catch (authError) {
      setError(getAuthenticationErrorMessage(authError))
    } finally {
      setIsActionPending(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setError(null)
    setIsActionPending(true)

    try {
      await signOutFromFirebase()
    } catch (authError) {
      setError(getAuthenticationErrorMessage(authError))
    } finally {
      setIsActionPending(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isActionPending,
      error,
      signIn,
      signOut,
      clearError,
    }),
    [
      user,
      isLoading,
      isActionPending,
      error,
      signIn,
      signOut,
      clearError,
    ],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
