import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import styles from './Input.module.css'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  // esconde só da tela, o leitor de tela ainda lê
  hideLabel?: boolean
  error?: string | null
  icon?: ReactNode
}

function Input({ label, hideLabel = false, error, icon, id, className, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className={className ? `${styles.field} ${className}` : styles.field}>
      <label htmlFor={inputId} className={hideLabel ? 'visually-hidden' : styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input
          id={inputId}
          className={icon ? `${styles.input} ${styles.withIcon}` : styles.input}
          // o css usa isso pra deixar a borda vermelha
          aria-invalid={error ? true : undefined}
          {...props}
        />
      </div>
      {error && (
        <p className={styles.error}>{error}</p>
      )}
    </div>
  )
}

export default Input

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p className={styles.formError} role="alert">
      {children}
    </p>
  )
}
