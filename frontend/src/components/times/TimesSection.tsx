import { useEffect, useRef, useState, type FormEvent } from 'react'
import { criar, editar, excluir, listar, type Time } from '../../api/times'
import ActionMenu from '../ui/ActionMenu'
import { Button } from '../ui/Button'
import { PlusIcon } from '../ui/Icons'
import Input, { FormError } from '../ui/Input'
import Modal, { ModalActions } from '../ui/Modal'
import TimeEditModal from './TimeEditModal'
import styles from './TimesSection.module.css'

type TimesSectionProps = {
  campeonatoId: number
  // a página usa pra mostrar a contagem na faixa de cima
  onCountChange: (count: number) => void
}

function TimesSection({ campeonatoId, onCountChange }: TimesSectionProps) {
  const [times, setTimes] = useState<Time[]>([])
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [novoNome, setNovoNome] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [toEdit, setToEdit] = useState<Time | null>(null)
  const [toDelete, setToDelete] = useState<Time | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    listar(campeonatoId)
      .then((data) => {
        setTimes(data)
        setStatus('ready')
      })
      .catch((err: Error) => {
        setLoadError(err.message)
        setStatus('error')
      })
  }, [campeonatoId, reloadKey])

  useEffect(() => {
    if (status === 'ready') onCountChange(times.length)
  }, [times, status, onCountChange])

  function handleRetry() {
    setStatus('loading')
    setReloadKey(reloadKey + 1)
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!novoNome.trim()) {
      setAddError('Preencha o nome do time.')
      inputRef.current?.focus()
      return
    }

    setAddError(null)
    setAdding(true)

    try {
      const time = await criar(campeonatoId, novoNome.trim())
      setTimes((current) => [...current, time])
      setNovoNome('')
    } catch (err) {
      setAddError((err as Error).message)
    } finally {
      setAdding(false)
      inputRef.current?.focus()
    }
  }

  async function handleEdit(nome: string) {
    if (!toEdit) return
    const updated = await editar(toEdit.id, nome)
    setTimes((current) => current.map((time) => (time.id === updated.id ? updated : time)))
    setToEdit(null)
  }

  async function handleConfirmDelete() {
    if (!toDelete) return

    setDeleting(true)
    setDeleteError(null)

    try {
      await excluir(toDelete.id)
      setTimes((current) => current.filter((time) => time.id !== toDelete.id))
      setToDelete(null)
    } catch (err) {
      setDeleteError((err as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Times
          {status === 'ready' && <span className={styles.count}>{String(times.length).padStart(2, '0')}</span>}
        </h2>
      </div>

      {status === 'ready' && (
        <form className={styles.addForm} onSubmit={handleAdd} noValidate>
          <Input
            ref={inputRef}
            className={styles.addInput}
            label="Nome do novo time"
            hideLabel
            type="text"
            maxLength={150}
            placeholder="Nome do time"
            value={novoNome}
            onChange={(event) => setNovoNome(event.target.value)}
            error={addError}
          />
          <Button type="submit" variant="primary" icon={<PlusIcon />} loading={adding} loadingText="Adicionando...">
            Adicionar time
          </Button>
        </form>
      )}

      {status === 'loading' && (
        <div className={styles.state}>
          <p className={styles.stateText} role="status">
            Carregando...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.state} role="alert">
          <h3 className={styles.errorTitle}>Não foi possível carregar os times</h3>
          <p className={styles.stateText}>{loadError}</p>
          <Button variant="secondary" onClick={handleRetry}>
            Tentar novamente
          </Button>
        </div>
      )}

      {status === 'ready' && times.length === 0 && (
        <div className={styles.state}>
          <p className={styles.stateText}>Nenhum time cadastrado ainda</p>
        </div>
      )}

      {status === 'ready' && times.length > 0 && (
        <ul className={styles.list}>
          {times.map((time) => (
            <li key={time.id} className={styles.row}>
              <span className={styles.name}>{time.nome}</span>
              <ActionMenu
                label={`Ações de ${time.nome}`}
                items={[
                  { label: 'Editar', onSelect: () => setToEdit(time) },
                  {
                    label: 'Excluir',
                    danger: true,
                    onSelect: () => {
                      setDeleteError(null)
                      setToDelete(time)
                    },
                  },
                ]}
              />
            </li>
          ))}
        </ul>
      )}

      {toEdit && (
        <TimeEditModal nomeAtual={toEdit.nome} onSubmit={handleEdit} onClose={() => setToEdit(null)} />
      )}

      {toDelete && (
        <Modal
          title="Excluir time"
          description={
            <>
              Tem certeza que deseja excluir <strong>{toDelete.nome}</strong>? Esta ação não pode ser
              desfeita.
            </>
          }
          onClose={() => setToDelete(null)}
          busy={deleting}
        >
          {deleteError && <FormError>{deleteError}</FormError>}
          <ModalActions>
            <Button variant="secondary" onClick={() => setToDelete(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={deleting} loadingText="Excluindo...">
              Excluir
            </Button>
          </ModalActions>
        </Modal>
      )}
    </section>
  )
}

export default TimesSection
