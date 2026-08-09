import {
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from '@imagekit/javascript'

import type { PhotoImageKitAsset } from '../model/photo'
import type { PhotoUploadErrorCode } from '../model/photo-upload'
import { ImageKitAuthError, getImageKitUploadCredentials } from './imagekit-auth-service'

type UploadProcessedPhotoParams = {
  tripId: string
  photoId: string
  file: File
  onProgress: (progress: number) => void
}

export class ImageKitUploadError extends Error {
  constructor(
    message: string,
    readonly code: PhotoUploadErrorCode,
  ) {
    super(message)
    this.name = 'ImageKitUploadError'
  }
}

function requireResponseValue(value: string | undefined, field: string) {
  if (!value) {
    throw new ImageKitUploadError(
      `ImageKit no ha devuelto ${field} para la fotografía subida.`,
      'unknown',
    )
  }

  return value
}

function mapUploadError(error: unknown): ImageKitUploadError {
  if (error instanceof ImageKitAuthError) {
    return new ImageKitUploadError(error.message, error.code)
  }

  if (error instanceof ImageKitUploadNetworkError) {
    return new ImageKitUploadError(
      'No se ha podido completar la subida por un problema de red.',
      'network-failed',
    )
  }

  if (error instanceof ImageKitInvalidRequestError) {
    const isDuplicate = /already exists|file exists|duplicate/i.test(error.message)
    return new ImageKitUploadError(
      isDuplicate
        ? 'Ya existe una fotografía con esta ruta en ImageKit.'
        : 'ImageKit ha rechazado la subida de esta fotografía.',
      isDuplicate ? 'duplicate-file' : 'request-failed',
    )
  }

  if (error instanceof ImageKitServerError) {
    return new ImageKitUploadError(
      'ImageKit no ha podido procesar esta fotografía en este momento.',
      'server-failed',
    )
  }

  return error instanceof ImageKitUploadError
    ? error
    : new ImageKitUploadError(
        'Ha ocurrido un error inesperado al subir la fotografía.',
        'unknown',
      )
}

export async function uploadProcessedPhoto({
  tripId,
  photoId,
  file,
  onProgress,
}: UploadProcessedPhotoParams): Promise<PhotoImageKitAsset> {
  try {
    const credentials = await getImageKitUploadCredentials()
    const response = await upload({
      file,
      fileName: `${photoId}.webp`,
      folder: `/nuestros-viajes/${tripId}`,
      isPrivateFile: false,
      overwriteFile: false,
      publicKey: credentials.publicKey,
      signature: credentials.signature,
      token: credentials.token,
      expire: credentials.expire,
      useUniqueFileName: false,
      onProgress: (event) => {
        if (event.lengthComputable && event.total > 0) {
          onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
        }
      },
    })

    return {
      fileId: requireResponseValue(response.fileId, 'el identificador del archivo'),
      filePath: requireResponseValue(response.filePath, 'la ruta del archivo'),
      url: requireResponseValue(response.url, 'la URL del archivo'),
      thumbnailUrl: response.thumbnailUrl,
      visibility: 'public',
      width: response.width,
      height: response.height,
      sizeBytes: response.size,
      format: 'webp',
    }
  } catch (error) {
    throw mapUploadError(error)
  }
}
