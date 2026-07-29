import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseEnvironment = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const missingEnvironmentVariables = Object.entries(firebaseEnvironment)
  .filter(([, value]) => !value?.trim())
  .map(([key]) => key)

if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Falta configuración de Firebase. Revisa las variables VITE_FIREBASE_* correspondientes a: ${missingEnvironmentVariables.join(', ')}.`,
  )
}

export const firebaseApp = initializeApp(firebaseEnvironment)
export const firebaseAuth = getAuth(firebaseApp)
export const firestore = getFirestore(firebaseApp)
