export type PhotoReviewDateMode = 'analyzed' | 'manual' | 'without-date'

export type PhotoReviewTripDayMode = 'analyzed' | 'manual' | 'unassigned'

export type PhotoReviewData = {
  photoId: string
  fingerprint: string
  dateMode: PhotoReviewDateMode
  localDate: string | null
  localTime: string | null
  tripDayMode: PhotoReviewTripDayMode
  tripDayNumber: number | null
  description: string
  isConfirmed: boolean
}

export type PhotoReviewDraft = Pick<
  PhotoReviewData,
  | 'dateMode'
  | 'localDate'
  | 'localTime'
  | 'tripDayMode'
  | 'tripDayNumber'
  | 'description'
  | 'isConfirmed'
>

export type PhotoReviewSummary = {
  total: number
  ready: number
  needsReview: number
  manuallyConfirmed: number
  acceptedWithoutDate: number
  outsideTrip: number
  withLocation: number
}
