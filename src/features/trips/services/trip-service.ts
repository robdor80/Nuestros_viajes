import { FirebaseError } from 'firebase/app'
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore'

import {
  firebaseConfigurationError,
  firestore,
} from '../../../infrastructure/firebase/firebaseClient'
import {
  tripSections,
  type BaseTrip,
  type CreateTripData,
  type TripSection,
  type TripStatus,
  type TripTransport,
} from '../model/trip'

const tripTransports: TripTransport[] = [
  'car',
  'plane',
  'train',
  'bus',
  'boat',
  'other',
]

const tripStatuses: TripStatus[] = ['draft', 'planned']

class TripServiceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'TripServiceError'
  }
}

function requireFirestore() {
  if (!firestore) {
    throw new TripServiceError(
      firebaseConfigurationError ?? 'Cloud Firestore no está disponible.',
    )
  }

  return firestore
}

function requireString(data: DocumentData, field: string) {
  const value = data[field]

  if (typeof value !== 'string') {
    throw new TripServiceError(
      `El viaje guardado no contiene un valor válido para “${field}”.`,
    )
  }

  return value
}

function requireStringArray(data: DocumentData, field: string) {
  const value = data[field]

  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== 'string')
  ) {
    throw new TripServiceError(
      `El viaje guardado no contiene una lista válida para “${field}”.`,
    )
  }

  return value
}

function requireTimestamp(data: DocumentData, field: string) {
  const value = data[field]

  if (!(value instanceof Timestamp)) {
    throw new TripServiceError(
      `El viaje guardado no contiene una fecha válida para “${field}”.`,
    )
  }

  return value.toDate().toISOString()
}

function mapTripDocument(
  snapshot: DocumentSnapshot<DocumentData>,
): BaseTrip {
  if (!snapshot.exists()) {
    throw new TripServiceError('El viaje guardado ya no está disponible.')
  }

  const data = snapshot.data()
  const transport = requireString(data, 'transport')
  const status = requireString(data, 'status')
  const enabledSections = requireStringArray(data, 'enabledSections')

  if (!tripTransports.includes(transport as TripTransport)) {
    throw new TripServiceError(
      'El viaje guardado contiene un transporte desconocido.',
    )
  }

  if (!tripStatuses.includes(status as TripStatus)) {
    throw new TripServiceError(
      'El viaje guardado contiene un estado desconocido.',
    )
  }

  if (
    enabledSections.some(
      (section) => !tripSections.includes(section as TripSection),
    )
  ) {
    throw new TripServiceError(
      'El viaje guardado contiene una sección desconocida.',
    )
  }

  return {
    id: snapshot.id,
    name: requireString(data, 'name'),
    destination: requireString(data, 'destination'),
    country: requireString(data, 'country'),
    description: requireString(data, 'description'),
    startDate: requireString(data, 'startDate'),
    endDate: requireString(data, 'endDate'),
    participants: requireStringArray(data, 'participants'),
    transport: transport as TripTransport,
    currency: requireString(data, 'currency'),
    status: status as TripStatus,
    enabledSections: enabledSections as TripSection[],
    ownerId: requireString(data, 'ownerId'),
    createdBy: requireString(data, 'createdBy'),
    createdAt: requireTimestamp(data, 'createdAt'),
    updatedAt: requireTimestamp(data, 'updatedAt'),
  }
}

function sortTripsByRelevance(trips: BaseTrip[]) {
  const today = new Date().toISOString().slice(0, 10)

  return [...trips].sort((firstTrip, secondTrip) => {
    const firstIsUpcoming = firstTrip.endDate >= today
    const secondIsUpcoming = secondTrip.endDate >= today

    if (firstIsUpcoming !== secondIsUpcoming) {
      return firstIsUpcoming ? -1 : 1
    }

    if (firstIsUpcoming) {
      return firstTrip.startDate.localeCompare(secondTrip.startDate)
    }

    return secondTrip.startDate.localeCompare(firstTrip.startDate)
  })
}

function toTripServiceError(error: unknown, operation: 'create' | 'load') {
  if (error instanceof TripServiceError) {
    return error
  }

  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        return new TripServiceError(
          operation === 'create'
            ? 'Firestore no permite crear viajes con esta cuenta.'
            : 'Firestore no permite consultar los viajes con esta cuenta.',
          { cause: error },
        )
      case 'unavailable':
      case 'network-request-failed':
        return new TripServiceError(
          'No se ha podido conectar con Firestore. Comprueba tu conexión e inténtalo de nuevo.',
          { cause: error },
        )
    }
  }

  return new TripServiceError(
    operation === 'create'
      ? 'No se ha podido guardar el viaje. Inténtalo de nuevo.'
      : 'No se han podido cargar los viajes. Inténtalo de nuevo.',
    { cause: error },
  )
}

export async function createTrip(
  tripData: CreateTripData,
  userId: string,
) {
  if (!userId.trim()) {
    throw new TripServiceError(
      'Es necesario iniciar sesión para crear un viaje.',
    )
  }

  try {
    const database = requireFirestore()
    const tripReference = doc(collection(database, 'trips'))
    const tripDocument = {
      ...tripData,
      id: tripReference.id,
      ownerId: userId,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await setDoc(tripReference, tripDocument)

    const savedTrip = await getDoc(tripReference)
    return mapTripDocument(savedTrip)
  } catch (error) {
    throw toTripServiceError(error, 'create')
  }
}

export async function getTrips() {
  try {
    const tripsSnapshot = await getDocs(
      collection(requireFirestore(), 'trips'),
    )
    const trips = tripsSnapshot.docs.map(mapTripDocument)

    return sortTripsByRelevance(trips)
  } catch (error) {
    throw toTripServiceError(error, 'load')
  }
}
