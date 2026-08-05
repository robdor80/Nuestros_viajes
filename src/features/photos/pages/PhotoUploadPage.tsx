import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'

import { getTripWorkspacePath } from '../../trip-workspace/model/trip-workspace-section'
import type { BaseTrip } from '../../trips/model/trip'
import { PhotoSelectionGrid } from '../components/PhotoSelectionGrid'
import { usePhotoAnalysis } from '../hooks/usePhotoAnalysis'
import { usePhotoSelection } from '../hooks/usePhotoSelection'
import { usePhotoUploadNavigationGuard } from '../hooks/usePhotoUploadNavigationGuard'
import {
  MAX_SELECTED_PHOTOS,
  formatFileSize,
} from '../utils/photo-selection'
import styles from './PhotoUploadPage.module.css'

type ConfirmationAction = 'clear'

function formatPhotoCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

function buildAnalysisSummaryDetails({
  datesToReview,
  outsideTrip,
  withGps,
  failed,
}: {
  datesToReview: number
  outsideTrip: number
  withGps: number
  failed: number
}) {
  return [
    datesToReview > 0 &&
      `${formatPhotoCount(datesToReview, 'fecha necesita', 'fechas necesitan')} revisión`,
    outsideTrip > 0 &&
      `${formatPhotoCount(outsideTrip, 'fuera del viaje', 'fuera del viaje')}`,
    withGps > 0 &&
      `${formatPhotoCount(withGps, 'con ubicación', 'con ubicación')}`,
    failed > 0 &&
      `${formatPhotoCount(failed, 'no se pudo analizar', 'no se pudieron analizar')}`,
  ].filter((detail): detail is string => Boolean(detail))
}

export function PhotoUploadPage() {
  const titleId = useId()
  const continueDescriptionId = useId()
  const clearConfirmationTitleId = useId()
  const exitConfirmationTitleId = useId()
  const exitConfirmationDescriptionId = useId()
  const trip = useOutletContext<BaseTrip>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const keepSelectingButtonRef = useRef<HTMLButtonElement>(null)
  const exitDialogRef = useRef<HTMLDivElement>(null)
  const stayOnUploadButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusedElementRef = useRef<HTMLElement | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [confirmationAction, setConfirmationAction] =
    useState<ConfirmationAction | null>(null)
  const {
    photos,
    statusMessage,
    totalSize,
    hasSelection,
    canAddMore,
    addFiles,
    markPreviewUnavailable,
    updatePhotoAnalysis,
    removePhoto,
    clearSelection,
    discardSelection,
  } = usePhotoSelection()
  const analysisSummary = usePhotoAnalysis({
    photos,
    trip,
    updatePhotoAnalysis,
  })
  const {
    isExitConfirmationOpen,
    isConfirmingExit,
    cancelExit,
    confirmExit,
  } = usePhotoUploadNavigationGuard({
    hasPendingChanges: hasSelection,
    onConfirmExit: discardSelection,
  })
  const photosPath = getTripWorkspacePath(trip.id, 'fotos')
  const isSecondaryMenuOpen = hasSelection && isMenuOpen
  const selectedCountLabel =
    photos.length === 1
      ? '1 seleccionada'
      : `${photos.length} seleccionadas`
  const totalSizeLabel = formatFileSize(totalSize)
  const pendingAnalysisCount =
    analysisSummary.pending + analysisSummary.analyzing
  const isAnalyzingPhotos = pendingAnalysisCount > 0
  const datesToReview =
    analysisSummary.lowConfidenceDate + analysisSummary.withoutDate
  const analysisDetails = buildAnalysisSummaryDetails({
    datesToReview,
    outsideTrip: analysisSummary.outsideTrip,
    withGps: analysisSummary.withGps,
    failed: analysisSummary.failed,
  })
  const analysisSummaryTitle = isAnalyzingPhotos
    ? `Analizando ${formatPhotoCount(
        pendingAnalysisCount,
        'fotografía',
        'fotografías',
      )}…`
    : `${formatPhotoCount(
        analysisSummary.total,
        'fotografía preparada',
        'fotografías preparadas',
      )}`
  const continueHintText = isAnalyzingPhotos
    ? 'Espera a que termine el análisis de las fotografías.'
    : 'La revisión de las fotografías se incorporará en el siguiente paso.'

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    if (confirmationAction) {
      keepSelectingButtonRef.current?.focus()
    }
  }, [confirmationAction])

  useEffect(() => {
    if (!isExitConfirmationOpen) return

    previousFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    stayOnUploadButtonRef.current?.focus()
  }, [isExitConfirmationOpen])

  const restorePreviousFocus = () => {
    window.requestAnimationFrame(() => {
      previousFocusedElementRef.current?.focus()
      previousFocusedElementRef.current = null
    })
  }

  const cancelBlockedExit = () => {
    cancelExit()
    restorePreviousFocus()
  }

  const trapExitDialogFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      cancelBlockedExit()
      return
    }

    if (event.key !== 'Tab' || !exitDialogRef.current) return

    const focusableElements = Array.from(
      exitDialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.offsetParent !== null)
    const firstElement = focusableElements[0]
    const lastElement = focusableElements.at(-1)

    if (!firstElement || !lastElement) return

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  const openFileSelector = () => {
    setConfirmationAction(null)
    setIsMenuOpen(false)
    fileInputRef.current?.click()
  }

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(event.target.files ?? [])
    event.target.value = ''
  }

  const requestLeave = () => {
    setIsMenuOpen(false)
    void navigate(photosPath)
  }

  const requestClearSelection = () => {
    setIsMenuOpen(false)
    setConfirmationAction('clear')
  }

  const confirmClearSelection = () => {
    clearSelection()
    setConfirmationAction(null)
  }

  return (
    <section className={styles.page} aria-labelledby={titleId}>
      <header className={styles.header}>
        <div className={styles.topBar}>
          <button
            className={styles.backButton}
            type="button"
            onClick={requestLeave}
          >
            <span aria-hidden="true">‹</span>
            Fotos
          </button>
          {hasSelection && (
            <div className={styles.menuWrap}>
              <button
                className={styles.menuButton}
                type="button"
                aria-label="Abrir acciones de la selección"
                aria-expanded={isSecondaryMenuOpen}
                aria-controls="photo-upload-secondary-actions"
                onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
              >
                <span aria-hidden="true">⋯</span>
              </button>
              {isSecondaryMenuOpen && (
                <div
                  id="photo-upload-secondary-actions"
                  className={styles.menu}
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={requestClearSelection}
                  >
                    Vaciar selección
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.heading}>
          <p className={styles.eyebrow}>Fotos de {trip.name}</p>
          <h2 id={titleId} ref={titleRef} tabIndex={-1}>
            Añadir fotografías
          </h2>
          <p>
            Paso 1 de 3 · {selectedCountLabel} · {totalSizeLabel}
          </p>
        </div>
      </header>

      <input
        ref={fileInputRef}
        className={styles.fileInput}
        type="file"
        accept="image/*"
        multiple
        aria-label="Seleccionar fotografías del dispositivo"
        onChange={handleFilesSelected}
      />

      <div className={styles.content}>
        {photos.length === 0 ? (
          <section className={styles.emptySelection}>
            <div className={styles.emptyIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="2.5" />
                <circle cx="8.5" cy="9.5" r="1.4" />
                <path d="m4.5 17 4.8-4.8a1.5 1.5 0 0 1 2.1 0L16.2 17" />
                <path d="m13.5 14.3 1.4-1.4a1.5 1.5 0 0 1 2.1 0L20 16" />
              </svg>
            </div>
            <div>
              <h3>Selecciona las fotografías del viaje</h3>
              <p>
                Puedes elegir varias desde la galería. El lote admite hasta{' '}
                {MAX_SELECTED_PHOTOS} fotografías.
              </p>
            </div>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={openFileSelector}
            >
              Elegir fotografías
            </button>
          </section>
        ) : (
          <PhotoSelectionGrid
            photos={photos}
            canAddMore={canAddMore}
            onAddPhotos={openFileSelector}
            onPreviewError={markPreviewUnavailable}
            onRemove={removePhoto}
          />
        )}

        {statusMessage && (
          <p className={styles.statusMessage} role="status" aria-live="polite">
            {statusMessage}
          </p>
        )}

        {photos.length > 0 && (
          <section
            className={styles.analysisSummary}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div
              className={isAnalyzingPhotos ? styles.analysisSpinner : styles.analysisIcon}
              aria-hidden="true"
            />
            <div>
              <h3>{analysisSummaryTitle}</h3>
              {analysisDetails.length > 0 && (
                <p>{analysisDetails.join(' · ')}</p>
              )}
            </div>
          </section>
        )}

        <p
          id={continueDescriptionId}
          className={styles.continueHint}
          role="status"
        >
          {continueHintText}
        </p>

        {confirmationAction === 'clear' && (
          <section
            className={styles.confirmation}
            role="alertdialog"
            aria-labelledby={clearConfirmationTitleId}
          >
            <div>
              <h3 id={clearConfirmationTitleId}>¿Vaciar la selección?</h3>
              <p>
                Se retirarán todas las fotografías elegidas para este lote. No
                se ha subido ni guardado nada.
              </p>
            </div>
            <div className={styles.confirmationActions}>
              <button
                ref={keepSelectingButtonRef}
                type="button"
                onClick={() => setConfirmationAction(null)}
              >
                Seguir seleccionando
              </button>
              <button
                className={styles.dangerButton}
                type="button"
                onClick={confirmClearSelection}
              >
                Vaciar selección
              </button>
            </div>
          </section>
        )}
      </div>

      <footer className={styles.bottomBar}>
        <button
          className={styles.continueButton}
          type="button"
          disabled
          aria-describedby={continueDescriptionId}
        >
          Continuar
        </button>
      </footer>

      {isExitConfirmationOpen && (
        <div className={styles.confirmationBackdrop}>
          <div
            ref={exitDialogRef}
            className={styles.exitConfirmation}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={exitConfirmationTitleId}
            aria-describedby={exitConfirmationDescriptionId}
            onKeyDown={trapExitDialogFocus}
          >
            <div>
              <h3 id={exitConfirmationTitleId}>¿Salir de la subida?</h3>
              <p id={exitConfirmationDescriptionId}>
                Las fotografías seleccionadas todavía no se han subido. Si
                sales ahora, se perderá la selección.
              </p>
            </div>
            <div className={styles.confirmationActions}>
              <button
                ref={stayOnUploadButtonRef}
                type="button"
                disabled={isConfirmingExit}
                onClick={cancelBlockedExit}
              >
                Seguir seleccionando
              </button>
              <button
                className={styles.dangerButton}
                type="button"
                disabled={isConfirmingExit}
                onClick={confirmExit}
              >
                Salir sin subir
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
