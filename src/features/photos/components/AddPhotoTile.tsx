import styles from './AddPhotoTile.module.css'

type AddPhotoTileProps = {
  disabled?: boolean
  onClick: () => void
}

export function AddPhotoTile({ disabled = false, onClick }: AddPhotoTileProps) {
  return (
    <button
      className={styles.tile}
      type="button"
      disabled={disabled}
      aria-label="Añadir más fotografías"
      onClick={onClick}
    >
      <span aria-hidden="true">+</span>
      <small>Añadir</small>
    </button>
  )
}
