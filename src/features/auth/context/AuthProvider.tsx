import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  checkUserAccess,
  getAuthorizationErrorMessage,
} from '../services/authorizationService'
import {
  getAuthenticationErrorMessage,
  observeAuthentication,
  prepareAuthentication,
  signInWithGoogle,
  signOut as signOutFromFirebase,
} from '../services/authService'
import type { AuthUser } from '../model/authUser'
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from './AuthContext'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [isActionPending, setIsActionPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessCheckVersion, setAccessCheckVersion] = useState(0)

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
            setError((currentError) => (nextUser ? null : currentError))
            setStatus(nextUser ? 'checkingAccess' : 'signedOut')
          },
          (authError) => {
            if (!isActive) {
              return
            }

            setUser(null)
            setError(getAuthenticationErrorMessage(authError))
            setStatus('error')
          },
        )
      })
      .catch((authError: unknown) => {
        if (!isActive) {
          return
        }

        setUser(null)
        setError(getAuthenticationErrorMessage(authError))
        setStatus('error')
      })

    return () => {
      isActive = false
      stopObserving?.()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }

    let isActive = true

    void checkUserAccess(user.uid)
      .then(async (hasAccess) => {
        if (!isActive) {
          return
        }

        if (hasAccess) {
          setStatus('authorized')
          return
        }

        setError('Esta cuenta de Google no tiene acceso a Nuestros viajes.')

        try {
          await signOutFromFirebase()
        } catch (authError) {
          if (!isActive) {
            return
          }

          setError(getAuthenticationErrorMessage(authError))
          setStatus('error')
          return
        }

        if (!isActive) {
          return
        }

        setUser(null)
        setStatus('signedOut')
      })
      .catch((authorizationError: unknown) => {
        if (!isActive) {
          return
        }

        setError(getAuthorizationErrorMessage(authorizationError))
        setStatus('error')
      })

    return () => {
      isActive = false
    }
  }, [accessCheckVersion, user])

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

  const retryAccessCheck = useCallback(() => {
    if (user) {
      setError(null)
      setStatus('checkingAccess')
      setAccessCheckVersion((currentVersion) => currentVersion + 1)
    }
  }, [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isActionPending,
      error,
      signIn,
      signOut,
      retryAccessCheck,
      clearError,
    }),
    [
      user,
      status,
      isActionPending,
      error,
      signIn,
      signOut,
      retryAccessCheck,
      clearError,
    ],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
