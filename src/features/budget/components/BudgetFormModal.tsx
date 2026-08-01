import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'

import type { TripContentStatus } from '../../trip-workspace/model/trip-content'
import { contingencyPercentages, budgetToFormData, emptyBudgetFormData, type Budget, type BudgetFormData, type SaveBudgetData } from '../model/budget'
import { calculateBudget, formatBudgetAmount } from '../utils/budget-calculations'
import { validateBudget, type BudgetFormErrors } from '../utils/budget-validation'
import styles from './BudgetFormModal.module.css'

type BudgetFormModalProps = { budget?: Budget; accommodationTotal: number; onCancel: () => void; onSave: (data: SaveBudgetData) => Promise<void> }
type AmountField = 'gasoline' | 'payAlexander' | 'meals' | 'miscellaneous' | 'maximumBudget'

const amountFields: Array<{ field: AmountField; label: string }> = [
  { field: 'gasoline', label: 'Gasolina' },
  { field: 'payAlexander', label: 'Pagar a Alexander' },
  { field: 'meals', label: 'Comidas y cenas' },
  { field: 'miscellaneous', label: 'Gastos varios' },
]

export function BudgetFormModal({ budget, accommodationTotal, onCancel, onSave }: BudgetFormModalProps) {
  const [values, setValues] = useState<BudgetFormData>(() => budget ? budgetToFormData(budget) : emptyBudgetFormData)
  const [errors, setErrors] = useState<BudgetFormErrors>({})
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [savingStatus, setSavingStatus] = useState<TripContentStatus | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)
  const isSavingRef = useRef(false)
  const isSaving = savingStatus !== null
  const calculations = useMemo(() => calculateBudget(values, accommodationTotal), [accommodationTotal, values])

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement as HTMLElement | null
    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstInputRef.current?.focus()
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !isSavingRef.current) { event.preventDefault(); onCancel() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = previousBodyOverflow; previouslyFocusedElement?.focus() }
  }, [onCancel])

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) return
    const focusableElements = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'))
    const firstElement = focusableElements[0]
    const lastElement = focusableElements.at(-1)
    if (!firstElement || !lastElement) return
    if (event.shiftKey && document.activeElement === firstElement) { event.preventDefault(); lastElement.focus() }
    if (!event.shiftKey && document.activeElement === lastElement) { event.preventDefault(); firstElement.focus() }
  }

  const updateField = <T extends keyof BudgetFormData>(field: T, value: BudgetFormData[T]) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }))
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined, form: undefined }))
    setSubmissionError(null)
  }

  const save = async (contentStatus: TripContentStatus) => {
    if (isSavingRef.current) return
    const nextErrors = validateBudget(values, contentStatus, accommodationTotal)
    setErrors(nextErrors)
    setSubmissionError(null)
    if (Object.keys(nextErrors).length > 0) return
    isSavingRef.current = true
    setSavingStatus(contentStatus)
    try { await onSave({ ...values, contentStatus }); onCancel() } catch (error) { setSubmissionError(error instanceof Error ? error.message : 'No se ha podido guardar el presupuesto. Inténtalo de nuevo.') } finally { isSavingRef.current = false; setSavingStatus(null) }
  }

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget && !isSaving) onCancel() }
  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={handleBackdropMouseDown}>
      <div ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="budget-form-title" onKeyDown={trapFocus}>
        <header className={styles.header}>
          <div><p className={styles.eyebrow}>Presupuesto</p><h2 id="budget-form-title">{budget ? 'Editar presupuesto' : 'Añadir presupuesto'}</h2><p>Los importes se actualizan al momento. El hotel procede siempre de Alojamiento.</p></div>
          <button className={styles.closeButton} type="button" aria-label="Cerrar" disabled={isSaving} onClick={onCancel}><span aria-hidden="true">×</span></button>
        </header>
        <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
          {(errors.form || submissionError) && <div className={styles.formError} role="alert" aria-live="assertive">{errors.form ?? submissionError}</div>}
          <div className={styles.fields}>
            {accommodationTotal > 0 && <div className={styles.hotel}><span>Hotel</span><strong>{formatBudgetAmount(accommodationTotal)}</strong><small>Calculado desde los alojamientos del viaje.</small></div>}
            <fieldset className={styles.section}><legend>Conceptos previstos</legend>{amountFields.map(({ field, label }, index) => <label key={field} className={styles.field}><span>{label}</span><input ref={index === 0 ? firstInputRef : undefined} type="number" inputMode="decimal" min="0" step="0.01" value={values[field]} disabled={isSaving} onChange={(event) => updateField(field, event.target.value)} /></label>)}</fieldset>
            <fieldset className={styles.section}><legend>Límite e imprevistos</legend><label className={styles.field}><span>Presupuesto máximo</span><input type="number" inputMode="decimal" min="0" step="0.01" value={values.maximumBudget} disabled={isSaving} onChange={(event) => updateField('maximumBudget', event.target.value)} /></label><label className={styles.switchField}><span>Añadir colchón para imprevistos</span><input type="checkbox" role="switch" checked={values.contingencyEnabled} disabled={isSaving} onChange={(event) => updateField('contingencyEnabled', event.target.checked)} /></label>{values.contingencyEnabled && <label className={styles.field}><span>Porcentaje de imprevistos</span><select value={values.contingencyPercentage} disabled={isSaving} onChange={(event) => updateField('contingencyPercentage', Number(event.target.value) as BudgetFormData['contingencyPercentage'])}>{contingencyPercentages.map((percentage) => <option key={percentage} value={percentage}>{percentage} %</option>)}</select></label>}{values.contingencyEnabled && <div className={styles.calculated}><span>Imprevistos</span><strong>{calculations.contingency > 0 ? formatBudgetAmount(calculations.contingency) : '—'}</strong></div>}</fieldset>
            <div className={styles.summary} aria-live="polite"><span>Total previsto</span><strong>{calculations.total > 0 ? formatBudgetAmount(calculations.total) : '—'}</strong>{calculations.remainingMargin !== null && <><span>Margen restante</span><strong className={calculations.remainingMargin < 0 ? styles.negative : ''}>{formatBudgetAmount(calculations.remainingMargin)}</strong></>}</div>
          </div>
          <footer className={styles.actions}><button className={styles.cancelButton} type="button" disabled={isSaving} onClick={onCancel}>Cancelar</button><button type="button" disabled={isSaving} onClick={() => void save('draft')}>{savingStatus === 'draft' ? 'Guardando…' : 'Guardar como Borrador'}</button><button type="button" disabled={isSaving} onClick={() => void save('in_progress')}>{savingStatus === 'in_progress' ? 'Guardando…' : 'Guardar como En preparación'}</button><button className={styles.completeButton} type="button" disabled={isSaving} onClick={() => void save('completed')}>{savingStatus === 'completed' ? 'Guardando…' : 'Marcar como Terminado'}</button></footer>
        </form>
      </div>
    </div>
  )
}
