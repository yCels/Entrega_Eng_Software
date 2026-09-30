import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearToken } from '../api/auth'
import {
  criar,
  editar,
  listar,
  type Campeonato,
  type CampeonatoCreate,
} from '../api/campeonatos'
import CampeonatoFormModal from '../components/CampeonatoFormModal'
import FieldPattern from '../components/FieldPattern'
import styles from './Campeonatos.module.css'

type LoadStatus = 'loading' | 'error' | 'ready'

type FormState = { mode: 'create' } | { mode: 'edit'; campeonato: Campeonato } | null

type Feedback = { id: number; type: 'success' | 'error'; message: string }

const SKELETON_CARDS = 4
const FEEDBACK_DURATION_MS = 3500

// Monta a data pelas partes para não deslocar o dia por causa do fuso horário.
function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR')
}

function sortCampeonatos(campeonatos: Campeonato[]): Campeonato[] {
  return [...campeonatos].sort(
    (a, b) =>
      Number(a.encerrado) - Number(b.encerrado) || b.data_inicio.localeCompare(a.data_inicio),
  )
}

function Campeonatos() {
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [formState, setFormState] = useState<FormState>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    listar()
      .then((data) => {
        if (!active) return
        setCampeonatos(data)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (!active) return
        setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar os campeonatos.')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), FEEDBACK_DURATION_MS)
    return () => clearTimeout(timer)
  }, [feedback])

  const sortedCampeonatos = useMemo(() => sortCampeonatos(campeonatos), [campeonatos])
  const emAndamento = campeonatos.filter((campeonato) => !campeonato.encerrado).length
  const encerrados = campeonatos.length - emAndamento

  function showFeedback(type: Feedback['type'], message: string) {
    setFeedback({ id: Date.now(), type, message })
  }

  function replaceCampeonato(updated: Campeonato) {
    setCampeonatos((current) =>
      current.map((campeonato) => (campeonato.id === updated.id ? updated : campeonato)),
    )
  }

  async function handleFormSubmit(values: CampeonatoCreate) {
    if (formState?.mode === 'edit') {
      const updated = await editar(formState.campeonato.id, values)
      replaceCampeonato(updated)
      showFeedback('success', 'Campeonato atualizado.')
    } else {
      const created = await criar(values)
      setCampeonatos((current) => [...current, created])
      showFeedback('success', 'Campeonato criado.')
    }
    setFormState(null)
  }

  function handleRetry() {
    setStatus('loading')
    setLoadError(null)
    setReloadKey((key) => key + 1)
  }

  function handleLogout() {
    clearToken()
    navigate('/login')
  }

  return (
    <section className={styles.campeonatos}>
      <FieldPattern className={styles.pattern} />

      <header className={styles.topBar}>
        <span className={styles.brand}>
          Ne<span className={styles.brandX}>x</span>um
        </span>
        <button type="button" className={styles.logoutButton} onClick={handleLogout}>
          Sair
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Meus campeonatos</h1>
            {status === 'ready' && campeonatos.length > 0 && (
              <p className={styles.summary}>
                {emAndamento} em andamento · {encerrados}{' '}
                {encerrados === 1 ? 'encerrado' : 'encerrados'}
              </p>
            )}
          </div>
          {status === 'ready' && campeonatos.length > 0 && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setFormState({ mode: 'create' })}
            >
              + Novo campeonato
            </button>
          )}
        </div>

        {status === 'loading' && (
          <ul className={styles.list} aria-busy="true" aria-label="Carregando campeonatos">
            {Array.from({ length: SKELETON_CARDS }, (_, index) => (
              <li key={index} className={`${styles.card} ${styles.skeletonCard}`} aria-hidden="true">
                <span className={`${styles.skeleton} ${styles.skeletonBadge}`} />
                <span className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                <span className={`${styles.skeleton} ${styles.skeletonText}`} />
              </li>
            ))}
          </ul>
        )}

        {status === 'error' && (
          <div className={styles.stateBox} role="alert">
            <h2>Algo deu errado</h2>
            <p>{loadError}</p>
            <button type="button" className={styles.primaryButton} onClick={handleRetry}>
              Tentar novamente
            </button>
          </div>
        )}

        {status === 'ready' && campeonatos.length === 0 && (
          <div className={styles.stateBox}>
            <h2>Nenhum campeonato por aqui ainda</h2>
            <p>Crie seu primeiro campeonato para começar a organizar times e partidas.</p>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setFormState({ mode: 'create' })}
            >
              Criar primeiro campeonato
            </button>
          </div>
        )}

        {status === 'ready' && campeonatos.length > 0 && (
          <ul className={styles.list}>
            {sortedCampeonatos.map((campeonato) => (
              <li key={campeonato.id} className={styles.card}>
                <span
                  className={`${styles.badge} ${
                    campeonato.encerrado ? styles.badgeClosed : styles.badgeOpen
                  }`}
                >
                  {campeonato.encerrado ? 'Encerrado' : 'Em andamento'}
                </span>
                <h2 className={styles.cardTitle}>{campeonato.nome}</h2>
                <p className={styles.cardDate}>
                  Início:{' '}
                  <time dateTime={campeonato.data_inicio}>{formatDate(campeonato.data_inicio)}</time>
                </p>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => setFormState({ mode: 'edit', campeonato })}
                    aria-label={`Editar ${campeonato.nome}`}
                  >
                    Editar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {formState && (
        <CampeonatoFormModal
          key={formState.mode === 'edit' ? formState.campeonato.id : 'novo'}
          title={formState.mode === 'edit' ? 'Editar campeonato' : 'Novo campeonato'}
          submitLabel={formState.mode === 'edit' ? 'Salvar alterações' : 'Criar campeonato'}
          loadingLabel={formState.mode === 'edit' ? 'Salvando...' : 'Criando...'}
          initialValues={
            formState.mode === 'edit'
              ? { nome: formState.campeonato.nome, data_inicio: formState.campeonato.data_inicio }
              : undefined
          }
          onSubmit={handleFormSubmit}
          onClose={() => setFormState(null)}
        />
      )}

      <div className={styles.feedbackRegion} role="status" aria-live="polite">
        {feedback && (
          <p
            key={feedback.id}
            className={`${styles.feedback} ${
              feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess
            }`}
          >
            {feedback.message}
          </p>
        )}
      </div>
    </section>
  )
}

export default Campeonatos
