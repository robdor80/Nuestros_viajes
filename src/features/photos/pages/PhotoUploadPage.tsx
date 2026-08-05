import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'

import { getTripWorkspacePath } from '../../trip-workspace/model/trip-workspace-section'
import type { BaseTrip } from '../../trips/model/trip'
import { PhotoSelectionGrid } from '../components/PhotoSelectionGrid'
import { usePhotoSelection } from '../hooks/usePhotoSelection'
import {
  MAX_SELECTED_PHOTOS,
  formatFileSize,
} from '../utils/photo-selection'
import styles from './PhotoUploadPage.module.css'

type ConfirmationAction = 'leave' | 'clear'

export function PhotoUploadPage() {
  const titleId = useId()
  const continueDescriptionId = useId()
  const confirmationTitleId = useId()
  const trip = useOutletContext<BaseTrip>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const keepSelectingButtonRef = useRef<HTMLButtonElement>(null)
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
    removePhoto,
    clearSelection,
    discardSelection,
  } = usePhotoSelection()
  const photosPath = getTripWorkspacePath(trip.id, 'fotos')
  const isSecondaryMenuOpen = hasSelection && isMenuOpen
  const selectedCountLabel =
    photos.length === 1
      ? '1 seleccionada'
      : `${photos.length} seleccionadas`
  const totalSizeLabel = formatFileSize(totalSize)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    if (confirmationAction) {
      keepSelectingButtonRef.current?.focus()
    }
  }, [confirmationAction])

  useEffect(() => {
    if (!hasSelection) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasSelection])

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

    if (hasSelection) {
      setConfirmationAction('leave')
      return
    }

    void navigate(photosPath)
  }

  const requestClearSelection = () => {
    setIsMenuOpen(false)
    setConfirmationAction('clear')
  }

  const confirmAction = () => {
    if (confirmationAction === 'clear') {
      clearSelection()
      setConfirmationAction(null)
      return
    }

    discardSelection()
    void navigate(photosPath)
  }

  const confirmationCopy =
    confirmationAction === 'clear'
      ? {
          title: '¿Vaciar la selección?',
          body: 'Se retirarán todas las fotografías elegidas para este lote. No se ha subido ni guardado nada.',
          action: 'Vaciar selección',
        }
      : {
          title: '¿Salir de la subida?',
          body: 'Se perderán las fotografías seleccionadas para este lote. No se ha subido ni guardado nada.',
          action: 'Salir sin guardar',
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

        <p
          id={continueDescriptionId}
          className={styles.continueHint}
          role="status"
        >
          La revisión y la subida real se incorporarán en la siguiente fase.
        </p>

        {confirmationAction && (
          <section
            className={styles.confirmation}
            role="alertdialog"
            aria-labelledby={confirmationTitleId}
          >
            <div>
              <h3 id={confirmationTitleId}>{confirmationCopy.title}</h3>
              <p>{confirmationCopy.body}</p>
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
                onClick={confirmAction}
              >
                {confirmationCopy.action}
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
    </section>
  )
}
