import { createContext } from 'react'

import type { AuthUser } from '../model/authUser'

export type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  isActionPending: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
