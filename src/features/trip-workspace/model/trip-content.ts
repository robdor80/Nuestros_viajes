export const tripContentStatuses = [
  'draft',
  'in_progress',
  'completed',
] as const

export type TripContentStatus = (typeof tripContentStatuses)[number]

export const tripContentStatusLabels: Record<TripContentStatus, string> = {
  draft: 'Borrador',
  in_progress: 'En preparación',
  completed: 'Terminado',
}
