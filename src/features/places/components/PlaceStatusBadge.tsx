import {
  tripContentStatusLabels,
  type TripContentStatus,
} from '../../trip-workspace/model/trip-content'
import styles from './PlaceStatusBadge.module.css'

type PlaceStatusBadgeProps = {
  status: TripContentStatus
}

export function PlaceStatusBadge({ status }: PlaceStatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {tripContentStatusLabels[status]}
    </span>
  )
}
