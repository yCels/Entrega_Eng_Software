import type { MouseEvent } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { MoonIcon, SunIcon } from './Icons'
import styles from './ThemeToggle.module.css'

type ThemeToggleProps = {
  withLabel?: boolean
}

function ThemeToggle({ withLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const actionLabel = isDark ? 'Ativar tema claro' : 'Ativar tema escuro'

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    // usa o centro do botão pra funcionar também pelo teclado
    const rect = event.currentTarget.getBoundingClientRect()
    toggleTheme(rect.left + rect.width / 2, rect.top + rect.height / 2)
  }

  return (
    <button
      type="button"
      className={withLabel ? `${styles.toggle} ${styles.withLabel}` : styles.toggle}
      onClick={handleClick}
      aria-label={withLabel ? undefined : actionLabel}
      title={withLabel ? undefined : actionLabel}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      {withLabel && <span>{isDark ? 'Tema claro' : 'Tema escuro'}</span>}
    </button>
  )
}

export default ThemeToggle
