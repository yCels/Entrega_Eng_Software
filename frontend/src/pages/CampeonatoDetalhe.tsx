import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obter, type Campeonato } from '../api/campeonatos'
import { Button } from '../components/ui/Button'
import { ArrowLeftIcon } from '../components/ui/Icons'
import StatusIndicator from '../components/ui/StatusIndicator'
import { formatDate } from '../utils/campeonatos'
import styles from './CampeonatoDetalhe.module.css'

function CampeonatoDetalhe() {
  const { id } = useParams()
  const campeonatoId = Number(id)
  const [campeonato, setCampeonato] = useState<Campeonato | null>(null)
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    obter(campeonatoId)
      .then((data) => {
        setCampeonato(data)
        setStatus('ready')
      })
      .catch((err: Error) => {
        setLoadError(err.message)
        setStatus('error')
      })
  }, [campeonatoId, reloadKey])

  function handleRetry() {
    setStatus('loading')
    setReloadKey(reloadKey + 1)
  }

  return (
    <>
      <Link to="/campeonatos" className={styles.backLink}>
        <ArrowLeftIcon size={14} />
        Voltar para campeonatos
      </Link>

      {status === 'loading' && (
        <div className={styles.panel}>
          <p className={styles.panelText} role="status">
            Carregando...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.panel} role="alert">
          <h2 className={styles.errorTitle}>{loadError}</h2>
          <p className={styles.panelText}>
            Verifique se o campeonato ainda existe ou tente carregar de novo.
          </p>
          <Button variant="secondary" onClick={handleRetry}>
            Tentar novamente
          </Button>
        </div>
      )}

      {status === 'ready' && campeonato && (
        <>
          <h1 className={styles.title}>{campeonato.nome}</h1>

          <dl className={styles.summary}>
            <div className={styles.stat}>
              <dt>Início</dt>
              <dd>
                <time className="num" dateTime={campeonato.data_inicio}>
                  {formatDate(campeonato.data_inicio)}
                </time>
              </dd>
            </div>
            <div className={styles.stat}>
              <dt>Status</dt>
              <dd>
                <StatusIndicator encerrado={campeonato.encerrado} />
              </dd>
            </div>
            <div className={styles.stat}>
              <dt>Times</dt>
              <dd className="num">{String(campeonato.total_times ?? 0).padStart(2, '0')}</dd>
            </div>
            <div className={styles.stat}>
              <dt>Partidas</dt>
              <dd className="num">{String(campeonato.total_partidas ?? 0).padStart(2, '0')}</dd>
            </div>
          </dl>
        </>
      )}
    </>
  )
}

export default CampeonatoDetalhe
