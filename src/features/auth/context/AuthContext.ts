import { createContext } from 'react'

import type { AuthUser } from '../model/authUser'

export type AuthStatus =
  | 'loading'
  | 'signedOut'
  | 'checkingAccess'
  | 'authorized'
  | 'unauthorized'
  | 'error'

export type AuthContextValue = {
  user: AuthUser | null
  status: AuthStatus
  isActionPending: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  retryAccessCheck: () => void
  clearError: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
