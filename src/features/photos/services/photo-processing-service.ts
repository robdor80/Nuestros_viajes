import type { PhotoProcessingErrorCode, ProcessedPhoto } from '../model/photo-processing'

const MAX_LONG_EDGE = 2_400
const INITIAL_WEBP_QUALITY = 0.82
const COMPRESSED_WEBP_QUALITY = 0.75
const LARGE_OUTPUT_BYTES = 900 * 1024

export class PhotoProcessingError extends Error {
  constructor(
    public readonly code: PhotoProcessingErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'PhotoProcessingError'
  }
}

function getScaledDimensions(width: number, height: number) {
  const scale = Math.max(width, height) > MAX_LONG_EDGE
    ? MAX_LONG_EDGE / Math.max(width, height)
    : 1

  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

function applyOrientation(context: CanvasRenderingContext2D, orientation: number, width: number, height: number) {
  switch (orientation) {
    case 2: context.setTransform(-1, 0, 0, 1, width, 0); break
    case 3: context.setTransform(-1, 0, 0, -1, width, height); break
    case 4: context.setTransform(1, 0, 0, -1, 0, height); break
    case 5: context.setTransform(0, 1, 1, 0, 0, 0); break
    case 6: context.setTransform(0, 1, -1, 0, height, 0); break
    case 7: context.setTransform(0, -1, -1, 0, height, width); break
    case 8: context.setTransform(0, -1, 1, 0, 0, width); break
    default: context.setTransform(1, 0, 0, 1, 0, 0)
  }
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new PhotoProcessingError('conversion-failed', 'No se ha podido convertir la fotografía.'))
      } else if (blob.type !== 'image/webp') {
        reject(new PhotoProcessingError('webp-not-supported', 'Este navegador no puede generar imágenes WebP.'))
      } else {
        resolve(blob)
      }
    }, 'image/webp', quality)
  })
}

function getWebpFileName(fileName: string) {
  const extensionIndex = fileName.lastIndexOf('.')
  const baseName = extensionIndex > 0 ? fileName.slice(0, extensionIndex) : fileName
  return `${baseName || 'foto'}.webp`
}

export async function processPhotoLocally({ file, orientation }: { file: File; orientation?: number }): Promise<{ result: ProcessedPhoto; isLarge: boolean }> {
  let bitmap: ImageBitmap

  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'none' })
  } catch (error) {
    throw new PhotoProcessingError('decode-failed', 'No se ha podido leer esta fotografía en el navegador.', { cause: error })
  }

  try {
    const dimensions = getScaledDimensions(bitmap.width, bitmap.height)
    const normalizedOrientation = orientation && orientation >= 1 && orientation <= 8 ? orientation : 1
    const swapDimensions = [5, 6, 7, 8].includes(normalizedOrientation)
    const outputWidth = swapDimensions ? dimensions.height : dimensions.width
    const outputHeight = swapDimensions ? dimensions.width : dimensions.height
    const canvas = document.createElement('canvas')
    canvas.width = outputWidth
    canvas.height = outputHeight
    const context = canvas.getContext('2d')

    if (!context) {
      throw new PhotoProcessingError('conversion-failed', 'No se ha podido preparar la imagen para convertirla.')
    }

    applyOrientation(context, normalizedOrientation, dimensions.width, dimensions.height)
    context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, dimensions.width, dimensions.height)

    let quality = INITIAL_WEBP_QUALITY
    let blob = await canvasToWebp(canvas, quality)
    if (blob.size > LARGE_OUTPUT_BYTES) {
      quality = COMPRESSED_WEBP_QUALITY
      blob = await canvasToWebp(canvas, quality)
    }

    const processedFile = new File([blob], getWebpFileName(file.name), {
      type: 'image/webp',
      lastModified: file.lastModified,
    })
    return {
      result: {
        file: processedFile,
        objectUrl: URL.createObjectURL(processedFile),
        width: outputWidth,
        height: outputHeight,
        sizeBytes: processedFile.size,
        quality,
      },
      isLarge: processedFile.size > LARGE_OUTPUT_BYTES,
    }
  } finally {
    bitmap.close()
  }
}
