import { useId, useState } from 'react'

import type { PhotoSearchCriteria } from '../utils/photo-search'
import styles from './PhotoSearchControls.module.css'

type PhotoSearchControlsProps = {
  criteria: PhotoSearchCriteria
  tripDays: number[]
  hasActiveCriteria: boolean
  onCriteriaChange: (criteria: PhotoSearchCriteria) => void
  onClear: () => void
}

export function PhotoSearchControls({
  criteria,
  tripDays,
  hasActiveCriteria,
  onCriteriaChange,
  onClear,
}: PhotoSearchControlsProps) {
  const filtersId = useId()
  const [areFiltersOpen, setAreFiltersOpen] = useState(false)

  const updateCriteria = (nextCriteria: Partial<PhotoSearchCriteria>) => {
    onCriteriaChange({ ...criteria, ...nextCriteria })
  }

  return (
    <section className={styles.controls} aria-label="Buscar y filtrar fotografías">
      <div className={styles.searchRow}>
        <label className={styles.searchField}>
          <span>Buscar fotografías</span>
          <input
            type="search"
            value={criteria.query}
            placeholder="Buscar fotografías…"
            onChange={(event) => updateCriteria({ query: event.target.value })}
          />
        </label>
        <button
          className={styles.filtersButton}
          type="button"
          aria-expanded={areFiltersOpen}
          aria-controls={filtersId}
          onClick={() => setAreFiltersOpen((isOpen) => !isOpen)}
        >
          Filtros
        </button>
        {hasActiveCriteria && (
          <button className={styles.clearButton} type="button" onClick={onClear}>
            Limpiar
          </button>
        )}
      </div>

      {areFiltersOpen && (
        <div id={filtersId} className={styles.filters}>
          <label className={styles.filterField}>
            <span>Fecha</span>
            <input
              type="date"
              value={criteria.date}
              onChange={(event) => updateCriteria({ date: event.target.value })}
            />
          </label>
          <label className={styles.filterField}>
            <span>Día del viaje</span>
            <select
              value={criteria.tripDay}
              onChange={(event) => updateCriteria({ tripDay: event.target.value })}
            >
              <option value="">Cualquier día</option>
              {tripDays.map((tripDay) => (
                <option key={tripDay} value={tripDay}>Día {tripDay}</option>
              ))}
            </select>
          </label>
        </div>
      )}
    </section>
  )
}
