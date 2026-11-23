import { useEffect, useState } from 'react'
import { listarPartidas, type Partida } from '../../api/partidas'
import { Button } from '../ui/Button'
import { SkeletonLista } from '../ui/Skeleton'
import styles from './PartidasSection.module.css'

type PartidasSectionProps = {
  campeonatoId: number
}

function formatarData(dataHora: string) {
  return new Date(dataHora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatarHora(dataHora: string) {
  return new Date(dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function PartidasSection({ campeonatoId }: PartidasSectionProps) {
  const [partidas, setPartidas] = useState<Partida[]>([])
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    listarPartidas(campeonatoId)
      .then((data) => {
        setPartidas(data)
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
    <section id="partidas" className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Partidas
          {status === 'ready' && <span className={styles.count}>{String(partidas.length).padStart(2, '0')}</span>}
        </h2>
      </div>

      {status === 'loading' && <SkeletonLista linhas={3} />}

      {status === 'error' && (
        <div className={styles.state} role="alert">
          <h3 className={styles.errorTitle}>Não foi possível carregar as partidas</h3>
          <p className={styles.stateText}>{loadError}</p>
          <Button variant="secondary" onClick={handleRetry}>
            Tentar novamente
          </Button>
        </div>
      )}

      {status === 'ready' && partidas.length === 0 && (
        <div className={styles.state}>
          <p className={styles.stateText}>Nenhuma partida agendada ainda</p>
        </div>
      )}

      {status === 'ready' && partidas.length > 0 && (
        <ul className={styles.list}>
          {partidas.map((partida) => (
            <li key={partida.id} className={styles.row}>
              <div className={styles.quando}>
                <time className="num" dateTime={partida.data_hora}>
                  {formatarData(partida.data_hora)} · {formatarHora(partida.data_hora)}
                </time>
                <span className={styles.local}>{partida.local}</span>
              </div>

              <div className={styles.confronto}>
                <span className={styles.mandante}>{partida.time_mandante_nome}</span>
                <span className={`num ${styles.placar}`}>
                  {partida.finalizada ? `${partida.gols_mandante} - ${partida.gols_visitante}` : 'x'}
                </span>
                <span className={styles.visitante}>{partida.time_visitante_nome}</span>
              </div>

              <span className={partida.finalizada ? `${styles.status} ${styles.finalizada}` : styles.status}>
                {partida.finalizada ? 'Finalizada' : 'Agendada'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default PartidasSection
