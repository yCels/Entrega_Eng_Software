import { useEffect, useState } from 'react'
import {
  criar,
  editar,
  excluir,
  listar,
  type Campeonato,
  type CampeonatoCreate,
} from '../api/campeonatos'
import CampeonatoFormModal from '../components/campeonatos/CampeonatoFormModal'
import CampeonatosPlacar, { type PlacarItem } from '../components/campeonatos/CampeonatosPlacar'
import CampeonatosTable from '../components/campeonatos/CampeonatosTable'
import { Button } from '../components/ui/Button'
import { PlusIcon, SearchIcon } from '../components/ui/Icons'
import Input, { FormError } from '../components/ui/Input'
import Modal, { ModalActions } from '../components/ui/Modal'
import { filterCampeonatos } from '../utils/campeonatos'
import styles from './Campeonatos.module.css'

type LoadStatus = 'loading' | 'error' | 'ready'
type StatusFilter = 'todos' | 'andamento' | 'encerrados'
type FormState = { mode: 'create' | 'edit'; campeonato?: Campeonato }
type ToastMessage = { type: 'success' | 'error'; message: string }

const TOAST_DURATION_MS = 3500

const LIST_TITLES = {
  todos: 'Todos os campeonatos',
  andamento: 'Em andamento',
  encerrados: 'Encerrados',
}

function Campeonatos() {
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
  const [search, setSearch] = useState('')

  const [formState, setFormState] = useState<FormState | null>(null)
  const [busyIds, setBusyIds] = useState<number[]>([])
  const [toDelete, setToDelete] = useState<Campeonato | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [toast, setToast] = useState<ToastMessage | null>(null)

  useEffect(() => {
    listar()
      .then((data) => {
        setCampeonatos(data)
        setStatus('ready')
      })
      .catch((err: Error) => {
        setLoadError(err.message)
        setStatus('error')
      })
  }, [reloadKey])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [toast])

  const emAndamento = campeonatos.filter((campeonato) => !campeonato.encerrado).length
  const encerrados = campeonatos.length - emAndamento

  const visibleCampeonatos = filterCampeonatos(campeonatos, statusFilter, search)

  const totalTimes = campeonatos.reduce((total, campeonato) => total + (campeonato.total_times ?? 0), 0)
  const totalPartidas = campeonatos.reduce((total, campeonato) => total + (campeonato.total_partidas ?? 0), 0)

  // os 3 primeiros blocos do placar também filtram a lista
  const loaded = status === 'ready'
  const placarItems: PlacarItem[] = [
    {
      label: 'Campeonatos',
      value: loaded ? campeonatos.length : null,
      active: statusFilter === 'todos',
      onClick: () => setStatusFilter('todos'),
    },
    {
      label: 'Em andamento',
      value: loaded ? emAndamento : null,
      active: statusFilter === 'andamento',
      onClick: () => setStatusFilter('andamento'),
    },
    {
      label: 'Encerrados',
      value: loaded ? encerrados : null,
      active: statusFilter === 'encerrados',
      onClick: () => setStatusFilter('encerrados'),
    },
    { label: 'Times', value: loaded ? totalTimes : null },
    { label: 'Partidas', value: loaded ? totalPartidas : null },
  ]

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
  }

  function replaceCampeonato(updated: Campeonato) {
    setCampeonatos((current) =>
      current.map((campeonato) => (campeonato.id === updated.id ? updated : campeonato)),
    )
  }

  async function handleFormSubmit(values: CampeonatoCreate) {
    if (formState?.campeonato) {
      const updated = await editar(formState.campeonato.id, values)
      replaceCampeonato(updated)
      showToast('success', 'Campeonato atualizado.')
    } else {
      const created = await criar(values)
      setCampeonatos((current) => [...current, created])
      showToast('success', 'Campeonato criado.')
    }
    setFormState(null)
  }

  async function handleToggleEncerrado(campeonato: Campeonato) {
    setBusyIds((current) => [...current, campeonato.id])

    try {
      const updated = await editar(campeonato.id, { encerrado: !campeonato.encerrado })
      replaceCampeonato(updated)
      showToast('success', updated.encerrado ? 'Campeonato encerrado.' : 'Campeonato reaberto.')
    } catch (err) {
      showToast('error', (err as Error).message)
    } finally {
      setBusyIds((current) => current.filter((id) => id !== campeonato.id))
    }
  }

  async function handleConfirmDelete() {
    if (!toDelete) return

    setDeleting(true)
    setDeleteError(null)

    try {
      await excluir(toDelete.id)
      setCampeonatos((current) => current.filter((campeonato) => campeonato.id !== toDelete.id))
      setToDelete(null)
      showToast('success', 'Campeonato excluído.')
    } catch (err) {
      setDeleteError((err as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  function handleRetry() {
    setStatus('loading')
    setLoadError(null)
    setReloadKey(reloadKey + 1)
  }

  const openCreateForm = () => setFormState({ mode: 'create' })
  const hasData = status === 'ready' && campeonatos.length > 0

  return (
    <>
      <header className={styles.header}>
        <h1>Campeonatos</h1>
        <Button variant="primary" icon={<PlusIcon />} onClick={openCreateForm} disabled={status !== 'ready'}>
          Novo campeonato
        </Button>
      </header>

      <CampeonatosPlacar items={placarItems} />

      {status === 'loading' && (
        <div className={`${styles.panel} ${styles.state}`}>
          <p className={styles.panelText} role="status">
            Carregando...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className={`${styles.panel} ${styles.state}`} role="alert">
          <h2 className={styles.errorTitle}>Não foi possível carregar</h2>
          <p className={styles.panelText}>{loadError}</p>
          <Button variant="secondary" onClick={handleRetry}>
            Tentar novamente
          </Button>
        </div>
      )}

      {status === 'ready' && campeonatos.length === 0 && (
        <div className={`${styles.panel} ${styles.state}`}>
          <h2>Nenhum campeonato ainda</h2>
          <p className={styles.panelText}>
            Crie seu primeiro campeonato para começar a cadastrar times e partidas.
          </p>
          <Button variant="primary" icon={<PlusIcon />} onClick={openCreateForm}>
            Criar campeonato
          </Button>
        </div>
      )}

      {hasData && (
        <div className={styles.panel}>
          <div className={styles.listHeader}>
            <h2 className={styles.listTitle}>
              {LIST_TITLES[statusFilter]}
              <span className={styles.listCount}>{String(visibleCampeonatos.length).padStart(2, '0')}</span>
            </h2>
            <Input
              className={styles.search}
              label="Buscar campeonato por nome"
              hideLabel
              type="search"
              placeholder="Buscar por nome"
              icon={<SearchIcon size={15} />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {visibleCampeonatos.length > 0 ? (
            <CampeonatosTable
              campeonatos={visibleCampeonatos}
              busyIds={busyIds}
              onEdit={(campeonato) => setFormState({ mode: 'edit', campeonato })}
              onToggleEncerrado={handleToggleEncerrado}
              onDelete={(campeonato) => {
                setDeleteError(null)
                setToDelete(campeonato)
              }}
            />
          ) : (
            <div className={styles.state}>
              <h2>Nenhum campeonato encontrado</h2>
              <p className={styles.panelText}>Tente outro nome ou mude o filtro de status.</p>
              <Button
                variant="secondary"
                onClick={() => {
                  setStatusFilter('todos')
                  setSearch('')
                }}
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      )}

      {formState && (
        <CampeonatoFormModal
          key={formState.campeonato?.id ?? 'novo'}
          mode={formState.mode}
          initialValues={formState.campeonato}
          onSubmit={handleFormSubmit}
          onClose={() => setFormState(null)}
        />
      )}

      {toDelete && (
        <Modal
          title="Excluir campeonato"
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

      {toast && (
        <p className={toast.type === 'error' ? `${styles.toast} ${styles.toastError}` : styles.toast} role="status">
          {toast.message}
        </p>
      )}
    </>
  )
}

export default Campeonatos
