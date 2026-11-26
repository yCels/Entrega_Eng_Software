import { useEffect, useState } from 'react'
import {
  excluirPartida,
  finalizarPartida,
  listarPartidas,
  reabrirPartida,
  type Partida,
} from '../../api/partidas'
import ActionMenu from '../ui/ActionMenu'
import { Button } from '../ui/Button'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '../ui/Icons'
import { FormError } from '../ui/Input'
import Modal, { ModalActions } from '../ui/Modal'
import { SkeletonLista } from '../ui/Skeleton'
import { useToast } from '../ui/useToast'
import AgendarPartidaModal from './AgendarPartidaModal'
import GerarCalendarioModal from './GerarCalendarioModal'
import SumulaModal from './SumulaModal'
import styles from './PartidasSection.module.css'

type PartidasSectionProps = {
  campeonatoId: number
  encerrado: boolean
  // AAAA-MM-DD: nenhuma partida pode ser marcada antes do início do campeonato
  dataInicio: string
  // a página usa pra atualizar a contagem na faixa de cima
  onCountChange: (count: number) => void
  // chamado quando uma partida é finalizada ou reaberta, pra classificação recarregar
  onResultadoChange: () => void
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

// mesma ordem da API: por data e depois por id
function ordenar(partidas: Partida[]) {
  return [...partidas].sort((a, b) => a.data_hora.localeCompare(b.data_hora) || a.id - b.id)
}

function PartidasSection({ campeonatoId, encerrado, dataInicio, onCountChange, onResultadoChange }: PartidasSectionProps) {
  const [partidas, setPartidas] = useState<Partida[]>([])
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [diaEscolhido, setDiaEscolhido] = useState<string | null>(null)

  const [agendando, setAgendando] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [remarcando, setRemarcando] = useState<Partida | null>(null)
  const [sumula, setSumula] = useState<Partida | null>(null)
  const [ocupadaId, setOcupadaId] = useState<number | null>(null)
  const [toDelete, setToDelete] = useState<Partida | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
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

  function substituir(atualizada: Partida) {
    setPartidas((atual) => ordenar(atual.map((p) => (p.id === atualizada.id ? atualizada : p))))
  }

  // a súmula só muda partida não finalizada, então a classificação não precisa recarregar
  function handlePlacarChange(partidaId: number, golsMandante: number, golsVisitante: number) {
    setPartidas((atual) =>
      atual.map((p) =>
        p.id === partidaId ? { ...p, gols_mandante: golsMandante, gols_visitante: golsVisitante } : p,
      ),
    )
  }

  function handleAgendada(nova: Partida) {
    setPartidas((atual) => ordenar([...atual, nova]))
    setAgendando(false)
    setDiaEscolhido(nova.data_hora.slice(0, 10))
    mostrarToast('success', 'Partida agendada.')
  }

  function handleRemarcada(atualizada: Partida) {
    substituir(atualizada)
    setRemarcando(null)
    setDiaEscolhido(atualizada.data_hora.slice(0, 10))
    mostrarToast('success', 'Partida remarcada.')
  }

  function handleGerado(novas: Partida[]) {
    setPartidas(novas)
    setGerando(false)
    setDiaEscolhido(null)
    mostrarToast('success', `Calendário gerado: ${novas.length} partidas.`)
  }

  async function alternarFinalizada(partida: Partida) {
    setOcupadaId(partida.id)
    try {
      const atualizada = partida.finalizada
        ? await reabrirPartida(partida.id)
        : await finalizarPartida(partida.id)
      substituir(atualizada)
      // fica no mesmo dia, senão a lista pularia pra próxima rodada a disputar
      setDiaEscolhido(atualizada.data_hora.slice(0, 10))
      onResultadoChange()
      mostrarToast('success', atualizada.finalizada ? 'Partida finalizada.' : 'Partida reaberta.')
    } catch (err) {
      mostrarToast('error', (err as Error).message)
    } finally {
      setOcupadaId(null)
    }
  }

  async function handleConfirmDelete() {
    if (!toDelete) return

    setDeleting(true)
    setDeleteError(null)
    try {
      await excluirPartida(toDelete.id)
      setPartidas((atual) => atual.filter((p) => p.id !== toDelete.id))
      setToDelete(null)
      mostrarToast('success', 'Partida excluída.')
    } catch (err) {
      setDeleteError((err as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  // finalizada só pode ser reaberta; o back não deixa finalizar antes do horário do jogo.
  // a súmula abre sempre: em partida finalizada ou campeonato encerrado é só consulta
  function acoesDa(partida: Partida) {
    const verSumula = { label: 'Súmula', onSelect: () => setSumula(partida) }
    if (encerrado) return [verSumula]
    if (partida.finalizada) {
      return [verSumula, { label: 'Reabrir', onSelect: () => alternarFinalizada(partida) }]
    }
    const acoes = [verSumula, { label: 'Remarcar', onSelect: () => setRemarcando(partida) }]
    if (new Date(partida.data_hora) <= new Date()) {
      acoes.push({ label: 'Finalizar', onSelect: () => alternarFinalizada(partida) })
    }
    return [
      ...acoes,
      {
        label: 'Excluir',
        danger: true,
        onSelect: () => {
          setDeleteError(null)
          setToDelete(partida)
        },
      },
    ]
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

                <ActionMenu
                  label={`Ações de ${partida.time_mandante_nome} x ${partida.time_visitante_nome}`}
                  disabled={ocupadaId === partida.id}
                  items={acoesDa(partida)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {agendando && (
        <AgendarPartidaModal
          campeonatoId={campeonatoId}
          dataInicio={dataInicio}
          partidas={partidas}
          onSalva={handleAgendada}
          onClose={() => setAgendando(false)}
        />
      )}

      {remarcando && (
        <AgendarPartidaModal
          campeonatoId={campeonatoId}
          dataInicio={dataInicio}
          partidas={partidas}
          partida={remarcando}
          onSalva={handleRemarcada}
          onClose={() => setRemarcando(null)}
        />
      )}

      {sumula && (
        <SumulaModal
          partida={sumula}
          somenteLeitura={encerrado || sumula.finalizada}
          onPlacarChange={handlePlacarChange}
          onClose={() => setSumula(null)}
        />
      )}

      {gerando && (
        <GerarCalendarioModal
          campeonatoId={campeonatoId}
          dataInicio={dataInicio}
          onGerado={handleGerado}
          onClose={() => setGerando(false)}
        />
      )}

      {toDelete && (
        <Modal
          title="Excluir partida"
          description={
            <>
              Tem certeza que deseja excluir{' '}
              <strong>
                {toDelete.time_mandante_nome} x {toDelete.time_visitante_nome}
              </strong>
              ? Os gols e cartões dela também são apagados.
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

export default PartidasSection
