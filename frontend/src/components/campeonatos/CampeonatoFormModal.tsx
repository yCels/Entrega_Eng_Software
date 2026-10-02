import { useState, type FormEvent } from 'react'
import type { CampeonatoCreate } from '../../api/campeonatos'
import { Button } from '../ui/Button'
import Input, { FormError } from '../ui/Input'
import Modal, { ModalActions } from '../ui/Modal'
import styles from './CampeonatoFormModal.module.css'

type CampeonatoFormModalProps = {
  mode: 'create' | 'edit'
  initialValues?: CampeonatoCreate
  onSubmit: (values: CampeonatoCreate) => Promise<void>
  onClose: () => void
}

type FieldErrors = { nome?: string; data_inicio?: string }

function validate(nome: string, dataInicio: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!nome.trim()) {
    errors.nome = 'Preencha o nome do campeonato.'
  }
  if (!dataInicio) {
    errors.data_inicio = 'Informe a data de início.'
  }
  return errors
}

function CampeonatoFormModal({ mode, initialValues, onSubmit, onClose }: CampeonatoFormModalProps) {
  const [nome, setNome] = useState(initialValues?.nome ?? '')
  const [dataInicio, setDataInicio] = useState(initialValues?.data_inicio ?? '')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isEdit = mode === 'edit'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validate(nome, dataInicio)
    setFieldErrors(errors)
    if (errors.nome || errors.data_inicio) {
      return
    }

    setSubmitError(null)
    setLoading(true)

    try {
      await onSubmit({ nome: nome.trim(), data_inicio: dataInicio })
    } catch (err) {
      setSubmitError((err as Error).message)
      setLoading(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Editar campeonato' : 'Novo campeonato'} onClose={onClose} busy={loading}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Input
          label="Nome"
          name="nome"
          type="text"
          maxLength={120}
          placeholder="Ex.: Copa da Várzea 2026"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          error={fieldErrors.nome}
          disabled={loading}
        />

        <Input
          label="Data de início"
          name="data_inicio"
          type="date"
          value={dataInicio}
          onChange={(event) => setDataInicio(event.target.value)}
          error={fieldErrors.data_inicio}
          disabled={loading}
        />

        {submitError && <FormError>{submitError}</FormError>}

        <ModalActions>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            loadingText={isEdit ? 'Salvando...' : 'Criando...'}
          >
            {isEdit ? 'Salvar alterações' : 'Criar campeonato'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  )
}

export default CampeonatoFormModal
