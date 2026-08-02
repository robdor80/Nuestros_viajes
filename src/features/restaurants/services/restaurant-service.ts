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
  type FieldValue,
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
  mealTypes,
  priceLevels,
  reservationStatuses,
  restaurantStatuses,
  venueTypes,
  type MealType,
  type Restaurant,
  type RestaurantFormData,
  type RestaurantListItem,
  type RestaurantStatus,
  type SaveRestaurantData,
} from '../model/restaurant'
import { sortRestaurants } from '../utils/restaurant-presentation'
import { normalizeRestaurantFormData } from '../utils/restaurant-validation'

type RestaurantsSubscriber = (restaurants: Restaurant[]) => void
type RestaurantsSubscriptionErrorHandler = (error: Error) => void
type RestaurantOperation = 'create' | 'load' | 'update' | 'delete'

class RestaurantServiceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'RestaurantServiceError'
  }
}

function requireFirestore() {
  if (!firestore) {
    throw new RestaurantServiceError(
      firebaseConfigurationError ?? 'Cloud Firestore no está disponible.',
    )
  }

  return firestore
}

function requireIdentifier(value: string, label: string) {
  if (!value.trim()) {
    throw new RestaurantServiceError(`No se ha podido identificar ${label}.`)
  }
}

function requireString(data: DocumentData, field: string) {
  const value = data[field]

  if (typeof value !== 'string') {
    throw new RestaurantServiceError(
      `El restaurante guardado no contiene un valor válido para «${field}».`,
    )
  }

  return value
}

function optionalString(data: DocumentData, field: string) {
  const value = data[field]
  return typeof value === 'string' ? value : ''
}

function optionalBoolean(data: DocumentData, field: string) {
  const value = data[field]
  return typeof value === 'boolean' ? value : null
}

function optionalStringArray(data: DocumentData, field: string) {
  const value = data[field]
  return Array.isArray(value) &&
    value.every((item) => typeof item === 'string')
    ? value
    : []
}

function optionalList(data: DocumentData, field: string): RestaurantListItem[] {
  const value = data[field]
  if (!Array.isArray(value)) return []

  return value
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const name = typeof record.name === 'string' ? record.name : ''
      if (!name.trim()) return null

      return {
        id: typeof record.id === 'string' ? record.id : `${field}-${index}`,
        name,
        notes: typeof record.notes === 'string' ? record.notes : '',
        order: typeof record.order === 'number' ? record.order : index,
      }
    })
    .filter((item): item is RestaurantListItem => item !== null)
    .sort((first, second) => first.order - second.order)
}

function requireTimestamp(data: DocumentData, field: string) {
  const value = data[field]

  if (!(value instanceof Timestamp)) {
    throw new RestaurantServiceError(
      `El restaurante guardado no contiene una fecha válida para «${field}».`,
    )
  }

  return value.toDate().toISOString()
}

function optionalTimestamp(data: DocumentData, field: string) {
  const value = data[field]
  return value instanceof Timestamp ? value.toDate().toISOString() : undefined
}

function enumOrEmpty<T extends string>(
  value: string,
  values: readonly T[],
) {
  return values.includes(value as T) ? (value as T) : ''
}

function mapRestaurantDocument(
  snapshot: DocumentSnapshot<DocumentData>,
): Restaurant {
  if (!snapshot.exists()) {
    throw new RestaurantServiceError('El restaurante ya no está disponible.')
  }

  const data = snapshot.data({ serverTimestamps: 'estimate' })
  const contentStatus = requireString(data, 'contentStatus')

  if (!tripContentStatuses.includes(contentStatus as TripContentStatus)) {
    throw new RestaurantServiceError(
      'El restaurante guardado contiene un estado de contenido desconocido.',
    )
  }

  const restaurantStatus = enumOrEmpty(
    optionalString(data, 'restaurantStatus'),
    restaurantStatuses,
  )

  return {
    id: snapshot.id,
    name: optionalString(data, 'name'),
    venueType: enumOrEmpty(optionalString(data, 'venueType'), venueTypes),
    mealTypes: optionalStringArray(data, 'mealTypes').filter(
      (mealType): mealType is MealType =>
        mealTypes.includes(mealType as MealType),
    ),
    cuisineTypes: optionalStringArray(data, 'cuisineTypes'),
    locality: optionalString(data, 'locality'),
    area: optionalString(data, 'area'),
    address: optionalString(data, 'address'),
    mapsUrl: optionalString(data, 'mapsUrl'),
    imageUrl: optionalString(data, 'imageUrl'),
    restaurantStatus: (restaurantStatus || 'option') as RestaurantStatus,
    tripDay: optionalString(data, 'tripDay'),
    plannedDate: optionalString(data, 'plannedDate'),
    plannedTime: optionalString(data, 'plannedTime'),
    peopleCount: optionalString(data, 'peopleCount'),
    requiresReservation: optionalBoolean(data, 'requiresReservation'),
    reservationStatus: enumOrEmpty(
      optionalString(data, 'reservationStatus'),
      reservationStatuses,
    ),
    reservationDate: optionalString(data, 'reservationDate'),
    reservationTime: optionalString(data, 'reservationTime'),
    reservationPeople: optionalString(data, 'reservationPeople'),
    reservationName: optionalString(data, 'reservationName'),
    reservationPhone: optionalString(data, 'reservationPhone'),
    reservationReference: optionalString(data, 'reservationReference'),
    reservationConfirmationUrl: optionalString(
      data,
      'reservationConfirmationUrl',
    ),
    reservationNotes: optionalString(data, 'reservationNotes'),
    priceLevel: enumOrEmpty(optionalString(data, 'priceLevel'), priceLevels),
    estimatedPricePerPerson: optionalString(data, 'estimatedPricePerPerson'),
    estimatedTotalPrice: optionalString(data, 'estimatedTotalPrice'),
    phone: optionalString(data, 'phone'),
    websiteUrl: optionalString(data, 'websiteUrl'),
    menuUrl: optionalString(data, 'menuUrl'),
    openingHours: optionalString(data, 'openingHours'),
    closingDay: optionalString(data, 'closingDay'),
    hasTerrace: optionalBoolean(data, 'hasTerrace'),
    hasNearbyParking: optionalBoolean(data, 'hasNearbyParking'),
    isAccessible: optionalBoolean(data, 'isAccessible'),
    acceptsCard: optionalBoolean(data, 'acceptsCard'),
    recommendedDishes: optionalList(data, 'recommendedDishes'),
    notes: optionalString(data, 'notes'),
    visited: optionalBoolean(data, 'visited') === true,
    visitedDate: optionalString(data, 'visitedDate'),
    fatyRating: optionalString(data, 'fatyRating'),
    robertoRating: optionalString(data, 'robertoRating'),
    jointRating: optionalString(data, 'jointRating'),
    orderedItems: optionalList(data, 'orderedItems'),
    visitComments: optionalString(data, 'visitComments'),
    wouldReturn: optionalBoolean(data, 'wouldReturn'),
    contentStatus: contentStatus as TripContentStatus,
    createdAt: requireTimestamp(data, 'createdAt'),
    createdBy: requireString(data, 'createdBy'),
    updatedAt: requireTimestamp(data, 'updatedAt'),
    updatedBy: requireString(data, 'updatedBy'),
    completedAt: optionalTimestamp(data, 'completedAt'),
    completedBy: optionalString(data, 'completedBy') || undefined,
  }
}

const operationErrorMessages: Record<RestaurantOperation, string> = {
  create: 'No se ha podido guardar el restaurante. Inténtalo de nuevo.',
  load: 'No se han podido cargar los restaurantes. Inténtalo de nuevo.',
  update: 'No se han podido guardar los cambios. Inténtalo de nuevo.',
  delete: 'No se ha podido eliminar el restaurante. Inténtalo de nuevo.',
}

const permissionErrorMessages: Record<RestaurantOperation, string> = {
  create: 'Firestore no permite crear restaurantes con esta cuenta.',
  load: 'Firestore no permite consultar restaurantes con esta cuenta.',
  update: 'Firestore no permite editar restaurantes con esta cuenta.',
  delete: 'Firestore no permite eliminar restaurantes con esta cuenta.',
}

function toRestaurantServiceError(
  error: unknown,
  operation: RestaurantOperation,
) {
  if (error instanceof RestaurantServiceError) {
    return error
  }

  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        return new RestaurantServiceError(permissionErrorMessages[operation], {
          cause: error,
        })
      case 'unavailable':
      case 'network-request-failed':
        return new RestaurantServiceError(
          'No se ha podido conectar con Firestore. Comprueba tu conexión e inténtalo de nuevo.',
          { cause: error },
        )
    }
  }

  return new RestaurantServiceError(operationErrorMessages[operation], {
    cause: error,
  })
}

function setString(
  documentData: Record<string, unknown | FieldValue>,
  field: keyof RestaurantFormData,
  value: string,
  mode: 'create' | 'update',
) {
  if (value.trim()) {
    documentData[field] = value.trim()
  } else if (mode === 'update') {
    documentData[field] = deleteField()
  }
}

function setArray<T>(
  documentData: Record<string, unknown | FieldValue>,
  field: keyof RestaurantFormData,
  value: T[],
  mode: 'create' | 'update',
) {
  if (value.length > 0) {
    documentData[field] = value
  } else if (mode === 'update') {
    documentData[field] = deleteField()
  }
}

function setBoolean(
  documentData: Record<string, unknown | FieldValue>,
  field: keyof RestaurantFormData,
  value: boolean | null,
  mode: 'create' | 'update',
) {
  if (value !== null) {
    documentData[field] = value
  } else if (mode === 'update') {
    documentData[field] = deleteField()
  }
}

function buildRestaurantDocument(
  data: SaveRestaurantData,
  mode: 'create' | 'update',
) {
  const values = normalizeRestaurantFormData(data)
  const documentData: Record<string, unknown | FieldValue> = {
    contentStatus: data.contentStatus,
    restaurantStatus: values.restaurantStatus,
  }
  const stringFields: Array<keyof RestaurantFormData> = [
    'name',
    'venueType',
    'locality',
    'area',
    'address',
    'mapsUrl',
    'imageUrl',
    'tripDay',
    'plannedDate',
    'plannedTime',
    'peopleCount',
    'reservationStatus',
    'reservationDate',
    'reservationTime',
    'reservationPeople',
    'reservationName',
    'reservationPhone',
    'reservationReference',
    'reservationConfirmationUrl',
    'reservationNotes',
    'priceLevel',
    'estimatedPricePerPerson',
    'estimatedTotalPrice',
    'phone',
    'websiteUrl',
    'menuUrl',
    'openingHours',
    'closingDay',
    'notes',
    'visitedDate',
    'fatyRating',
    'robertoRating',
    'jointRating',
    'visitComments',
  ]

  stringFields.forEach((field) => {
    const value = values[field]
    if (typeof value === 'string') {
      setString(documentData, field, value, mode)
    }
  })

  setArray(documentData, 'mealTypes', values.mealTypes, mode)
  setArray(documentData, 'cuisineTypes', values.cuisineTypes, mode)
  setArray(
    documentData,
    'recommendedDishes',
    values.recommendedDishes,
    mode,
  )
  setArray(documentData, 'orderedItems', values.orderedItems, mode)
  setBoolean(
    documentData,
    'requiresReservation',
    values.requiresReservation,
    mode,
  )
  setBoolean(documentData, 'hasTerrace', values.hasTerrace, mode)
  setBoolean(
    documentData,
    'hasNearbyParking',
    values.hasNearbyParking,
    mode,
  )
  setBoolean(documentData, 'isAccessible', values.isAccessible, mode)
  setBoolean(documentData, 'acceptsCard', values.acceptsCard, mode)
  setBoolean(documentData, 'wouldReturn', values.wouldReturn, mode)

  if (values.visited) {
    documentData.visited = true
  } else if (mode === 'update') {
    documentData.visited = deleteField()
  }

  if (values.requiresReservation !== true) {
    ;[
      'reservationStatus',
      'reservationDate',
      'reservationTime',
      'reservationPeople',
      'reservationName',
      'reservationPhone',
      'reservationReference',
      'reservationConfirmationUrl',
      'reservationNotes',
    ].forEach((field) => {
      if (mode === 'update') {
        documentData[field] = deleteField()
      } else {
        delete documentData[field]
      }
    })
  }

  return documentData
}

export async function createRestaurant(
  tripId: string,
  data: SaveRestaurantData,
  userId: string,
) {
  requireIdentifier(tripId, 'el viaje')
  requireIdentifier(userId, 'la persona usuaria')

  try {
    const database = requireFirestore()
    const restaurantReference = doc(
      collection(database, 'trips', tripId, 'restaurants'),
    )
    const restaurantDocument = {
      ...buildRestaurantDocument(data, 'create'),
      id: restaurantReference.id,
      createdAt: serverTimestamp(),
      createdBy: userId,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
      ...(data.contentStatus === 'completed' && {
        completedAt: serverTimestamp(),
        completedBy: userId,
      }),
    }

    await setDoc(restaurantReference, restaurantDocument)
  } catch (error) {
    throw toRestaurantServiceError(error, 'create')
  }
}

export async function updateRestaurant(
  tripId: string,
  restaurant: Restaurant,
  data: SaveRestaurantData,
  userId: string,
) {
  requireIdentifier(tripId, 'el viaje')
  requireIdentifier(restaurant.id, 'el restaurante')
  requireIdentifier(userId, 'la persona usuaria')

  try {
    const isBecomingCompleted =
      data.contentStatus === 'completed' &&
      restaurant.contentStatus !== 'completed'
    const isLeavingCompleted =
      data.contentStatus !== 'completed' &&
      restaurant.contentStatus === 'completed'

    await updateDoc(
      doc(
        requireFirestore(),
        'trips',
        tripId,
        'restaurants',
        restaurant.id,
      ),
      {
        ...buildRestaurantDocument(data, 'update'),
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
    throw toRestaurantServiceError(error, 'update')
  }
}

export async function deleteRestaurant(
  tripId: string,
  restaurantId: string,
  userId: string,
) {
  requireIdentifier(tripId, 'el viaje')
  requireIdentifier(restaurantId, 'el restaurante')
  requireIdentifier(userId, 'la persona usuaria')

  try {
    await deleteDoc(
      doc(requireFirestore(), 'trips', tripId, 'restaurants', restaurantId),
    )
  } catch (error) {
    throw toRestaurantServiceError(error, 'delete')
  }
}

export function subscribeToRestaurants(
  tripId: string,
  onData: RestaurantsSubscriber,
  onError: RestaurantsSubscriptionErrorHandler,
) {
  try {
    requireIdentifier(tripId, 'el viaje')

    return onSnapshot(
      collection(requireFirestore(), 'trips', tripId, 'restaurants'),
      (restaurantsSnapshot) => {
        try {
          const restaurants = restaurantsSnapshot.docs.map(
            mapRestaurantDocument,
          )
          onData(sortRestaurants(restaurants))
        } catch (error) {
          onError(toRestaurantServiceError(error, 'load'))
        }
      },
      (error) => {
        onError(toRestaurantServiceError(error, 'load'))
      },
    )
  } catch (error) {
    onError(toRestaurantServiceError(error, 'load'))
    return () => undefined
  }
}
