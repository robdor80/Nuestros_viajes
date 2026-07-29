import { FirebaseError } from 'firebase/app'
import { doc, getDoc } from 'firebase/firestore'

import {
  firebaseConfigurationError,
  firestore,
} from '../../../infrastructure/firebase/firebaseClient'

class AuthorizationConfigurationError extends Error {}

function requireFirestore() {
  if (!firestore) {
    throw new AuthorizationConfigurationError(
      firebaseConfigurationError ?? 'Cloud Firestore no está disponible.',
    )
  }

  return firestore
}

export async function checkUserAccess(uid: string) {
  const userDocument = doc(requireFirestore(), 'allowedUsers', uid)
  const userSnapshot = await getDoc(userDocument)

  return userSnapshot.exists()
}

export function getAuthorizationErrorMessage(error: unknown) {
  if (error instanceof AuthorizationConfigurationError) {
    return error.message
  }

  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        return 'Firebase no permite comprobar esta cuenta. Revisa las reglas de acceso de Firestore.'
      case 'unavailable':
        return 'No se ha podido conectar con Firestore. Comprueba tu conexión e inténtalo de nuevo.'
      default:
        return 'No se ha podido comprobar si esta cuenta tiene acceso. Inténtalo de nuevo.'
    }
  }

  return 'No se ha podido comprobar si esta cuenta tiene acceso. Inténtalo de nuevo.'
}
