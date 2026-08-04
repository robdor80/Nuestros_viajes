import { useEffect, useState } from 'react'

import type { PhotosLoadError, TripPhoto } from '../model/photo'
import { subscribeToPhotos } from '../services/photo-service'

type PhotosSnapshot = {
  tripId: string
  photos: TripPhoto[]
  isLoading: boolean
  error: PhotosLoadError
}

const initialSnapshot: PhotosSnapshot = {
  tripId: '',
  photos: [],
  isLoading: true,
  error: null,
}

export function usePhotos(tripId: string) {
  const [snapshot, setSnapshot] = useState(initialSnapshot)

  useEffect(() => {
    return subscribeToPhotos(
      tripId,
      (photos) => {
        setSnapshot({
          tripId,
          photos,
          isLoading: false,
          error: null,
        })
      },
      (error) => {
        setSnapshot({
          tripId,
          photos: [],
          isLoading: false,
          error: error.message,
        })
      },
    )
  }, [tripId])

  const isCurrentSnapshot = snapshot.tripId === tripId

  return {
    photos: isCurrentSnapshot ? snapshot.photos : [],
    isLoading: isCurrentSnapshot ? snapshot.isLoading : true,
    error: isCurrentSnapshot ? snapshot.error : null,
  }
}
