import styles from './Skeleton.module.css'

type SkeletonProps = {
  width?: number | string
  height?: number
  className?: string
}

// bloco cinza com brilho que ocupa o lugar do conteúdo enquanto carrega
export function Skeleton({ width = '100%', height = 14, className }: SkeletonProps) {
  return (
    <span
      className={className ? `${styles.skeleton} ${className}` : styles.skeleton}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

const LARGURAS = ['55%', '40%', '65%', '48%']

type SkeletonListaProps = {
  linhas?: number
}

export function SkeletonLista({ linhas = 4 }: SkeletonListaProps) {
  return (
    <div className={styles.lista} role="status">
      <span className="visually-hidden">Carregando...</span>
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className={styles.linha}>
          <Skeleton width={LARGURAS[i % LARGURAS.length]} />
          <Skeleton width={32} />
        </div>
      ))}
    </div>
  )
}
