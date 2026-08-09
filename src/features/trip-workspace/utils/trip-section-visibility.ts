import type { TripSection } from '../../trips/model/trip'
import type { TripWorkspaceSectionId } from '../model/trip-workspace-section'

type SectionSummary = {
  status: 'loading' | 'ready' | 'error'
  total: number
  contentCount?: number
}

const workspaceSectionMappings: Record<
  TripWorkspaceSectionId,
  TripSection[]
> = {
  places: ['places'],
  planning: ['itinerary'],
  accommodation: ['accommodation'],
  budget: ['budget'],
  restaurants: ['restaurants'],
  transfers: ['transfers'],
  photos: ['photos'],
  'useful-data': ['checklist', 'documentation'],
}

export function isTripWorkspaceSectionEnabled(
  sectionId: TripWorkspaceSectionId,
  enabledSections: TripSection[],
) {
  return workspaceSectionMappings[sectionId].some((section) =>
    enabledSections.includes(section),
  )
}

export function shouldShowTripWorkspaceSection(
  summary: SectionSummary | undefined,
) {
  if (!summary) return false
  if (summary.status === 'error') return true
  if (summary.status !== 'ready') return false

  return (summary.contentCount ?? summary.total) > 0
}
