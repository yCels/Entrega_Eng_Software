import { useEffect, useState } from 'react'
import { listarPartidas, type Partida } from '../../api/partidas'
import { Button } from '../ui/Button'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '../ui/Icons'
import { SkeletonLista } from '../ui/Skeleton'
import { useToast } from '../ui/useToast'
import AgendarPartidaModal from './AgendarPartidaModal'
import GerarCalendarioModal from './GerarCalendarioModal'
import styles from './PartidasSection.module.css'

type PartidasSectionProps = {
  campeonatoId: number
  encerrado: boolean
  // a página usa pra atualizar a contagem na faixa de cima
  onCountChange: (count: number) => void
}

function formatarDia(dataHora: string) {
  return new Date(dataHora).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function formatarHora(dataHora: string) {
  return new Date(dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// cada rodada do calendário gerado cai num dia, então agrupar por data separa as rodadas
function agruparPorDia(partidas: Partida[]) {
  const grupos: { dia: string; partidas: Partida[] }[] = []
  for (const partida of partidas) {
    const dia = partida.data_hora.slice(0, 10)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.dia === dia) {
      ultimo.partidas.push(partida)
    } else {
      grupos.push({ dia, partidas: [partida] })
    }
  }
  return grupos
}

function PartidasSection({ campeonatoId, encerrado, onCountChange }: PartidasSectionProps) {
  const [partidas, setPartidas] = useState<Partida[]>([])
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [agendando, setAgendando] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [diaEscolhido, setDiaEscolhido] = useState<string | null>(null)
  const mostrarToast = useToast()

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

  useEffect(() => {
    if (status === 'ready') onCountChange(partidas.length)
  }, [partidas, status, onCountChange])

  function handleRetry() {
    setStatus('loading')
    setReloadKey(reloadKey + 1)
  }

  function handleAgendada(nova: Partida) {
    // mantém a mesma ordem da API: por data e depois por id
    setPartidas((atual) =>
      [...atual, nova].sort((a, b) => a.data_hora.localeCompare(b.data_hora) || a.id - b.id),
    )
    setAgendando(false)
    setDiaEscolhido(nova.data_hora.slice(0, 10))
    mostrarToast('success', 'Partida agendada.')
  }

  function handleGerado(novas: Partida[]) {
    setPartidas(novas)
    setGerando(false)
    setDiaEscolhido(null)
    mostrarToast('success', `Calendário gerado: ${novas.length} partidas.`)
  }

  // sem dia escolhido nas setas, abre no primeiro dia que ainda tem jogo a disputar
  const grupos = agruparPorDia(partidas)
  let indice = grupos.findIndex((g) => g.dia === diaEscolhido)
  if (indice === -1) indice = grupos.findIndex((g) => g.partidas.some((p) => !p.finalizada))
  if (indice === -1) indice = grupos.length - 1
  const grupo = grupos[indice]

  return (
    <section id="partidas" className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Partidas
          {status === 'ready' && <span className={styles.count}>{String(partidas.length).padStart(2, '0')}</span>}
        </h2>
        {status === 'ready' && !encerrado && (
          <div className={styles.acoes}>
            {/* o back só gera o calendário de um campeonato sem partidas */}
            {partidas.length === 0 && (
              <Button variant="secondary" size="sm" onClick={() => setGerando(true)}>
                Gerar calendário
              </Button>
            )}
            <Button variant="primary" size="sm" icon={<PlusIcon />} onClick={() => setAgendando(true)}>
              Agendar partida
            </Button>
          </div>
        )}
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

      {status === 'ready' && grupo && (
        <>
          <div className={styles.navegacao}>
            <Button
              variant="ghost"
              size="sm"
              icon={<ChevronLeftIcon />}
              aria-label="Dia anterior"
              disabled={indice === 0}
              onClick={() => setDiaEscolhido(grupos[indice - 1].dia)}
            />
            <h3 className={styles.dia}>
              {formatarDia(grupo.partidas[0].data_hora)}
              <span className={styles.pagina}>
                {indice + 1} de {grupos.length}
              </span>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              icon={<ChevronRightIcon />}
              aria-label="Próximo dia"
              disabled={indice === grupos.length - 1}
              onClick={() => setDiaEscolhido(grupos[indice + 1].dia)}
            />
          </div>
          <ul className={styles.list}>
            {grupo.partidas.map((partida) => (
              <li key={partida.id} className={styles.row}>
                <div className={styles.quando}>
                  <time className="num" dateTime={partida.data_hora}>
                    {formatarHora(partida.data_hora)}
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
        </>
      )}

      {agendando && (
        <AgendarPartidaModal
          campeonatoId={campeonatoId}
          partidas={partidas}
          onAgendada={handleAgendada}
          onClose={() => setAgendando(false)}
        />
      )}

      {gerando && (
        <GerarCalendarioModal
          campeonatoId={campeonatoId}
          onGerado={handleGerado}
          onClose={() => setGerando(false)}
        />
      )}
    </section>
  )
}

export default PartidasSection
