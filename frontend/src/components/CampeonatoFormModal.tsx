import { useState, type FormEvent } from 'react'
import type { CampeonatoCreate } from '../api/campeonatos'
import Modal from './Modal'
import styles from './CampeonatoFormModal.module.css'

type CampeonatoFormModalProps = {
  title: string
  submitLabel: string
  loadingLabel: string
  initialValues?: CampeonatoCreate
  onSubmit: (values: CampeonatoCreate) => Promise<void>
  onClose: () => void
}

type InvalidField = 'nome' | 'data_inicio' | null

function validate(nome: string, dataInicio: string): { message: string; field: InvalidField } | null {
  if (!nome.trim()) {
    return { message: 'Preencha o nome do campeonato.', field: 'nome' }
  }
  if (!dataInicio) {
    return { message: 'Informe a data de início.', field: 'data_inicio' }
  }
  return null
}

function CampeonatoFormModal({
  title,
  submitLabel,
  loadingLabel,
  initialValues,
  onSubmit,
  onClose,
}: CampeonatoFormModalProps) {
  const [nome, setNome] = useState(initialValues?.nome ?? '')
  const [dataInicio, setDataInicio] = useState(initialValues?.data_inicio ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invalidField, setInvalidField] = useState<InvalidField>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validate(nome, dataInicio)
    if (validationError) {
      setError(validationError.message)
      setInvalidField(validationError.field)
      return
    }

    setError(null)
    setInvalidField(null)
    setLoading(true)

    try {
      await onSubmit({ nome: nome.trim(), data_inicio: dataInicio })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o campeonato.')
      setLoading(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose} busy={loading}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.field} htmlFor="campeonato-nome">
          Nome
          <input
            id="campeonato-nome"
            name="nome"
            type="text"
            maxLength={120}
            placeholder="Ex.: Copa da Várzea 2026"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            aria-invalid={invalidField === 'nome'}
            aria-describedby={error ? 'campeonato-form-erro' : undefined}
            disabled={loading}
          />
        </label>

        <label className={styles.field} htmlFor="campeonato-data-inicio">
          Data de início
          <input
            id="campeonato-data-inicio"
            name="data_inicio"
            type="date"
            value={dataInicio}
            onChange={(event) => setDataInicio(event.target.value)}
            aria-invalid={invalidField === 'data_inicio'}
            aria-describedby={error ? 'campeonato-form-erro' : undefined}
            disabled={loading}
          />
        </label>

        {error && (
          <p id="campeonato-form-erro" className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? loadingLabel : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CampeonatoFormModal
