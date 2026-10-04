import { useState, type FormEvent } from 'react'
import { Button } from '../ui/Button'
import Input, { FormError } from '../ui/Input'
import Modal, { ModalActions } from '../ui/Modal'
import styles from './TimeEditModal.module.css'

type TimeEditModalProps = {
  nomeAtual: string
  onSubmit: (nome: string) => Promise<void>
  onClose: () => void
}

function TimeEditModal({ nomeAtual, onSubmit, onClose }: TimeEditModalProps) {
  const [nome, setNome] = useState(nomeAtual)
  const [nomeError, setNomeError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!nome.trim()) {
      setNomeError('Preencha o nome do time.')
      return
    }

    setNomeError(null)
    setSubmitError(null)
    setLoading(true)

    try {
      await onSubmit(nome.trim())
    } catch (err) {
      setSubmitError((err as Error).message)
      setLoading(false)
    }
  }

  return (
    <Modal title="Editar time" onClose={onClose} busy={loading}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Input
          label="Nome"
          name="nome"
          type="text"
          maxLength={150}
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          error={nomeError}
          disabled={loading}
        />

        {submitError && <FormError>{submitError}</FormError>}

        <ModalActions>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading} loadingText="Salvando...">
            Salvar alterações
          </Button>
        </ModalActions>
      </form>
    </Modal>
  )
}

export default TimeEditModal
