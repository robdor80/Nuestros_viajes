export type PhotoAnalysisStatus =
  | 'pending'
  | 'analyzing'
  | 'completed'
  | 'completed-with-warnings'
  | 'failed'

export type PhotoDateSource =
  | 'exif-original'
  | 'exif-create'
  | 'exif-modify'
  | 'file-last-modified'
  | 'unavailable'

export type PhotoDateConfidence = 'high' | 'medium' | 'low' | 'unknown'

export type PhotoDateOffsetSource = 'exif' | 'unknown'

export type PhotoDateInfo = {
  source: PhotoDateSource
  confidence: PhotoDateConfidence
  originalValue?: string
  localDate?: string
  localTime?: string
  offset?: string
  offsetSource: PhotoDateOffsetSource
}

export type TripDayAssignment =
  | {
      status: 'matched'
      dayNumber: number
      date: string
    }
  | {
      status: 'before-trip'
      date: string
    }
  | {
      status: 'after-trip'
      date: string
    }
  | {
      status: 'missing-photo-date'
    }
  | {
      status: 'missing-trip-dates'
    }
  | {
      status: 'invalid-trip-dates'
    }

export type PhotoLocationInfo =
  | {
      status: 'available'
      latitude: number
      longitude: number
      altitude?: number
      direction?: number
    }
  | {
      status: 'unavailable'
    }
  | {
      status: 'invalid'
    }

export type PhotoOrientationInfo = {
  value?: number
  requiresDimensionSwap: boolean
  source: 'exif' | 'unavailable'
}

export type PhotoDimensionsSource =
  | 'exif'
  | 'bitmap'
  | 'image-element'
  | 'unavailable'

export type PhotoDimensionsInfo = {
  originalWidth?: number
  originalHeight?: number
  visualWidth?: number
  visualHeight?: number
  source: PhotoDimensionsSource
}

export type PhotoMetadata = {
  originalFileName: string
  originalMimeType: string
  originalSize: number
  date: PhotoDateInfo
  location: PhotoLocationInfo
  orientation: PhotoOrientationInfo
  dimensions: PhotoDimensionsInfo
  tripDay: TripDayAssignment
}

export type PhotoAnalysisWarningCode =
  | 'using-file-date'
  | 'using-exif-modify-date'
  | 'missing-date'
  | 'outside-trip-range'
  | 'missing-dimensions'
  | 'invalid-gps'
  | 'preview-unavailable'
  | 'heic-partial-support'
  | 'metadata-read-failed'

export type PhotoAnalysisErrorCode =
  | 'unsupported-file'
  | 'analysis-failed'
  | 'unknown'

export type PhotoAnalysis = {
  status: PhotoAnalysisStatus
  metadata?: PhotoMetadata
  warnings: PhotoAnalysisWarningCode[]
  errorCode?: PhotoAnalysisErrorCode
  analyzedAt?: number
}

export type PhotoAnalysisSummary = {
  total: number
  pending: number
  analyzing: number
  completed: number
  completedWithWarnings: number
  failed: number
  withExifDate: number
  withFallbackDate: number
  withoutDate: number
  lowConfidenceDate: number
  withGps: number
  beforeTrip: number
  afterTrip: number
  outsideTrip: number
  needsReview: number
  totalOriginalSize: number
}

export function createPendingPhotoAnalysis(): PhotoAnalysis {
  return {
    status: 'pending',
    warnings: [],
  }
}
