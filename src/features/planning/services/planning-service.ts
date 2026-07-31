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
  placeCategories,
  placePriorities,
  type PlaceCategory,
  type PlacePriority,
} from '../../places/model/place'
import {
  tripContentStatuses,
  type TripContentStatus,
} from '../../trip-workspace/model/trip-content'
import {
  planningActivityTypes,
  planningMoments,
  type PlanningActivity,
  type PlanningActivityType,
  type PlanningDay,
  type PlanningMoment,
  type PlanningPlaceSnapshot,
  type SavePlanningDayData,
} from '../model/planning'
import { normalizePlanningDayFormData } from '../utils/planning-validation'

type PlanningDaysSubscriber = (days: PlanningDay[]) => void
type PlanningDaysErrorHandler = (error: Error) => void
type PlanningOperation = 'create' | 'load' | 'update' | 'delete'

class PlanningServiceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'PlanningServiceError'
  }
}

function requireFirestore() {
  if (!firestore) {
    throw new PlanningServiceError(
      firebaseConfigurationError ?? 'Cloud Firestore no está disponible.',
    )
  }
  return firestore
}

function requireIdentifier(value: string, label: string) {
  if (!value.trim()) {
    throw new PlanningServiceError(`No se ha podido identificar ${label}.`)
  }
}

function requireString(data: DocumentData, field: string) {
  const value = data[field]
  if (typeof value !== 'string') {
    throw new PlanningServiceError(
      `El planning guardado no contiene un valor válido para «${field}».`,
    )
  }
  return value
}

function requireTimestamp(data: DocumentData, field: string) {
  const value = data[field]
  if (!(value instanceof Timestamp)) {
    throw new PlanningServiceError(
      `El planning guardado no contiene una fecha válida para «${field}».`,
    )
  }
  return value.toDate().toISOString()
}

function optionalTimestamp(data: DocumentData, field: string) {
  const value = data[field]
  return value instanceof Timestamp ? value.toDate().toISOString() : undefined
}

function optionalString(data: DocumentData, field: string) {
  const value = data[field]
  return typeof value === 'string' ? value : undefined
}

function enumOrEmpty<T extends string>(
  value: unknown,
  values: readonly T[],
  field: string,
) {
  if (value === '' || (typeof value === 'string' && values.includes(value as T))) {
    return value as T | ''
  }
  throw new PlanningServiceError(
    `El planning guardado contiene un valor desconocido para «${field}».`,
  )
}

function mapPlaceSnapshot(value: unknown): PlanningPlaceSnapshot | null {
  if (value === null) return null
  if (!value || typeof value !== 'object') {
    throw new PlanningServiceError('Una actividad contiene un lugar vinculado no válido.')
  }

  const data = value as DocumentData
  const contentStatus = requireString(data, 'contentStatus')
  if (!tripContentStatuses.includes(contentStatus as TripContentStatus)) {
    throw new PlanningServiceError('El snapshot del lugar contiene un estado desconocido.')
  }

  return {
    name: requireString(data, 'name'),
    category: enumOrEmpty<PlaceCategory>(data.category, placeCategories, 'category'),
    priority: enumOrEmpty<PlacePriority>(data.priority, placePriorities, 'priority'),
    contentStatus: contentStatus as TripContentStatus,
  }
}

function mapActivity(value: unknown, index: number): PlanningActivity {
  if (!value || typeof value !== 'object') {
    throw new PlanningServiceError('El planning contiene una actividad no válida.')
  }

  const data = value as DocumentData
  const order = data.order
  if (!Number.isInteger(order) || order < 0) {
    throw new PlanningServiceError('El planning contiene un orden de actividad no válido.')
  }

  return {
    id: requireString(data, 'id'),
    type: enumOrEmpty<PlanningActivityType>(data.type, planningActivityTypes, 'type'),
    title: requireString(data, 'title'),
    relatedPlaceId: requireString(data, 'relatedPlaceId'),
    placeSnapshot: mapPlaceSnapshot(data.placeSnapshot),
    momentOfDay: enumOrEmpty<PlanningMoment>(data.momentOfDay, planningMoments, 'momentOfDay'),
    startTime: requireString(data, 'startTime'),
    endTime: requireString(data, 'endTime'),
    estimatedDuration: requireString(data, 'estimatedDuration'),
    imageUrl: requireString(data, 'imageUrl'),
    address: requireString(data, 'address'),
    mapsUrl: requireString(data, 'mapsUrl'),
    description: requireString(data, 'description'),
    notes: requireString(data, 'notes'),
    order: typeof order === 'number' ? order : index,
  }
}

function mapPlanningDay(snapshot: DocumentSnapshot<DocumentData>): PlanningDay {
  if (!snapshot.exists()) {
    throw new PlanningServiceError('El planning del día ya no está disponible.')
  }

  const data = snapshot.data({ serverTimestamps: 'estimate' })
  const contentStatus = requireString(data, 'contentStatus')
  if (!tripContentStatuses.includes(contentStatus as TripContentStatus)) {
    throw new PlanningServiceError('El planning contiene un estado desconocido.')
  }
  if (!Array.isArray(data.activities)) {
    throw new PlanningServiceError('El planning no contiene una lista válida de actividades.')
  }

  return {
    id: snapshot.id,
    date: requireString(data, 'date'),
    title: requireString(data, 'title'),
    description: requireString(data, 'description'),
    notes: requireString(data, 'notes'),
    contentStatus: contentStatus as TripContentStatus,
    activities: data.activities
      .map(mapActivity)
      .sort((first, second) => first.order - second.order)
      .map((activity, order) => ({ ...activity, order })),
    createdAt: requireTimestamp(data, 'createdAt'),
    createdBy: requireString(data, 'createdBy'),
    updatedAt: requireTimestamp(data, 'updatedAt'),
    updatedBy: requireString(data, 'updatedBy'),
    completedAt: optionalTimestamp(data, 'completedAt'),
    completedBy: optionalString(data, 'completedBy'),
  }
}

const operationMessages: Record<PlanningOperation, string> = {
  create: 'No se ha podido guardar el planning. Inténtalo de nuevo.',
  load: 'No se han podido cargar los días del planning. Inténtalo de nuevo.',
  update: 'No se han podido guardar los cambios. Inténtalo de nuevo.',
  delete: 'No se ha podido eliminar el planning del día. Inténtalo de nuevo.',
}

function toPlanningServiceError(error: unknown, operation: PlanningOperation) {
  if (error instanceof PlanningServiceError) return error

  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') {
      return new PlanningServiceError(
        'Firestore no permite modificar o consultar el planning con esta cuenta.',
        { cause: error },
      )
    }
    if (error.code === 'unavailable' || error.code === 'network-request-failed') {
      return new PlanningServiceError(
        'No se ha podido conectar con Firestore. Comprueba tu conexión e inténtalo de nuevo.',
        { cause: error },
      )
    }
  }

  return new PlanningServiceError(operationMessages[operation], { cause: error })
}

function buildDayDocument(data: SavePlanningDayData) {
  const normalized = normalizePlanningDayFormData(data)
  return {
    title: normalized.title,
    description: normalized.description,
    notes: normalized.notes,
    activities: normalized.activities,
    contentStatus: data.contentStatus,
  }
}

export async function createPlanningDay(
  tripId: string,
  date: string,
  data: SavePlanningDayData,
  userId: string,
) {
  requireIdentifier(tripId, 'el viaje')
  requireIdentifier(date, 'la fecha')
  requireIdentifier(userId, 'la persona usuaria')

  try {
    await setDoc(doc(requireFirestore(), 'trips', tripId, 'planningDays', date), {
      ...buildDayDocument(data),
      id: date,
      date,
      createdAt: serverTimestamp(),
      createdBy: userId,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
      ...(data.contentStatus === 'completed' && {
        completedAt: serverTimestamp(),
        completedBy: userId,
      }),
    })
  } catch (error) {
    throw toPlanningServiceError(error, 'create')
  }
}

export async function updatePlanningDay(
  tripId: string,
  day: PlanningDay,
  data: SavePlanningDayData,
  userId: string,
) {
  requireIdentifier(tripId, 'el viaje')
  requireIdentifier(day.id, 'el día')
  requireIdentifier(userId, 'la persona usuaria')

  try {
    const becomesCompleted = data.contentStatus === 'completed' && day.contentStatus !== 'completed'
    const leavesCompleted = data.contentStatus !== 'completed' && day.contentStatus === 'completed'
    await updateDoc(doc(requireFirestore(), 'trips', tripId, 'planningDays', day.id), {
      ...buildDayDocument(data),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
      ...(becomesCompleted && {
        completedAt: serverTimestamp(),
        completedBy: userId,
      }),
      ...(leavesCompleted && {
        completedAt: deleteField(),
        completedBy: deleteField(),
      }),
    })
  } catch (error) {
    throw toPlanningServiceError(error, 'update')
  }
}

export async function deletePlanningDay(tripId: string, date: string, userId: string) {
  requireIdentifier(tripId, 'el viaje')
  requireIdentifier(date, 'la fecha')
  requireIdentifier(userId, 'la persona usuaria')

  try {
    await deleteDoc(doc(requireFirestore(), 'trips', tripId, 'planningDays', date))
  } catch (error) {
    throw toPlanningServiceError(error, 'delete')
  }
}

export function subscribeToPlanningDays(
  tripId: string,
  onData: PlanningDaysSubscriber,
  onError: PlanningDaysErrorHandler,
) {
  try {
    requireIdentifier(tripId, 'el viaje')
    return onSnapshot(
      collection(requireFirestore(), 'trips', tripId, 'planningDays'),
      (snapshot) => {
        try {
          onData(snapshot.docs.map(mapPlanningDay).sort((a, b) => a.date.localeCompare(b.date)))
        } catch (error) {
          onError(toPlanningServiceError(error, 'load'))
        }
      },
      (error) => onError(toPlanningServiceError(error, 'load')),
    )
  } catch (error) {
    onError(toPlanningServiceError(error, 'load'))
    return () => undefined
  }
}
