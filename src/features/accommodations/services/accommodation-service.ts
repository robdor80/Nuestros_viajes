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
  accommodationTypes,
  bookingPlatforms,
  type Accommodation,
  type AccommodationFormData,
  type AccommodationType,
  type BookingPlatform,
  type SaveAccommodationData,
} from '../model/accommodation'
import { normalizeAccommodationFormData } from '../utils/accommodation-validation'

type AccommodationsSubscriber = (accommodations: Accommodation[]) => void
type AccommodationsSubscriptionErrorHandler = (error: Error) => void
type AccommodationOperation = 'create' | 'load' | 'update' | 'delete'

class AccommodationServiceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'AccommodationServiceError'
  }
}

function requireFirestore() {
  if (!firestore) {
    throw new AccommodationServiceError(
      firebaseConfigurationError ?? 'Cloud Firestore no está disponible.',
    )
  }

  return firestore
}

function requireIdentifier(value: string, label: string) {
  if (!value.trim()) {
    throw new AccommodationServiceError(`No se ha podido identificar ${label}.`)
  }
}

function requireString(data: DocumentData, field: string) {
  const value = data[field]

  if (typeof value !== 'string') {
    throw new AccommodationServiceError(
      `El alojamiento guardado no contiene un valor válido para «${field}».`,
    )
  }

  return value
}

function requireBoolean(data: DocumentData, field: string) {
  const value = data[field]

  if (typeof value !== 'boolean') {
    throw new AccommodationServiceError(
      `El alojamiento guardado no contiene un interruptor válido para «${field}».`,
    )
  }

  return value
}

function requirePaidValue(data: DocumentData) {
  const value = data.isPaid

  if (typeof value === 'boolean' || value === null) {
    return value
  }

  throw new AccommodationServiceError(
    'El alojamiento guardado contiene un valor de pago desconocido.',
  )
}

function requireTimestamp(data: DocumentData, field: string) {
  const value = data[field]

  if (!(value instanceof Timestamp)) {
    throw new AccommodationServiceError(
      `El alojamiento guardado no contiene una fecha válida para «${field}».`,
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

function requireEnumOrEmpty<T extends string>(
  data: DocumentData,
  field: string,
  values: readonly T[],
) {
  const value = requireString(data, field)

  if (value === '' || values.includes(value as T)) {
    return value as T | ''
  }

  throw new AccommodationServiceError(
    `El alojamiento guardado contiene un valor desconocido para «${field}».`,
  )
}

function mapAccommodationDocument(
  snapshot: DocumentSnapshot<DocumentData>,
): Accommodation {
  if (!snapshot.exists()) {
    throw new AccommodationServiceError(
      'El alojamiento ya no está disponible.',
    )
  }

  const data = snapshot.data({ serverTimestamps: 'estimate' })
  const contentStatus = requireString(data, 'contentStatus')

  if (!tripContentStatuses.includes(contentStatus as TripContentStatus)) {
    throw new AccommodationServiceError(
      'El alojamiento guardado contiene un estado desconocido.',
    )
  }

  return {
    id: snapshot.id,
    name: requireString(data, 'name'),
    imageUrl: requireString(data, 'imageUrl'),
    type: requireEnumOrEmpty<AccommodationType>(
      data,
      'type',
      accommodationTypes,
    ),
    address: requireString(data, 'address'),
    mapsUrl: requireString(data, 'mapsUrl'),
    websiteUrl: requireString(data, 'websiteUrl'),
    checkInDate: requireString(data, 'checkInDate'),
    checkOutDate: requireString(data, 'checkOutDate'),
    nights: requireString(data, 'nights'),
    breakfastIncluded: requireBoolean(data, 'breakfastIncluded'),
    parkingIncluded: requireBoolean(data, 'parkingIncluded'),
    freeCancellation: requireBoolean(data, 'freeCancellation'),
    pool: requireBoolean(data, 'pool'),
    totalPrice: requireString(data, 'totalPrice'),
    pricePerNight: requireString(data, 'pricePerNight'),
    isPaid: requirePaidValue(data),
    freeCancellationDeadline: requireString(
      data,
      'freeCancellationDeadline',
    ),
    checkInTime: requireString(data, 'checkInTime'),
    checkOutTime: requireString(data, 'checkOutTime'),
    reservationCode: requireString(data, 'reservationCode'),
    bookingPlatform: requireEnumOrEmpty<BookingPlatform>(
      data,
      'bookingPlatform',
      bookingPlatforms,
    ),
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

const operationErrorMessages: Record<AccommodationOperation, string> = {
  create: 'No se ha podido guardar el alojamiento. Inténtalo de nuevo.',
  load: 'No se han podido cargar los alojamientos. Inténtalo de nuevo.',
  update: 'No se han podido guardar los cambios. Inténtalo de nuevo.',
  delete: 'No se ha podido eliminar el alojamiento. Inténtalo de nuevo.',
}

const permissionErrorMessages: Record<AccommodationOperation, string> = {
  create: 'Firestore no permite crear alojamientos con esta cuenta.',
  load: 'Firestore no permite consultar los alojamientos con esta cuenta.',
  update: 'Firestore no permite editar alojamientos con esta cuenta.',
  delete: 'Firestore no permite eliminar alojamientos con esta cuenta.',
}

function toAccommodationServiceError(
  error: unknown,
  operation: AccommodationOperation,
) {
  if (error instanceof AccommodationServiceError) {
    return error
  }

  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        return new AccommodationServiceError(
          permissionErrorMessages[operation],
          { cause: error },
        )
      case 'unavailable':
      case 'network-request-failed':
        return new AccommodationServiceError(
          'No se ha podido conectar con Firestore. Comprueba tu conexión e inténtalo de nuevo.',
          { cause: error },
        )
    }
  }

  return new AccommodationServiceError(operationErrorMessages[operation], {
    cause: error,
  })
}

function buildAccommodationDocument(data: AccommodationFormData) {
  return normalizeAccommodationFormData(data)
}

function sortAccommodations(accommodations: Accommodation[]) {
  const statusOrder: Record<TripContentStatus, number> = {
    completed: 0,
    in_progress: 1,
    draft: 2,
  }

  return [...accommodations].sort((first, second) => {
    const statusDifference =
      statusOrder[first.contentStatus] - statusOrder[second.contentStatus]

    if (statusDifference !== 0) {
      return statusDifference
    }

    return second.updatedAt.localeCompare(first.updatedAt)
  })
}

export async function createAccommodation(
  tripId: string,
  data: SaveAccommodationData,
  userId: string,
) {
  requireIdentifier(tripId, 'el viaje')
  requireIdentifier(userId, 'la persona usuaria')

  try {
    const database = requireFirestore()
    const accommodationReference = doc(
      collection(database, 'trips', tripId, 'accommodations'),
    )
    const accommodationDocument = {
      ...buildAccommodationDocument(data),
      id: accommodationReference.id,
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

    await setDoc(accommodationReference, accommodationDocument)
  } catch (error) {
    throw toAccommodationServiceError(error, 'create')
  }
}

export async function updateAccommodation(
  tripId: string,
  accommodation: Accommodation,
  data: SaveAccommodationData,
  userId: string,
) {
  requireIdentifier(tripId, 'el viaje')
  requireIdentifier(accommodation.id, 'el alojamiento')
  requireIdentifier(userId, 'la persona usuaria')

  try {
    const isBecomingCompleted =
      data.contentStatus === 'completed' &&
      accommodation.contentStatus !== 'completed'
    const isLeavingCompleted =
      data.contentStatus !== 'completed' &&
      accommodation.contentStatus === 'completed'

    await updateDoc(
      doc(
        requireFirestore(),
        'trips',
        tripId,
        'accommodations',
        accommodation.id,
      ),
      {
        ...buildAccommodationDocument(data),
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
    throw toAccommodationServiceError(error, 'update')
  }
}

export async function deleteAccommodation(
  tripId: string,
  accommodationId: string,
  userId: string,
) {
  requireIdentifier(tripId, 'el viaje')
  requireIdentifier(accommodationId, 'el alojamiento')
  requireIdentifier(userId, 'la persona usuaria')

  try {
    await deleteDoc(
      doc(requireFirestore(), 'trips', tripId, 'accommodations', accommodationId),
    )
  } catch (error) {
    throw toAccommodationServiceError(error, 'delete')
  }
}

export function subscribeToAccommodations(
  tripId: string,
  onData: AccommodationsSubscriber,
  onError: AccommodationsSubscriptionErrorHandler,
) {
  try {
    requireIdentifier(tripId, 'el viaje')

    return onSnapshot(
      collection(requireFirestore(), 'trips', tripId, 'accommodations'),
      (accommodationsSnapshot) => {
        try {
          const accommodations = accommodationsSnapshot.docs.map(
            mapAccommodationDocument,
          )
          onData(sortAccommodations(accommodations))
        } catch (error) {
          onError(toAccommodationServiceError(error, 'load'))
        }
      },
      (error) => {
        onError(toAccommodationServiceError(error, 'load'))
      },
    )
  } catch (error) {
    onError(toAccommodationServiceError(error, 'load'))
    return () => undefined
  }
}
