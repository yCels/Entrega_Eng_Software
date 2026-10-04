import styles from './StatusIndicator.module.css'

type StatusIndicatorProps = {
  encerrado: boolean
}

function StatusIndicator({ encerrado }: StatusIndicatorProps) {
  return (
    <span className={`${styles.status} ${encerrado ? styles.closed : styles.open}`}>
      <span className={styles.dot} />
      {encerrado ? 'Encerrado' : 'Em andamento'}
    </span>
  )
}

export default StatusIndicator
