import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import type {
  PlanningActivity,
  PlanningDayFormData,
} from '../model/planning'

export type PlanningDayFormErrors = Partial<
  Record<'title' | 'activities' | 'form', string>
>

export type PlanningActivityFormErrors = Partial<
  Record<'title' | 'imageUrl' | 'mapsUrl' | 'time' | 'form', string>
>

function isValidUrl(value: string) {
  if (!value) return true

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function normalizeActivities(activities: PlanningActivity[]) {
  return activities.map((activity, index) => ({
    ...activity,
    title: activity.title.trim(),
    relatedPlaceId: activity.relatedPlaceId.trim(),
    startTime: activity.startTime.trim(),
    endTime: activity.endTime.trim(),
    estimatedDuration: activity.estimatedDuration.trim(),
    imageUrl: activity.imageUrl.trim(),
    address: activity.address.trim(),
    mapsUrl: activity.mapsUrl.trim(),
    description: activity.description.trim(),
    notes: activity.notes.trim(),
    order: index,
  }))
}

export function normalizePlanningDayFormData(
  values: PlanningDayFormData,
): PlanningDayFormData {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    notes: values.notes.trim(),
    activities: normalizeActivities(values.activities),
  }
}

export function validatePlanningActivity(
  activity: PlanningActivity,
): PlanningActivityFormErrors {
  const errors: PlanningActivityFormErrors = {}

  if (!activity.title.trim()) errors.title = 'Indica un título para la actividad.'
  if (!isValidUrl(activity.imageUrl.trim())) {
    errors.imageUrl = 'Introduce una URL de imagen válida.'
  }
  if (!isValidUrl(activity.mapsUrl.trim())) {
    errors.mapsUrl = 'Introduce un enlace de Maps válido.'
  }
  if (
    activity.startTime &&
    activity.endTime &&
    activity.endTime < activity.startTime
  ) {
    errors.time = 'La hora final no puede ser anterior a la inicial.'
  }

  return errors
}

export function validatePlanningDay(
  values: PlanningDayFormData,
  status: TripContentStatus,
): PlanningDayFormErrors {
  const errors: PlanningDayFormErrors = {}

  if (!values.title.trim()) errors.title = 'Indica un título para el día.'

  const invalidActivity = values.activities.find(
    (activity) => Object.keys(validatePlanningActivity(activity)).length > 0,
  )
  if (invalidActivity) {
    errors.activities = `Revisa la actividad «${invalidActivity.title || 'Sin título'}».`
  }

  if (
    status === 'in_progress' &&
    values.activities.length === 0 &&
    !values.description.trim() &&
    !values.notes.trim()
  ) {
    errors.form =
      'Para guardar En preparación, añade una actividad, una descripción o una nota.'
  }

  if (status === 'completed' && values.activities.length === 0) {
    errors.activities = 'Añade al menos una actividad para terminar el día.'
  }

  return errors
}

export function createPlanningActivityId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `activity-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
