import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import FieldPattern from '../components/FieldPattern'
import Brand from '../components/ui/Brand'
import { ArrowLeftIcon } from '../components/ui/Icons'
import ThemeToggle from '../components/ui/ThemeToggle'
import styles from './AuthLayout.module.css'

type AuthLayoutProps = {
  children: ReactNode
  showBack?: boolean
  withPattern?: boolean
}

function AuthLayout({ children, showBack = false, withPattern = false }: AuthLayoutProps) {
  return (
    <div className={styles.page}>
      {withPattern && <FieldPattern className={styles.pattern} />}

      <header className={styles.topBar}>
        {showBack ? (
          <Link to="/" className={styles.backLink}>
            <ArrowLeftIcon size={14} />
            Voltar
          </Link>
        ) : (
          // span vazio só pra segurar o botão de tema na direita
          <span />
        )}
        <ThemeToggle />
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>NEXUM · FATEC SJC · 2026</footer>
    </div>
  )
}

export default AuthLayout

type AuthCardProps = {
  title: string
  subtitle: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  children: ReactNode
  footer: ReactNode
}

export function AuthCard({ title, subtitle, onSubmit, children, footer }: AuthCardProps) {
  return (
    <div className={styles.wrapper}>
      <Brand />
      <form className={styles.card} onSubmit={onSubmit} noValidate>
        <div className={styles.cardHeader}>
          <h1>{title}</h1>
          <p className={styles.cardSubtitle}>{subtitle}</p>
        </div>
        {children}
        <p className={styles.switchText}>{footer}</p>
      </form>
    </div>
  )
}
