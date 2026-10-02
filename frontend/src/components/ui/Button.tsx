import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import styles from './Button.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

type StyleProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  fullWidth?: boolean
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  StyleProps & {
    loading?: boolean
    loadingText?: string
  }

function classNames({ variant = 'secondary', size = 'md', fullWidth }: StyleProps, extra?: string) {
  let classes = `${styles.button} ${styles[variant]} ${styles[size]}`
  if (fullWidth) classes += ` ${styles.fullWidth}`
  if (extra) classes += ` ${extra}`
  return classes
}

export function Button({
  variant,
  size,
  icon,
  fullWidth,
  loading = false,
  loadingText,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classNames({ variant, size, fullWidth }, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className={styles.spinner} /> : icon}
      {loading && loadingText ? loadingText : children}
    </button>
  )
}

type ButtonLinkProps = LinkProps & StyleProps

export function ButtonLink({ variant, size, icon, fullWidth, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={classNames({ variant, size, fullWidth }, className)} {...props}>
      {icon}
      {children}
    </Link>
  )
}
