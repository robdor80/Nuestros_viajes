import styles from './ComingSoonPage.module.css'

type ComingSoonPageProps = {
  eyebrow: string
  title: string
  description: string
  children?: React.ReactNode
}

export function ComingSoonPage({
  eyebrow,
  title,
  description,
  children,
}: ComingSoonPageProps) {
  return (
    <div className={styles.page}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      {children}
    </div>
  )
}
