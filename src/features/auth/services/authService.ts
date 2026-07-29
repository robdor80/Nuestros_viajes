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

import { firebaseAuth } from '../../../infrastructure/firebase/firebaseClient'
import type { AuthUser } from '../model/authUser'

const googleProvider = new GoogleAuthProvider()
let persistencePromise: Promise<void> | null = null

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
    firebaseAuth,
    browserLocalPersistence,
  )

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
    firebaseAuth,
    (user) => {
      onUserChanged(user ? toAuthUser(user) : null)
    },
    onError,
  )
}

export async function signInWithGoogle() {
  await ensureLocalPersistence()

  try {
    await signInWithPopup(firebaseAuth, googleProvider)
    return 'authenticated' as const
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      (error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request')
    ) {
      return 'cancelled' as const
    }

    throw error
  }
}

export async function signOut() {
  await firebaseSignOut(firebaseAuth)
}

export function getAuthenticationErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return 'No se ha podido completar la operación. Inténtalo de nuevo.'
  }

  switch (error.code) {
    case 'auth/popup-blocked':
      return 'El navegador ha bloqueado la ventana de acceso. Permite las ventanas emergentes e inténtalo de nuevo.'
    case 'auth/network-request-failed':
      return 'No se ha podido contactar con Google. Comprueba tu conexión e inténtalo de nuevo.'
    case 'auth/unauthorized-domain':
      return 'Este dominio no está autorizado para iniciar sesión en Firebase.'
    case 'auth/operation-not-allowed':
      return 'El acceso con Google no está habilitado en Firebase.'
    case 'auth/too-many-requests':
      return 'Se han realizado demasiados intentos. Espera unos minutos y vuelve a probar.'
    default:
      return 'No se ha podido completar el acceso con Google. Inténtalo de nuevo.'
  }
}
