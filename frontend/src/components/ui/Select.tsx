import { useId, type SelectHTMLAttributes } from 'react'
import styles from './Input.module.css'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string | null
}

// mesmo visual do Input, só que com <select>
function Select({ label, error, id, className, children, ...props }: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className={className ? `${styles.field} ${className}` : styles.field}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
      </label>
      <select id={selectId} className={styles.input} aria-invalid={error ? true : undefined} {...props}>
        {children}
      </select>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}

export default Select
