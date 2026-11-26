import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type TipoToast } from './useToast'
import styles from './ToastProvider.module.css'

const DURACAO_MS = 3500

type Toast = { id: number; tipo: TipoToast; mensagem: string }

function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const ref = useRef<HTMLParagraphElement>(null)

  const mostrarToast = useCallback((tipo: TipoToast, mensagem: string) => {
    setToast({ id: Date.now(), tipo, mensagem })
  }, [])

  useEffect(() => {
    if (!toast) return
    // popover coloca o toast na camada de cima, senão ele fica atrás dos modais
    ref.current?.showPopover()
    const timer = setTimeout(() => setToast(null), DURACAO_MS)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={mostrarToast}>
      {children}
      {toast && (
        <p
          key={toast.id}
          ref={ref}
          popover="manual"
          role="status"
          className={toast.tipo === 'error' ? `${styles.toast} ${styles.erro}` : styles.toast}
        >
          {toast.mensagem}
        </p>
      )}
    </ToastContext.Provider>
  )
}

export default ToastProvider
