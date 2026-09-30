import { useEffect, useId, useRef, type MouseEvent, type ReactNode, type SyntheticEvent } from 'react'
import styles from './Modal.module.css'

type ModalProps = {
  title: string
  onClose: () => void
  children: ReactNode
  // Impede fechar (Esc ou clique fora) enquanto uma ação está em andamento.
  busy?: boolean
}

function Modal({ title, onClose, children, busy = false }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null

    if (dialog && !dialog.open) {
      dialog.showModal()
    }

    return () => {
      previouslyFocused?.focus()
    }
  }, [])

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    // O Esc dispara "cancel"; controlamos o fechamento pelo estado do React.
    event.preventDefault()
    if (!busy) {
      onClose()
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget && !busy) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className={styles.body}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  )
}

export default Modal
