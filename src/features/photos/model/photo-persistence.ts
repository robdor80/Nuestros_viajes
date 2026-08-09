export type PhotoPersistenceStatus =
  | 'pending'
  | 'saving'
  | 'completed'
  | 'failed'

export type PhotoPersistence = {
  status: PhotoPersistenceStatus
  errorMessage?: string
  savedAt?: number
}

export function createPendingPhotoPersistence(): PhotoPersistence {
  return { status: 'pending' }
}
