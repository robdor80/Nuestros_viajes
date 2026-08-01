import { FirebaseError } from 'firebase/app'
import { Timestamp, doc, getDoc, onSnapshot, serverTimestamp, setDoc, type DocumentData, type DocumentSnapshot } from 'firebase/firestore'

import { firebaseConfigurationError, firestore } from '../../../infrastructure/firebase/firebaseClient'
import { tripContentStatuses, type TripContentStatus } from '../../trip-workspace/model/trip-content'
import { contingencyPercentages, type Budget, type BudgetFormData, type ContingencyPercentage, type SaveBudgetData } from '../model/budget'
import { normalizeBudgetFormData } from '../utils/budget-validation'

type BudgetSubscriber = (budget: Budget | null) => void
type BudgetSubscriptionErrorHandler = (error: Error) => void
type BudgetOperation = 'save' | 'load'

class BudgetServiceError extends Error { constructor(message: string, options?: ErrorOptions) { super(message, options); this.name = 'BudgetServiceError' } }

function requireFirestore() { if (!firestore) throw new BudgetServiceError(firebaseConfigurationError ?? 'Cloud Firestore no está disponible.'); return firestore }
function requireIdentifier(value: string, label: string) { if (!value.trim()) throw new BudgetServiceError(`No se ha podido identificar ${label}.`) }
function requireString(data: DocumentData, field: string) { const value = data[field]; if (typeof value !== 'string') throw new BudgetServiceError(`El presupuesto guardado no contiene un valor válido para «${field}».`); return value }
function requireBoolean(data: DocumentData, field: string) { const value = data[field]; if (typeof value !== 'boolean') throw new BudgetServiceError(`El presupuesto guardado no contiene un interruptor válido para «${field}».`); return value }
function requireTimestamp(data: DocumentData, field: string) { const value = data[field]; if (!(value instanceof Timestamp)) throw new BudgetServiceError(`El presupuesto guardado no contiene una fecha válida para «${field}».`); return value.toDate().toISOString() }
function getOptionalTimestamp(data: DocumentData, field: string) { const value = data[field]; return value instanceof Timestamp ? value.toDate().toISOString() : undefined }
function getOptionalString(data: DocumentData, field: string) { const value = data[field]; return typeof value === 'string' ? value : undefined }
function requireContingencyPercentage(data: DocumentData) { const value = data.contingencyPercentage; if (typeof value === 'number' && contingencyPercentages.includes(value as ContingencyPercentage)) return value as ContingencyPercentage; throw new BudgetServiceError('El presupuesto guardado contiene un porcentaje de imprevistos desconocido.') }

function mapBudgetDocument(snapshot: DocumentSnapshot<DocumentData>): Budget | null {
  if (!snapshot.exists()) return null
  const data = snapshot.data({ serverTimestamps: 'estimate' })
  const contentStatus = requireString(data, 'contentStatus')
  if (!tripContentStatuses.includes(contentStatus as TripContentStatus)) throw new BudgetServiceError('El presupuesto guardado contiene un estado desconocido.')
  return { gasoline: requireString(data, 'gasoline'), payAlexander: requireString(data, 'payAlexander'), meals: requireString(data, 'meals'), miscellaneous: requireString(data, 'miscellaneous'), maximumBudget: requireString(data, 'maximumBudget'), contingencyEnabled: requireBoolean(data, 'contingencyEnabled'), contingencyPercentage: requireContingencyPercentage(data), contentStatus: contentStatus as TripContentStatus, createdAt: requireTimestamp(data, 'createdAt'), createdBy: requireString(data, 'createdBy'), updatedAt: requireTimestamp(data, 'updatedAt'), updatedBy: requireString(data, 'updatedBy'), completedAt: getOptionalTimestamp(data, 'completedAt'), completedBy: getOptionalString(data, 'completedBy') }
}

const operationErrorMessages: Record<BudgetOperation, string> = { save: 'No se ha podido guardar el presupuesto. Inténtalo de nuevo.', load: 'No se ha podido cargar el presupuesto. Inténtalo de nuevo.' }
const permissionErrorMessages: Record<BudgetOperation, string> = { save: 'Firestore no permite guardar el presupuesto con esta cuenta.', load: 'Firestore no permite consultar el presupuesto con esta cuenta.' }
function toBudgetServiceError(error: unknown, operation: BudgetOperation) {
  if (error instanceof BudgetServiceError) return error
  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') return new BudgetServiceError(permissionErrorMessages[operation], { cause: error })
    if (error.code === 'unavailable' || error.code === 'network-request-failed') return new BudgetServiceError('No se ha podido conectar con Firestore. Comprueba tu conexión e inténtalo de nuevo.', { cause: error })
  }
  return new BudgetServiceError(operationErrorMessages[operation], { cause: error })
}
function buildBudgetDocument(data: BudgetFormData) { return normalizeBudgetFormData(data) }

export async function createOrUpdateBudget(tripId: string, data: SaveBudgetData, userId: string) {
  requireIdentifier(tripId, 'el viaje'); requireIdentifier(userId, 'la persona usuaria')
  try {
    const database = requireFirestore()
    const budgetReference = doc(database, 'trips', tripId, 'budget', 'main')
    const previousBudget = await getDoc(budgetReference)
    const previousStatus = previousBudget.exists() ? previousBudget.data().contentStatus : undefined
    const isBecomingCompleted = data.contentStatus === 'completed' && previousStatus !== 'completed'
    await setDoc(budgetReference, { ...buildBudgetDocument(data), contentStatus: data.contentStatus, updatedAt: serverTimestamp(), updatedBy: userId, ...(!previousBudget.exists() && { createdAt: serverTimestamp(), createdBy: userId }), ...(isBecomingCompleted && { completedAt: serverTimestamp(), completedBy: userId }) }, { merge: true })
  } catch (error) { throw toBudgetServiceError(error, 'save') }
}

export function subscribeToBudget(tripId: string, onData: BudgetSubscriber, onError: BudgetSubscriptionErrorHandler) {
  try {
    requireIdentifier(tripId, 'el viaje')
    return onSnapshot(doc(requireFirestore(), 'trips', tripId, 'budget', 'main'), (budgetSnapshot) => { try { onData(mapBudgetDocument(budgetSnapshot)) } catch (error) { onError(toBudgetServiceError(error, 'load')) } }, (error) => onError(toBudgetServiceError(error, 'load')))
  } catch (error) { onError(toBudgetServiceError(error, 'load')); return () => undefined }
}
