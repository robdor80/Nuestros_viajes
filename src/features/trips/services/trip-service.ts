import { FirebaseError } from 'firebase/app'
import {
  Timestamp,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
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
  tripColorPalette,
  tripSections,
  type BaseTrip,
  type CreateTripData,
  type EditableTripStatus,
  type TripColor,
  type TripSection,
  type TripStatus,
  type TripTransport,
  type UpdateTripData,
} from '../model/trip'
import { getStableTripColor } from '../utils/trip-colors'

type TripsSubscriber = (trips: BaseTrip[]) => void
type TripsSubscriptionErrorHandler = (error: Error) => void

const tripTransports: TripTransport[] = [
  'car',
  'plane',
  'train',
  'bus',
  'boat',
  'other',
]

const tripStatuses: TripStatus[] = [
  'draft',
  'planned',
  'preparing',
  'completed',
  'archived',
]

const editableTripStatuses: EditableTripStatus[] = [
  'draft',
  'planned',
  'preparing',
  'completed',
]

type TripOperation =
  | 'create'
  | 'load'
  | 'update'
  | 'archive'
  | 'restore'
  | 'delete'

const tripContentSubcollections = [
  { id: 'places', label: 'lugares y actividades' },
  { id: 'planningDays', label: 'días de planning' },
  { id: 'accommodations', label: 'alojamientos' },
  { id: 'budget', label: 'presupuesto' },
  { id: 'transfers', label: 'trayectos' },
] as const

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

function getOptionalString(data: DocumentData, field: string) {
  const value = data[field]

  return typeof value === 'string' ? value : undefined
}

function getOptionalTimestamp(data: DocumentData, field: string) {
  const value = data[field]

  return value instanceof Timestamp
    ? value.toDate().toISOString()
    : undefined
}

function getTripColor(data: DocumentData, tripId: string) {
  const color = data.color

  if (
    typeof color === 'string' &&
    tripColorPalette.includes(color as TripColor)
  ) {
    return color as TripColor
  }

  return getStableTripColor(tripId)
}

function mapTripDocument(
  snapshot: DocumentSnapshot<DocumentData>,
): BaseTrip {
  if (!snapshot.exists()) {
    throw new TripServiceError('El viaje guardado ya no está disponible.')
  }

  const data = snapshot.data({ serverTimestamps: 'estimate' })
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
    color: getTripColor(data, snapshot.id),
    enabledSections: enabledSections as TripSection[],
    ownerId: requireString(data, 'ownerId'),
    createdBy: requireString(data, 'createdBy'),
    createdAt: requireTimestamp(data, 'createdAt'),
    updatedAt: requireTimestamp(data, 'updatedAt'),
    updatedBy: getOptionalString(data, 'updatedBy'),
    statusBeforeArchive: editableTripStatuses.includes(
      data.statusBeforeArchive as EditableTripStatus,
    )
      ? (data.statusBeforeArchive as EditableTripStatus)
      : undefined,
    archivedAt: getOptionalTimestamp(data, 'archivedAt'),
    archivedBy: getOptionalString(data, 'archivedBy'),
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

const operationErrorMessages: Record<TripOperation, string> = {
  create: 'No se ha podido guardar el viaje. Inténtalo de nuevo.',
  load: 'No se han podido cargar los viajes. Inténtalo de nuevo.',
  update: 'No se han podido guardar los cambios. Inténtalo de nuevo.',
  archive: 'No se ha podido archivar el viaje. Inténtalo de nuevo.',
  restore: 'No se ha podido restaurar el viaje. Inténtalo de nuevo.',
  delete: 'No se ha podido eliminar el viaje. Inténtalo de nuevo.',
}

const permissionErrorMessages: Record<TripOperation, string> = {
  create: 'Firestore no permite crear viajes con esta cuenta.',
  load: 'Firestore no permite consultar los viajes con esta cuenta.',
  update: 'Firestore no permite editar viajes con esta cuenta.',
  archive: 'Firestore no permite archivar viajes con esta cuenta.',
  restore: 'Firestore no permite restaurar viajes con esta cuenta.',
  delete: 'Firestore no permite eliminar viajes con esta cuenta.',
}

function toTripServiceError(error: unknown, operation: TripOperation) {
  if (error instanceof TripServiceError) {
    return error
  }

  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        return new TripServiceError(
          permissionErrorMessages[operation],
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
    operationErrorMessages[operation],
    { cause: error },
  )
}

function requireUserId(userId: string, operation: string) {
  if (!userId.trim()) {
    throw new TripServiceError(
      `Es necesario iniciar sesión para ${operation} un viaje.`,
    )
  }
}

async function readTrip(tripId: string) {
  const tripSnapshot = await getDoc(doc(requireFirestore(), 'trips', tripId))
  return mapTripDocument(tripSnapshot)
}

async function requireEmptyTripContent(tripId: string) {
  const database = requireFirestore()
  const contentChecks = await Promise.all(
    tripContentSubcollections.map(async (subcollection) => {
      const snapshot = await getDocs(
        query(
          collection(database, 'trips', tripId, subcollection.id),
          limit(1),
        ),
      )

      return snapshot.empty ? null : subcollection.label
    }),
  )
  const existingContent = contentChecks.filter(
    (label): label is NonNullable<typeof label> => label !== null,
  )

  if (existingContent.length > 0) {
    throw new TripServiceError(
      `No se puede eliminar este viaje porque contiene ${existingContent.join(', ')}. Elimina primero su contenido interior o utiliza, cuando esté disponible, la eliminación completa.`,
    )
  }
}

export async function createTrip(
  tripData: CreateTripData,
  userId: string,
) {
  requireUserId(userId, 'crear')

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

export async function updateTrip(
  tripId: string,
  changes: UpdateTripData,
  userId: string,
) {
  requireUserId(userId, 'editar')

  try {
    const tripReference = doc(requireFirestore(), 'trips', tripId)
    const currentTrip = await readTrip(tripId)
    const isArchived = currentTrip.status === 'archived'
    const editableChanges = {
      name: changes.name,
      destination: changes.destination,
      country: changes.country,
      description: changes.description,
      startDate: changes.startDate,
      endDate: changes.endDate,
      participants: changes.participants,
      transport: changes.transport,
      currency: changes.currency,
      status: isArchived ? 'archived' : changes.status,
      color: changes.color,
      enabledSections: changes.enabledSections,
      ...(isArchived && { statusBeforeArchive: changes.status }),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    }

    await updateDoc(tripReference, editableChanges)
  } catch (error) {
    throw toTripServiceError(error, 'update')
  }
}

export async function archiveTrip(trip: BaseTrip, userId: string) {
  requireUserId(userId, 'archivar')

  try {
    const statusBeforeArchive = editableTripStatuses.includes(
      trip.status as EditableTripStatus,
    )
      ? (trip.status as EditableTripStatus)
      : 'draft'

    await updateDoc(doc(requireFirestore(), 'trips', trip.id), {
      status: 'archived',
      statusBeforeArchive,
      archivedAt: serverTimestamp(),
      archivedBy: userId,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    })

    return await readTrip(trip.id)
  } catch (error) {
    throw toTripServiceError(error, 'archive')
  }
}

export async function restoreTrip(trip: BaseTrip, userId: string) {
  requireUserId(userId, 'restaurar')

  try {
    const restoredStatus =
      trip.statusBeforeArchive &&
      editableTripStatuses.includes(trip.statusBeforeArchive)
        ? trip.statusBeforeArchive
        : 'draft'

    await updateDoc(doc(requireFirestore(), 'trips', trip.id), {
      status: restoredStatus,
      statusBeforeArchive: deleteField(),
      archivedAt: deleteField(),
      archivedBy: deleteField(),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    })

    return await readTrip(trip.id)
  } catch (error) {
    throw toTripServiceError(error, 'restore')
  }
}

export async function deleteTrip(tripId: string, userId: string) {
  requireUserId(userId, 'eliminar')

  try {
    await requireEmptyTripContent(tripId)
    await deleteDoc(doc(requireFirestore(), 'trips', tripId))
  } catch (error) {
    throw toTripServiceError(error, 'delete')
  }
}

export function subscribeToTrips(
  onData: TripsSubscriber,
  onError: TripsSubscriptionErrorHandler,
) {
  try {
    return onSnapshot(
      collection(requireFirestore(), 'trips'),
      (tripsSnapshot) => {
        try {
          const trips = tripsSnapshot.docs.map(mapTripDocument)
          onData(sortTripsByRelevance(trips))
        } catch (error) {
          onError(toTripServiceError(error, 'load'))
        }
      },
      (error) => {
        onError(toTripServiceError(error, 'load'))
      },
    )
  } catch (error) {
    onError(toTripServiceError(error, 'load'))
    return () => undefined
  }
}
