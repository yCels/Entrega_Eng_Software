import styles from './CampeonatosPlacar.module.css'

export type PlacarItem = {
  label: string
  // fica null enquanto carrega, aí mostra --
  value: number | null
  onClick?: () => void
  active?: boolean
}

type CampeonatosPlacarProps = {
  items: PlacarItem[]
}

function CampeonatosPlacar({ items }: CampeonatosPlacarProps) {
  return (
    <div className={styles.placar}>
      {items.map((item) => {
        const content = (
          <>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.value}>{item.value === null ? '--' : String(item.value).padStart(2, '0')}</span>
          </>
        )

        if (!item.onClick) {
          return (
            <div key={item.label} className={styles.cell}>
              {content}
            </div>
          )
        }

        return (
          <button
            key={item.label}
            type="button"
            className={`${styles.cell} ${styles.clickable}`}
            aria-pressed={item.active}
            onClick={item.onClick}
          >
            {content}
          </button>
        )
      })}
    </div>
  )
}

export default CampeonatosPlacar
