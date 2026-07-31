import type { PlaceCategory, PlacePriority } from '../../places/model/place'
import type { TripContentStatus } from '../../trip-workspace/model/trip-content'

export const planningActivityTypes = [
  'visit',
  'transfer',
  'accommodation',
  'breakfast',
  'lunch',
  'dinner',
  'reservation',
  'free_time',
  'rest',
  'shopping',
  'note',
  'other',
] as const

export type PlanningActivityType = (typeof planningActivityTypes)[number]

export const planningActivityTypeLabels: Record<PlanningActivityType, string> = {
  visit: 'Visita',
  transfer: 'Trayecto',
  accommodation: 'Alojamiento',
  breakfast: 'Desayuno',
  lunch: 'Comida',
  dinner: 'Cena',
  reservation: 'Reserva',
  free_time: 'Tiempo libre',
  rest: 'Piscina o descanso',
  shopping: 'Compras',
  note: 'Nota',
  other: 'Otro',
}

export const planningMoments = [
  'morning',
  'midday',
  'afternoon',
  'night',
] as const

export type PlanningMoment = (typeof planningMoments)[number]

export const planningMomentLabels: Record<PlanningMoment, string> = {
  morning: 'Mañana',
  midday: 'Mediodía',
  afternoon: 'Tarde',
  night: 'Noche',
}

export type PlanningPlaceSnapshot = {
  name: string
  category: PlaceCategory | ''
  priority: PlacePriority | ''
  contentStatus: TripContentStatus
}

export type PlanningActivity = {
  id: string
  type: PlanningActivityType | ''
  title: string
  relatedPlaceId: string
  placeSnapshot: PlanningPlaceSnapshot | null
  momentOfDay: PlanningMoment | ''
  startTime: string
  endTime: string
  estimatedDuration: string
  imageUrl: string
  address: string
  mapsUrl: string
  description: string
  notes: string
  order: number
}

export type PlanningDay = {
  id: string
  date: string
  title: string
  description: string
  notes: string
  contentStatus: TripContentStatus
  activities: PlanningActivity[]
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  completedAt?: string
  completedBy?: string
}

export type PlanningDayFormData = Pick<
  PlanningDay,
  'title' | 'description' | 'notes' | 'activities'
>

export type SavePlanningDayData = PlanningDayFormData & {
  contentStatus: TripContentStatus
}

export type PlanningDaysLoadStatus = 'loading' | 'ready' | 'error'

export const emptyPlanningActivity: Omit<PlanningActivity, 'id' | 'order'> = {
  type: '',
  title: '',
  relatedPlaceId: '',
  placeSnapshot: null,
  momentOfDay: '',
  startTime: '',
  endTime: '',
  estimatedDuration: '',
  imageUrl: '',
  address: '',
  mapsUrl: '',
  description: '',
  notes: '',
}

export const emptyPlanningDayFormData: PlanningDayFormData = {
  title: '',
  description: '',
  notes: '',
  activities: [],
}

export function planningDayToFormData(day: PlanningDay): PlanningDayFormData {
  return {
    title: day.title,
    description: day.description,
    notes: day.notes,
    activities: day.activities.map((activity) => ({ ...activity })),
  }
}
