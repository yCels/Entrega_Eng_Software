import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearToken } from '../api/auth'
import { listar, type Campeonato } from '../api/campeonatos'
import FieldPattern from '../components/FieldPattern'
import styles from './Campeonatos.module.css'

type LoadStatus = 'loading' | 'error' | 'ready'

const SKELETON_CARDS = 4

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

  const sortedCampeonatos = useMemo(() => sortCampeonatos(campeonatos), [campeonatos])
  const emAndamento = campeonatos.filter((campeonato) => !campeonato.encerrado).length
  const encerrados = campeonatos.length - emAndamento

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
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default Campeonatos
