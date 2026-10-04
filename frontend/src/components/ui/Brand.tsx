import styles from './Brand.module.css'

type BrandProps = {
  size?: 'md' | 'lg'
}

function Brand({ size = 'md' }: BrandProps) {
  return (
    <span className={size === 'lg' ? `${styles.brand} ${styles.lg}` : styles.brand}>
      {/* mesmo desenho do public/logo.svg, mas inline pra cor do N seguir o tema */}
      <svg className={styles.mark} viewBox="0 0 100 100" aria-hidden="true">
        <rect width="100" height="100" rx="18" className={styles.markBg} />
        <g stroke="currentColor" strokeWidth="9.5" strokeLinecap="round">
          <line x1="23" y1="21" x2="23" y2="80" />
          <line x1="77" y1="21" x2="77" y2="80" />
          <line x1="23" y1="21" x2="77" y2="80" />
        </g>
        <circle cx="50" cy="50.5" r="7" className={styles.markBg} />
        <circle cx="50" cy="50.5" r="4.5" fill="currentColor" />
      </svg>
      <span className={styles.name}>Nexum</span>
    </span>
  )
}

export default Brand
