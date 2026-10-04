import { useEffect, useRef, type ReactNode } from 'react'
import { CloseIcon } from './Icons'
import styles from './Modal.module.css'

type ModalProps = {
  title: string
  description?: ReactNode
  onClose: () => void
  children: ReactNode
  busy?: boolean
}

function Modal({ title, description, onClose, children, busy = false }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    // no StrictMode o efeito roda 2x e abrir de novo dá erro em alguns navegadores
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal()
    }
  }, [])

  function requestClose() {
    if (!busy) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onCancel={(event) => {
        // não deixa o navegador fechar sozinho no Esc, quem fecha é o estado do react
        event.preventDefault()
        requestClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          requestClose()
        }
      }}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2>{title}</h2>
          <button
            type="button"
            className={styles.close}
            onClick={requestClose}
            disabled={busy}
            aria-label="Fechar"
          >
            <CloseIcon />
          </button>
        </header>
        {description && <div className={styles.description}>{description}</div>}
        {children}
      </div>
    </dialog>
  )
}

export default Modal

export function ModalActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>
}
