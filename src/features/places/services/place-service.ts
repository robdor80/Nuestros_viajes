import { FirebaseError } from 'firebase/app'
import {
  Timestamp,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore'

import {
  firebaseConfigurationError,
  firestore,
} from '../../../infrastructure/firebase/firebaseClient'
import {
  tripContentStatuses,
  type TripContentStatus,
} from '../../trip-workspace/model/trip-content'
import {
  placeBestTimes,
  placeCategories,
  placePriorities,
  type Place,
  type PlaceBestTime,
  type PlaceCategory,
  type PlaceFormData,
  type PlacePriority,
  type SavePlaceData,
} from '../model/place'
import { normalizePlaceFormData } from '../utils/place-validation'

type PlacesSubscriber = (places: Place[]) => void
type PlacesSubscriptionErrorHandler = (error: Error) => void

type PlaceOperation = 'create' | 'load' | 'update' | 'delete'

class PlaceServiceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'PlaceServiceError'
  }
}

function requireFirestore() {
  if (!firestore) {
    throw new PlaceServiceError(
      firebaseConfigurationError ?? 'Cloud Firestore no está disponible.',
    )
  }

  return firestore
}

function requireIdentifier(value: string, label: string) {
  if (!value.trim()) {
    throw new PlaceServiceError(`No se ha podido identificar ${label}.`)
  }
}

function requireString(data: DocumentData, field: string) {
  const value = data[field]

  if (typeof value !== 'string') {
    throw new PlaceServiceError(
      `El lugar guardado no contiene un valor válido para «${field}».`,
    )
  }

  return value
}

function requireTimestamp(data: DocumentData, field: string) {
  const value = data[field]

  if (!(value instanceof Timestamp)) {
    throw new PlaceServiceError(
      `El lugar guardado no contiene una fecha válida para «${field}».`,
    )
  }

  return value.toDate().toISOString()
}

function getOptionalTimestamp(data: DocumentData, field: string) {
  const value = data[field]
  return value instanceof Timestamp ? value.toDate().toISOString() : undefined
}

function getOptionalString(data: DocumentData, field: string) {
  const value = data[field]
  return typeof value === 'string' ? value : undefined
}

function requireReservationValue(data: DocumentData) {
  const value = data.requiresReservation

  if (typeof value === 'boolean' || value === null) {
    return value
  }

  throw new PlaceServiceError(
    'El lugar guardado contiene un valor de reserva desconocido.',
  )
}

function requireEnumOrEmpty<T extends string>(
  data: DocumentData,
  field: string,
  values: readonly T[],
) {
  const value = requireString(data, field)

  if (value === '' || values.includes(value as T)) {
    return value as T | ''
  }

  throw new PlaceServiceError(
    `El lugar guardado contiene un valor desconocido para «${field}».`,
  )
}

function mapPlaceDocument(
  snapshot: DocumentSnapshot<DocumentData>,
): Place {
  if (!snapshot.exists()) {
    throw new PlaceServiceError('El lugar ya no está disponible.')
  }

  const data = snapshot.data({ serverTimestamps: 'estimate' })
  const contentStatus = requireString(data, 'contentStatus')

  if (!tripContentStatuses.includes(contentStatus as TripContentStatus)) {
    throw new PlaceServiceError(
      'El lugar guardado contiene un estado desconocido.',
    )
  }

  return {
    id: snapshot.id,
    name: requireString(data, 'name'),
    imageUrl: requireString(data, 'imageUrl'),
    category: requireEnumOrEmpty<PlaceCategory>(
      data,
      'category',
      placeCategories,
    ),
    priority: requireEnumOrEmpty<PlacePriority>(
      data,
      'priority',
      placePriorities,
    ),
    description: requireString(data, 'description'),
    address: requireString(data, 'address'),
    mapsUrl: requireString(data, 'mapsUrl'),
    websiteUrl: requireString(data, 'websiteUrl'),
    openingHours: requireString(data, 'openingHours'),
    price: requireString(data, 'price'),
    estimatedDuration: requireString(data, 'estimatedDuration'),
    bestTime: requireEnumOrEmpty<PlaceBestTime>(
      data,
      'bestTime',
      placeBestTimes,
    ),
    requiresReservation: requireReservationValue(data),
    notes: requireString(data, 'notes'),
    contentStatus: contentStatus as TripContentStatus,
    createdAt: requireTimestamp(data, 'createdAt'),
    createdBy: requireString(data, 'createdBy'),
    updatedAt: requireTimestamp(data, 'updatedAt'),
    updatedBy: requireString(data, 'updatedBy'),
    completedAt: getOptionalTimestamp(data, 'completedAt'),
    completedBy: getOptionalString(data, 'completedBy'),
  }
}

const operationErrorMessages: Record<PlaceOperation, string> = {
  create: 'No se ha podido guardar el lugar. Inténtalo de nuevo.',
  load: 'No se han podido cargar los lugares. Inténtalo de nuevo.',
  update: 'No se han podido guardar los cambios. Inténtalo de nuevo.',
  delete: 'No se ha podido eliminar el lugar. Inténtalo de nuevo.',
}

const permissionErrorMessages: Record<PlaceOperation, string> = {
  create: 'Firestore no permite crear lugares con esta cuenta.',
  load: 'Firestore no permite consultar los lugares con esta cuenta.',
  update: 'Firestore no permite editar lugares con esta cuenta.',
  delete: 'Firestore no permite eliminar lugares con esta cuenta.',
}

function toPlaceServiceError(error: unknown, operation: PlaceOperation) {
  if (error instanceof PlaceServiceError) {
    return error
  }

  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        return new PlaceServiceError(permissionErrorMessages[operation], {
          cause: error,
        })
      case 'unavailable':
      case 'network-request-failed':
        return new PlaceServiceError(
          'No se ha podido conectar con Firestore. Comprueba tu conexión e inténtalo de nuevo.',
          { cause: error },
        )
    }
  }

  return new PlaceServiceError(operationErrorMessages[operation], {
    cause: error,
  })
}

function buildPlaceDocument(data: PlaceFormData) {
  return normalizePlaceFormData(data)
}

function sortPlaces(places: Place[]) {
  const statusOrder: Record<TripContentStatus, number> = {
    completed: 0,
    in_progress: 1,
    draft: 2,
  }

  return [...places].sort((firstPlace, secondPlace) => {
    const statusDifference =
      statusOrder[firstPlace.contentStatus] -
      statusOrder[secondPlace.contentStatus]

    if (statusDifference !== 0) {
      return statusDifference
    }

    return secondPlace.updatedAt.localeCompare(firstPlace.updatedAt)
  })
}

export async function createPlace(
  tripId: string,
  data: SavePlaceData,
  userId: string,
) {
  requireIdentifier(tripId, 'el viaje')
  requireIdentifier(userId, 'la persona usuaria')

  try {
    const database = requireFirestore()
    const placeReference = doc(
      collection(database, 'trips', tripId, 'places'),
    )
    const placeDocument = {
      ...buildPlaceDocument(data),
      id: placeReference.id,
      contentStatus: data.contentStatus,
      createdAt: serverTimestamp(),
      createdBy: userId,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
      ...(data.contentStatus === 'completed' && {
        completedAt: serverTimestamp(),
        completedBy: userId,
      }),
    }

    await setDoc(placeReference, placeDocument)
  } catch (error) {
    throw toPlaceServiceError(error, 'create')
  }
}

export async function updatePlace(
  tripId: string,
  place: Place,
  data: SavePlaceData,
  userId: string,
) {
  requireIdentifier(tripId, 'el viaje')
  requireIdentifier(place.id, 'el lugar')
  requireIdentifier(userId, 'la persona usuaria')

  try {
    const isBecomingCompleted =
      data.contentStatus === 'completed' &&
      place.contentStatus !== 'completed'
    const isLeavingCompleted =
      data.contentStatus !== 'completed' &&
      place.contentStatus === 'completed'

    await updateDoc(
      doc(requireFirestore(), 'trips', tripId, 'places', place.id),
      {
        ...buildPlaceDocument(data),
        contentStatus: data.contentStatus,
        updatedAt: serverTimestamp(),
        updatedBy: userId,
        ...(isBecomingCompleted && {
          completedAt: serverTimestamp(),
          completedBy: userId,
        }),
        ...(isLeavingCompleted && {
          completedAt: deleteField(),
          completedBy: deleteField(),
        }),
      },
    )
  } catch (error) {
    throw toPlaceServiceError(error, 'update')
  }
}

export async function deletePlace(
  tripId: string,
  placeId: string,
  userId: string,
) {
  requireIdentifier(tripId, 'el viaje')
  requireIdentifier(placeId, 'el lugar')
  requireIdentifier(userId, 'la persona usuaria')

  try {
    await deleteDoc(
      doc(requireFirestore(), 'trips', tripId, 'places', placeId),
    )
  } catch (error) {
    throw toPlaceServiceError(error, 'delete')
  }
}

export function subscribeToPlaces(
  tripId: string,
  onData: PlacesSubscriber,
  onError: PlacesSubscriptionErrorHandler,
) {
  try {
    requireIdentifier(tripId, 'el viaje')

    return onSnapshot(
      collection(requireFirestore(), 'trips', tripId, 'places'),
      (placesSnapshot) => {
        try {
          const places = placesSnapshot.docs.map(mapPlaceDocument)
          onData(sortPlaces(places))
        } catch (error) {
          onError(toPlaceServiceError(error, 'load'))
        }
      },
      (error) => {
        onError(toPlaceServiceError(error, 'load'))
      },
    )
  } catch (error) {
    onError(toPlaceServiceError(error, 'load'))
    return () => undefined
  }
}
