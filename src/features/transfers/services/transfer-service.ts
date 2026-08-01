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
  emptyTransfersByDirection,
  transferDirections,
  type SaveTransferData,
  type Transfer,
  type TransferDirection,
  type TransferFormData,
  type TransfersByDirection,
  type TransferStop,
} from '../model/transfer'
import { normalizeTransferFormData } from '../utils/transfer-validation'

type TransfersSubscriber = (transfers: TransfersByDirection) => void
type TransfersSubscriptionErrorHandler = (error: Error) => void
type TransferOperation = 'save' | 'load' | 'delete'

class TransferServiceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'TransferServiceError'
  }
}

function requireFirestore() {
  if (!firestore) {
    throw new TransferServiceError(
      firebaseConfigurationError ?? 'Cloud Firestore no está disponible.',
    )
  }

  return firestore
}

function requireIdentifier(value: string, label: string) {
  if (!value.trim()) {
    throw new TransferServiceError(`No se ha podido identificar ${label}.`)
  }
}

function requireString(data: DocumentData, field: string) {
  const value = data[field]
  if (typeof value !== 'string') {
    throw new TransferServiceError(
      `El trayecto guardado no contiene un valor válido para «${field}».`,
    )
  }

  return value
}

function requireNullableBoolean(data: DocumentData, field: string) {
  const value = data[field]
  if (typeof value === 'boolean' || value === null) {
    return value
  }

  throw new TransferServiceError(
    `El trayecto guardado no contiene un valor válido para «${field}».`,
  )
}

function requireTimestamp(data: DocumentData, field: string) {
  const value = data[field]
  if (!(value instanceof Timestamp)) {
    throw new TransferServiceError(
      `El trayecto guardado no contiene una fecha válida para «${field}».`,
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

function requireDirection(value: string): TransferDirection {
  if (transferDirections.includes(value as TransferDirection)) {
    return value as TransferDirection
  }

  throw new TransferServiceError(
    'El trayecto guardado contiene una dirección desconocida.',
  )
}

function mapStop(value: unknown, index: number): TransferStop {
  if (!value || typeof value !== 'object') {
    throw new TransferServiceError(
      'El trayecto guardado contiene una parada no válida.',
    )
  }

  const stop = value as Record<string, unknown>
  if (
    typeof stop.id !== 'string' ||
    typeof stop.description !== 'string' ||
    typeof stop.location !== 'string' ||
    typeof stop.notes !== 'string'
  ) {
    throw new TransferServiceError(
      'El trayecto guardado contiene una parada incompleta.',
    )
  }

  return {
    id: stop.id,
    description: stop.description,
    location: stop.location,
    notes: stop.notes,
    order: typeof stop.order === 'number' ? stop.order : index,
  }
}

function requireStops(data: DocumentData) {
  const value = data.plannedStops
  if (!Array.isArray(value)) {
    throw new TransferServiceError(
      'El trayecto guardado no contiene una lista de paradas válida.',
    )
  }

  return value
    .map(mapStop)
    .sort((first, second) => first.order - second.order)
}

function mapTransferDocument(
  snapshot: DocumentSnapshot<DocumentData>,
): Transfer {
  if (!snapshot.exists()) {
    throw new TransferServiceError('El trayecto ya no está disponible.')
  }

  const data = snapshot.data({ serverTimestamps: 'estimate' })
  const contentStatus = requireString(data, 'contentStatus')
  if (!tripContentStatuses.includes(contentStatus as TripContentStatus)) {
    throw new TransferServiceError(
      'El trayecto guardado contiene un estado desconocido.',
    )
  }

  return {
    id: requireDirection(snapshot.id),
    direction: requireDirection(requireString(data, 'direction')),
    date: requireString(data, 'date'),
    origin: requireString(data, 'origin'),
    destination: requireString(data, 'destination'),
    viaMotorway: requireNullableBoolean(data, 'viaMotorway'),
    hasTolls: requireNullableBoolean(data, 'hasTolls'),
    estimatedTollCost: requireString(data, 'estimatedTollCost'),
    estimatedDuration: requireString(data, 'estimatedDuration'),
    distanceKm: requireString(data, 'distanceKm'),
    plannedStops: requireStops(data),
    notes: requireString(data, 'notes'),
    mapsUrl: requireString(data, 'mapsUrl'),
    mapsEmbedUrl: requireString(data, 'mapsEmbedUrl'),
    contentStatus: contentStatus as TripContentStatus,
    createdAt: requireTimestamp(data, 'createdAt'),
    createdBy: requireString(data, 'createdBy'),
    updatedAt: requireTimestamp(data, 'updatedAt'),
    updatedBy: requireString(data, 'updatedBy'),
    completedAt: getOptionalTimestamp(data, 'completedAt'),
    completedBy: getOptionalString(data, 'completedBy'),
  }
}

const operationErrorMessages: Record<TransferOperation, string> = {
  save: 'No se ha podido guardar el trayecto. Inténtalo de nuevo.',
  load: 'No se han podido cargar los trayectos. Inténtalo de nuevo.',
  delete: 'No se ha podido eliminar el trayecto. Inténtalo de nuevo.',
}

const permissionErrorMessages: Record<TransferOperation, string> = {
  save: 'Firestore no permite guardar trayectos con esta cuenta.',
  load: 'Firestore no permite consultar los trayectos con esta cuenta.',
  delete: 'Firestore no permite eliminar trayectos con esta cuenta.',
}

function toTransferServiceError(
  error: unknown,
  operation: TransferOperation,
) {
  if (error instanceof TransferServiceError) return error

  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') {
      return new TransferServiceError(permissionErrorMessages[operation], {
        cause: error,
      })
    }
    if (error.code === 'unavailable' || error.code === 'network-request-failed') {
      return new TransferServiceError(
        'No se ha podido conectar con Firestore. Comprueba tu conexión e inténtalo de nuevo.',
        { cause: error },
      )
    }
  }

  return new TransferServiceError(operationErrorMessages[operation], {
    cause: error,
  })
}

function buildTransferDocument(data: TransferFormData) {
  return normalizeTransferFormData(data)
}

export async function createOrUpdateTransfer(
  tripId: string,
  direction: TransferDirection,
  currentTransfer: Transfer | null,
  data: SaveTransferData,
  userId: string,
) {
  requireIdentifier(tripId, 'el viaje')
  requireIdentifier(userId, 'la persona usuaria')

  try {
    const transferReference = doc(
      requireFirestore(),
      'trips',
      tripId,
      'transfers',
      direction,
    )
    const isBecomingCompleted =
      data.contentStatus === 'completed' &&
      currentTransfer?.contentStatus !== 'completed'
    const isLeavingCompleted =
      data.contentStatus !== 'completed' &&
      currentTransfer?.contentStatus === 'completed'

    await setDoc(
      transferReference,
      {
        ...buildTransferDocument(data),
        id: direction,
        direction,
        contentStatus: data.contentStatus,
        updatedAt: serverTimestamp(),
        updatedBy: userId,
        ...(!currentTransfer && {
          createdAt: serverTimestamp(),
          createdBy: userId,
        }),
        ...(isBecomingCompleted && {
          completedAt: serverTimestamp(),
          completedBy: userId,
        }),
        ...(isLeavingCompleted && {
          completedAt: deleteField(),
          completedBy: deleteField(),
        }),
      },
      { merge: true },
    )
  } catch (error) {
    throw toTransferServiceError(error, 'save')
  }
}

export async function deleteTransfer(
  tripId: string,
  direction: TransferDirection,
  userId: string,
) {
  requireIdentifier(tripId, 'el viaje')
  requireIdentifier(userId, 'la persona usuaria')

  try {
    await deleteDoc(
      doc(requireFirestore(), 'trips', tripId, 'transfers', direction),
    )
  } catch (error) {
    throw toTransferServiceError(error, 'delete')
  }
}

export function subscribeToTransfers(
  tripId: string,
  onData: TransfersSubscriber,
  onError: TransfersSubscriptionErrorHandler,
) {
  try {
    requireIdentifier(tripId, 'el viaje')

    return onSnapshot(
      collection(requireFirestore(), 'trips', tripId, 'transfers'),
      (transfersSnapshot) => {
        try {
          const transfers = { ...emptyTransfersByDirection }
          transfersSnapshot.docs.forEach((transferSnapshot) => {
            const transfer = mapTransferDocument(transferSnapshot)
            transfers[transfer.direction] = transfer
          })
          onData(transfers)
        } catch (error) {
          onError(toTransferServiceError(error, 'load'))
        }
      },
      (error) => {
        onError(toTransferServiceError(error, 'load'))
      },
    )
  } catch (error) {
    onError(toTransferServiceError(error, 'load'))
    return () => undefined
  }
}
