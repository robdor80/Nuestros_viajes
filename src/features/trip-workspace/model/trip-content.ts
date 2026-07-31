export type TripContentStatus =
  | 'draft'
  | 'in_progress'
  | 'completed'

export const tripContentStatusLabels: Record<TripContentStatus, string> = {
  draft: 'Borrador',
  in_progress: 'En preparación',
  completed: 'Terminado',
}
