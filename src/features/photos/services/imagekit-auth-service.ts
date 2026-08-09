import { firebaseAuth } from '../../../infrastructure/firebase/firebaseClient'

type ImageKitUploadCredentials = {
  token: string
  expire: number
  signature: string
  publicKey: string
}

export class ImageKitAuthError extends Error {
  constructor(
    message: string,
    readonly code: 'authentication-failed' | 'authentication-unavailable',
  ) {
    super(message)
    this.name = 'ImageKitAuthError'
  }
}

function getAuthUrl() {
  const workerUrl = import.meta.env.VITE_IMAGEKIT_AUTH_WORKER_URL?.trim()

  if (!workerUrl) {
    throw new ImageKitAuthError(
      'Falta la configuración del servicio de autenticación de ImageKit.',
      'authentication-unavailable',
    )
  }

  return `${workerUrl.replace(/\/$/, '')}/auth`
}

function isUploadCredentials(value: unknown): value is ImageKitUploadCredentials {
  if (!value || typeof value !== 'object') return false

  const credentials = value as Record<string, unknown>
  return (
    typeof credentials.token === 'string' &&
    typeof credentials.signature === 'string' &&
    typeof credentials.publicKey === 'string' &&
    typeof credentials.expire === 'number'
  )
}

export async function getImageKitUploadCredentials() {
  const user = firebaseAuth?.currentUser
  if (!user) {
    throw new ImageKitAuthError(
      'Tu sesión ha caducado. Inicia sesión de nuevo antes de subir fotografías.',
      'authentication-failed',
    )
  }

  let idToken: string
  try {
    idToken = await user.getIdToken()
  } catch {
    throw new ImageKitAuthError(
      'No se ha podido validar tu sesión para subir las fotografías.',
      'authentication-failed',
    )
  }

  let response: Response
  try {
    response = await fetch(getAuthUrl(), {
      headers: { Authorization: `Bearer ${idToken}` },
    })
  } catch {
    throw new ImageKitAuthError(
      'No se ha podido contactar con el servicio de autenticación de ImageKit.',
      'authentication-unavailable',
    )
  }

  if (!response.ok) {
    throw new ImageKitAuthError(
      response.status === 401 || response.status === 403
        ? 'Tu sesión no tiene permiso para subir fotografías.'
        : 'El servicio de autenticación de ImageKit no está disponible ahora.',
      response.status === 401 || response.status === 403
        ? 'authentication-failed'
        : 'authentication-unavailable',
    )
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!isUploadCredentials(payload)) {
    throw new ImageKitAuthError(
      'El servicio de autenticación de ImageKit ha devuelto una respuesta no válida.',
      'authentication-unavailable',
    )
  }

  return payload
}
