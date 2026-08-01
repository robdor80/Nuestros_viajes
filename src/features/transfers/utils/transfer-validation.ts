import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import type { TransferFormData, TransferStop } from '../model/transfer'
import {
  buildGoogleMapsDirectionsUrl,
  isValidHttpUrl,
  isValidMapsEmbedUrl,
} from './transfer-maps'

export type TransferFormErrorKey = keyof TransferFormData | 'form'

export type TransferFormErrors = Partial<Record<TransferFormErrorKey, string>>

function normalizeStops(stops: TransferStop[]) {
  return stops
    .map((stop, index) => ({
      id: stop.id,
      description: stop.description.trim(),
      location: stop.location.trim(),
      notes: stop.notes.trim(),
      order: index,
    }))
    .filter(
      (stop) => stop.description || stop.location || stop.notes,
    )
}

export function normalizeTransferFormData(
  values: TransferFormData,
): TransferFormData {
  const normalizedValues = {
    date: values.date.trim(),
    origin: values.origin.trim(),
    destination: values.destination.trim(),
    viaMotorway: values.viaMotorway,
    hasTolls: values.hasTolls,
    estimatedTollCost: values.estimatedTollCost.trim(),
    estimatedDuration: values.estimatedDuration.trim(),
    distanceKm: values.distanceKm.trim(),
    plannedStops: normalizeStops(values.plannedStops),
    notes: values.notes.trim(),
    mapsUrl: values.mapsUrl.trim(),
    mapsEmbedUrl: values.mapsEmbedUrl.trim(),
  }

  return {
    ...normalizedValues,
    mapsUrl:
      normalizedValues.mapsUrl ||
      buildGoogleMapsDirectionsUrl(normalizedValues),
  }
}

export function hasUsefulTransferData(values: TransferFormData) {
  return Boolean(
    values.date.trim() ||
      values.origin.trim() ||
      values.destination.trim() ||
      values.viaMotorway !== null ||
      values.hasTolls !== null ||
      values.estimatedTollCost.trim() ||
      values.estimatedDuration.trim() ||
      values.distanceKm.trim() ||
      values.plannedStops.length > 0 ||
      values.notes.trim() ||
      values.mapsUrl.trim() ||
      values.mapsEmbedUrl.trim(),
  )
}

export function validateTransfer(
  values: TransferFormData,
  contentStatus: TripContentStatus,
) {
  const errors: TransferFormErrors = {}

  if (values.mapsUrl.trim() && !isValidHttpUrl(values.mapsUrl)) {
    errors.mapsUrl = 'El enlace de Google Maps debe comenzar por http:// o https://.'
  }

  if (values.mapsEmbedUrl.trim() && !isValidMapsEmbedUrl(values.mapsEmbedUrl)) {
    errors.mapsEmbedUrl =
      'Usa una URL válida de inserción de Google Maps.'
  }

  if (contentStatus === 'draft') {
    const canSaveDraft = Boolean(
      values.date.trim() ||
        values.origin.trim() ||
        values.destination.trim() ||
        values.notes.trim(),
    )
    if (!canSaveDraft) {
      errors.form =
        'Para guardar como borrador, añade fecha, salida, llegada o una nota.'
    }
  }

  if (contentStatus === 'in_progress') {
    if (!values.origin.trim()) {
      errors.origin = 'Indica el lugar de salida.'
    }
    if (!values.destination.trim()) {
      errors.destination = 'Indica el lugar de llegada.'
    }
    const hasOtherUsefulData = Boolean(
      values.date.trim() ||
        values.viaMotorway !== null ||
        values.hasTolls !== null ||
        values.estimatedTollCost.trim() ||
        values.estimatedDuration.trim() ||
        values.distanceKm.trim() ||
        values.plannedStops.length > 0 ||
        values.notes.trim() ||
        values.mapsUrl.trim() ||
        values.mapsEmbedUrl.trim(),
    )
    if (values.origin.trim() && values.destination.trim() && !hasOtherUsefulData) {
      errors.form =
        'Para guardar en preparación, añade al menos otro dato útil.'
    }
  }

  if (contentStatus === 'completed') {
    if (!values.date.trim()) {
      errors.date = 'Indica la fecha del trayecto.'
    }
    if (!values.origin.trim()) {
      errors.origin = 'Indica el lugar de salida.'
    }
    if (!values.destination.trim()) {
      errors.destination = 'Indica el lugar de llegada.'
    }
  }

  return errors
}
