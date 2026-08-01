import { FirebaseError } from 'firebase/app'
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Unsubscribe,
  type User,
} from 'firebase/auth'

import {
  firebaseAuth,
  firebaseConfigurationError,
} from '../../../infrastructure/firebase/firebaseClient'
import type { AuthUser } from '../model/authUser'

const googleProvider = new GoogleAuthProvider()
let persistencePromise: Promise<void> | null = null
let isLocalPersistenceReady = false

class FirebaseConfigurationError extends Error {}

function requireFirebaseAuth() {
  if (!firebaseAuth) {
    throw new FirebaseConfigurationError(
      firebaseConfigurationError ??
        'Firebase Authentication no está disponible.',
    )
  }

  return firebaseAuth
}

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    displayName: user.displayName?.trim() || 'Usuario de Google',
    email: user.email?.trim() || 'Correo no disponible',
    photoUrl: user.photoURL,
  }
}

function ensureLocalPersistence() {
  persistencePromise ??= setPersistence(
    requireFirebaseAuth(),
    browserLocalPersistence,
  ).then(() => {
    isLocalPersistenceReady = true
  })

  return persistencePromise
}

export async function prepareAuthentication() {
  await ensureLocalPersistence()
}

export function observeAuthentication(
  onUserChanged: (user: AuthUser | null) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  return onAuthStateChanged(
    requireFirebaseAuth(),
    (user) => {
      onUserChanged(user ? toAuthUser(user) : null)
    },
    onError,
  )
}

export async function signInWithGoogle() {
  const auth = requireFirebaseAuth()

  if (!isLocalPersistenceReady) {
    throw new FirebaseConfigurationError(
      'Firebase Authentication todavía está preparando la sesión. Inténtalo de nuevo.',
    )
  }

  await signInWithPopup(auth, googleProvider)
  return 'authenticated' as const
}

export async function signOut() {
  await firebaseSignOut(requireFirebaseAuth())
}

export function getAuthenticationErrorMessage(error: unknown) {
  if (error instanceof FirebaseConfigurationError) {
    return error.message
  }

  if (!(error instanceof FirebaseError)) {
    return 'No se ha podido completar la operación. Inténtalo de nuevo.'
  }

  switch (error.code) {
    case 'auth/popup-blocked':
      return 'El navegador ha bloqueado la ventana de acceso. Permite las ventanas emergentes para esta página e inténtalo de nuevo.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'El acceso con Google se ha cancelado.'
    case 'auth/network-request-failed':
      return 'No se pudo conectar con Google. Comprueba tu conexión e inténtalo de nuevo.'
    case 'auth/unauthorized-domain':
      return 'No se puede iniciar sesión desde este dominio. Revisa la configuración de Firebase Authentication.'
    case 'auth/operation-not-allowed':
      return 'El acceso con Google no está habilitado en Firebase.'
    case 'auth/invalid-api-key':
      return 'La configuración de Firebase no es válida. Revisa la clave de Firebase Authentication.'
    case 'auth/internal-error':
      return 'Firebase no pudo completar el acceso con Google. Inténtalo de nuevo.'
    case 'auth/too-many-requests':
      return 'Se han realizado demasiados intentos. Espera unos minutos y vuelve a probar.'
    default:
      return 'No se pudo completar el acceso con Google. Inténtalo de nuevo.'
  }
}
