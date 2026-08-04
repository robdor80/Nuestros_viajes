import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'

import type { SelectedPhoto } from '../model/selected-photo'
import {
  MAX_SELECTED_PHOTOS,
  createSelectedPhoto,
  formatFileSize,
  getLocalPhotoFingerprint,
  isValidImageFile,
  revokeSelectedPhotoUrl,
} from '../utils/photo-selection'
import { PhotoSelectionGrid } from './PhotoSelectionGrid'
import styles from './PhotoSelectionDialog.module.css'

type PhotoSelectionDialogProps = {
  onClose: () => void
}

function buildSelectionMessage({
  addedCount,
  duplicateCount,
  invalidCount,
  limitedCount,
}: {
  addedCount: number
  duplicateCount: number
  invalidCount: number
  limitedCount: number
}) {
  const messages = [
    addedCount > 0 &&
      `${addedCount} ${
        addedCount === 1 ? 'fotografía añadida' : 'fotografías añadidas'
      }.`,
    duplicateCount > 0 &&
      `${duplicateCount} ${
        duplicateCount === 1
          ? 'archivo ya estaba incluido'
          : 'archivos ya estaban incluidos'
      }.`,
    invalidCount > 0 &&
      `${invalidCount} ${
        invalidCount === 1
          ? 'archivo no era una imagen válida'
          : 'archivos no eran imágenes válidas'
      }.`,
    limitedCount > 0 &&
      `El lote está limitado a ${MAX_SELECTED_PHOTOS} fotografías; se han conservado solo las primeras que cabían.`,
  ].filter((message): message is string => Boolean(message))

  return messages.join(' ')
}

export function PhotoSelectionDialog({
  onClose,
}: PhotoSelectionDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const [photos, setPhotos] = useState<SelectedPhoto[]>([])
  const [statusMessage, setStatusMessage] = useState('')
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chooseButtonRef = useRef<HTMLButtonElement>(null)
  const keepSelectingButtonRef = useRef<HTMLButtonElement>(null)
  const selectedPhotosRef = useRef<SelectedPhoto[]>([])
  const totalSize = photos.reduce((total, photo) => total + photo.file.size, 0)
  const selectedCountLabel =
    photos.length === 1 ? '1 fotografía seleccionada' : `${photos.length} fotografías seleccionadas`

  const requestClose = useCallback(() => {
    if (selectedPhotosRef.current.length > 0) {
      setShowCancelConfirmation(true)
      setStatusMessage(
        'Confirma si quieres cancelar y perder la selección actual.',
      )
      return
    }

    onClose()
  }, [onClose])

  useEffect(() => {
    selectedPhotosRef.current = photos
  }, [photos])

  useEffect(() => {
    if (showCancelConfirmation) {
      keepSelectingButtonRef.current?.focus()
    }
  }, [showCancelConfirmation])

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement as HTMLElement | null
    const previousBodyOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    chooseButtonRef.current?.focus()

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        requestClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
      selectedPhotosRef.current.forEach(revokeSelectedPhotoUrl)
      previouslyFocusedElement?.focus()
    }
  }, [requestClose])

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) return

    const focusableElements = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
    setShowCancelConfirmation(false)
    fileInputRef.current?.click()
  }

  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    clearFileInput()

    if (files.length === 0) return

    setShowCancelConfirmation(false)
    setPhotos((currentPhotos) => {
      const existingFingerprints = new Set(
        currentPhotos.map((photo) => photo.fingerprint),
      )
      const acceptedPhotos: SelectedPhoto[] = []
      let duplicateCount = 0
      let invalidCount = 0
      let limitedCount = 0

      files.forEach((file) => {
        if (!isValidImageFile(file)) {
          invalidCount += 1
          return
        }

        const fingerprint = getLocalPhotoFingerprint(file)
        if (existingFingerprints.has(fingerprint)) {
          duplicateCount += 1
          return
        }

        if (currentPhotos.length + acceptedPhotos.length >= MAX_SELECTED_PHOTOS) {
          limitedCount += 1
          return
        }

        existingFingerprints.add(fingerprint)
        acceptedPhotos.push(createSelectedPhoto(file))
      })

      setStatusMessage(
        buildSelectionMessage({
          addedCount: acceptedPhotos.length,
          duplicateCount,
          invalidCount,
          limitedCount,
        }),
      )

      return [...currentPhotos, ...acceptedPhotos]
    })
  }

  const markPreviewUnavailable = (photoId: string) => {
    setPhotos((currentPhotos) =>
      currentPhotos.map((photo) =>
        photo.id === photoId
          ? { ...photo, previewStatus: 'unavailable' }
          : photo,
      ),
    )
  }

  const removePhoto = (photoId: string) => {
    setShowCancelConfirmation(false)
    setPhotos((currentPhotos) => {
      const photoToRemove = currentPhotos.find((photo) => photo.id === photoId)
      if (photoToRemove) {
        revokeSelectedPhotoUrl(photoToRemove)
      }

      const nextPhotos = currentPhotos.filter((photo) => photo.id !== photoId)
      setStatusMessage('Fotografía retirada de la selección.')
      return nextPhotos
    })
  }

  const clearSelection = () => {
    photos.forEach(revokeSelectedPhotoUrl)
    selectedPhotosRef.current = []
    setPhotos([])
    setShowCancelConfirmation(false)
    setStatusMessage('Selección vaciada.')
  }

  const confirmCancel = () => {
    photos.forEach(revokeSelectedPhotoUrl)
    selectedPhotosRef.current = []
    setPhotos([])
    onClose()
  }

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      requestClose()
    }
  }

  const announceNextPhase = () => {
    setShowCancelConfirmation(false)
    setStatusMessage(
      'La revisión de datos se añadirá en la siguiente fase.',
    )
  }

  return (
    <div className={styles.backdrop} onMouseDown={handleBackdropMouseDown}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={trapFocus}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Fotos</p>
            <h2 id={titleId}>Añadir fotografías</h2>
            <p id={descriptionId}>
              Selecciona recuerdos desde tu dispositivo. En esta fase solo se
              preparan previsualizaciones locales.
            </p>
          </div>
          <button
            className={styles.closeButton}
            type="button"
            aria-label="Cerrar selección de fotografías"
            onClick={requestClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className={styles.content}>
          <ol className={styles.steps} aria-label="Pasos del asistente">
            <li className={styles.activeStep} aria-current="step">
              <span>1</span>
              Seleccionar
            </li>
            <li aria-disabled="true">
              <span>2</span>
              Revisar y completar
            </li>
            <li aria-disabled="true">
              <span>3</span>
              Subir
            </li>
          </ol>

          <input
            ref={fileInputRef}
            className={styles.fileInput}
            type="file"
            accept="image/*"
            multiple
            aria-label="Seleccionar fotografías del dispositivo"
            onChange={handleFilesSelected}
          />

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
                ref={chooseButtonRef}
                className={styles.primaryButton}
                type="button"
                onClick={openFileSelector}
              >
                Elegir fotografías
              </button>
            </section>
          ) : (
            <>
              <section className={styles.selectionSummary} aria-live="polite">
                <div>
                  <h3>{selectedCountLabel}</h3>
                  <p>
                    Tamaño original del lote: {formatFileSize(totalSize)}.
                  </p>
                </div>
                <div className={styles.selectionActions}>
                  <button type="button" onClick={openFileSelector}>
                    Añadir más
                  </button>
                  <button type="button" onClick={clearSelection}>
                    Vaciar selección
                  </button>
                </div>
              </section>

              <PhotoSelectionGrid
                photos={photos}
                onPreviewError={markPreviewUnavailable}
                onRemove={removePhoto}
              />
            </>
          )}

          {statusMessage && (
            <p className={styles.statusMessage} role="status" aria-live="polite">
              {statusMessage}
            </p>
          )}

          {showCancelConfirmation && (
            <section
              className={styles.cancelConfirmation}
              role="alertdialog"
              aria-labelledby="cancel-photo-selection-title"
            >
              <div>
                <h3 id="cancel-photo-selection-title">
                  ¿Cancelar la selección?
                </h3>
                <p>
                  Se perderán las fotografías seleccionadas para este lote. No
                  se ha subido ni guardado nada.
                </p>
              </div>
              <div className={styles.confirmActions}>
                <button
                  ref={keepSelectingButtonRef}
                  type="button"
                  onClick={() => setShowCancelConfirmation(false)}
                >
                  Seguir seleccionando
                </button>
                <button
                  className={styles.dangerButton}
                  type="button"
                  onClick={confirmCancel}
                >
                  Cancelar selección
                </button>
              </div>
            </section>
          )}
        </div>

        <footer className={styles.actions}>
          <button type="button" onClick={requestClose}>
            Cancelar
          </button>
          <button
            className={styles.primaryButton}
            type="button"
            disabled={photos.length === 0}
            onClick={announceNextPhase}
          >
            Continuar
          </button>
        </footer>
      </div>
    </div>
  )
}
