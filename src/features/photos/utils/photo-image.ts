import { getResponsiveImageAttributes } from '@imagekit/javascript'

import type { TripPhoto } from '../model/photo'

const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/nuestrosviajes'

const imageSizes = {
  gallery: '(min-width: 68rem) 31vw, (min-width: 42rem) 47vw, 100vw',
  lightbox: '100vw',
} as const

export function getPhotoImageAttributes(
  photo: TripPhoto,
  variant: keyof typeof imageSizes,
) {
  const asset = photo.imageKitAsset
  if (!asset) return null

  const fallbackSrc = asset.thumbnailUrl || asset.url

  if (!asset.filePath) {
    return { src: fallbackSrc, fallbackSrc }
  }

  const attributes = getResponsiveImageAttributes({
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    src: asset.filePath,
    sizes: imageSizes[variant],
  })

  return { ...attributes, fallbackSrc }
}
