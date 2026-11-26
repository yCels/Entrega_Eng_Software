import { useEffect, useState, type FormEvent } from 'react'
import { excluirEvento, listarEventos, registrarEvento, type Evento, type TipoEvento } from '../../api/eventos'
import { listar as listarJogadores, type Jogador } from '../../api/jogadores'
import type { Partida } from '../../api/partidas'
import { Button } from '../ui/Button'
import { PlusIcon } from '../ui/Icons'
import Input, { FormError } from '../ui/Input'
import Modal, { ModalActions } from '../ui/Modal'
import Select from '../ui/Select'
import { SkeletonLista } from '../ui/Skeleton'
import { useToast } from '../ui/useToast'
import styles from './SumulaModal.module.css'

type SumulaModalProps = {
  partida: Partida
  // campeonato encerrado ou partida finalizada: só consulta
  somenteLeitura: boolean
  // a lista de partidas atualiza o placar sem recarregar tudo
  onPlacarChange: (partidaId: number, golsMandante: number, golsVisitante: number) => void
  onClose: () => void
}

const TIPOS: { valor: TipoEvento; label: string }[] = [
  { valor: 'gol', label: 'Gol' },
  { valor: 'cartao_amarelo', label: 'Cartão amarelo' },
  { valor: 'cartao_vermelho', label: 'Cartão vermelho' },
]

const LABEL_TIPO: Record<TipoEvento, string> = {
  gol: 'Gol',
  cartao_amarelo: 'Amarelo',
  cartao_vermelho: 'Vermelho',
}

// mesma ordem do backend: por minuto (sem minuto no fim) e depois por id
function ordenar(eventos: Evento[]) {
  return [...eventos].sort((a, b) => {
    if (a.minuto !== b.minuto) {
      if (a.minuto === null) return 1
      if (b.minuto === null) return -1
      return a.minuto - b.minuto
    }
    return a.id - b.id
  })
}

function contarGols(eventos: Evento[], timeId: number) {
  return eventos.filter((e) => e.tipo === 'gol' && e.time_id === timeId).length
}

function SumulaModal({ partida, somenteLeitura: bloqueadaPeloPai, onPlacarChange, onClose }: SumulaModalProps) {
  // o back não aceita evento antes do horário do jogo, então a súmula só abre para consulta
  const naoComecou = new Date(partida.data_hora) > new Date()
  const somenteLeitura = bloqueadaPeloPai || naoComecou
  const [eventos, setEventos] = useState<Evento[]>([])
  const [jogadores, setJogadores] = useState<Jogador[]>([])
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [timeId, setTimeId] = useState(String(partida.time_mandante_id))
  const [jogadorId, setJogadorId] = useState('')
  const [tipo, setTipo] = useState<TipoEvento>('gol')
  const [minuto, setMinuto] = useState('')
  const [jogadorError, setJogadorError] = useState<string | null>(null)
  const [minutoError, setMinutoError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [excluindoId, setExcluindoId] = useState<number | null>(null)
  const mostrarToast = useToast()

  useEffect(() => {
    // os jogadores dos dois times vêm junto pra mostrar os nomes na lista
    Promise.all([
      listarEventos(partida.id),
      listarJogadores(partida.time_mandante_id),
      listarJogadores(partida.time_visitante_id),
    ])
      .then(([evts, mandante, visitante]) => {
        setEventos(evts)
        setJogadores([...mandante, ...visitante])
        setStatus('ready')
      })
      .catch((err: Error) => {
        setLoadError(err.message)
        setStatus('error')
      })
  }, [partida.id, partida.time_mandante_id, partida.time_visitante_id, reloadKey])

  function handleRetry() {
    setStatus('loading')
    setReloadKey(reloadKey + 1)
  }

  function atualizarEventos(novos: Evento[]) {
    setEventos(novos)
    onPlacarChange(
      partida.id,
      contarGols(novos, partida.time_mandante_id),
      contarGols(novos, partida.time_visitante_id),
    )
  }

  function nomeDoTime(id: number) {
    return id === partida.time_mandante_id ? partida.time_mandante_nome : partida.time_visitante_nome
  }

  function nomeDoJogador(id: number) {
    const jogador = jogadores.find((j) => j.id === id)
    if (!jogador) return 'Jogador removido'
    return jogador.numero_camisa === null ? jogador.nome : `${jogador.numero_camisa} · ${jogador.nome}`
  }

  const elencoDoTime = jogadores.filter((j) => j.time_id === Number(timeId))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const minutoLimpo = minuto.trim()
    const numero = minutoLimpo === '' ? null : Number(minutoLimpo)

    setJogadorError(jogadorId ? null : 'Escolha o jogador.')
    const minutoValido = numero === null || (Number.isInteger(numero) && numero >= 0 && numero <= 150)
    setMinutoError(minutoValido ? null : 'Use um minuto de 0 a 150.')
    if (!jogadorId || !minutoValido) return

    setFormError(null)
    setSaving(true)
    try {
      const novo = await registrarEvento(partida.id, {
        time_id: Number(timeId),
        jogador_id: Number(jogadorId),
        tipo,
        minuto: numero,
      })
      atualizarEventos(ordenar([...eventos, novo]))
      // mantém time e tipo, que costumam se repetir no lançamento seguido
      setJogadorId('')
      setMinuto('')
      mostrarToast('success', tipo === 'gol' ? 'Gol lançado.' : 'Cartão lançado.')
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleExcluir(evento: Evento) {
    setExcluindoId(evento.id)
    try {
      await excluirEvento(evento.id)
      atualizarEventos(eventos.filter((e) => e.id !== evento.id))
      mostrarToast('success', 'Evento excluído.')
    } catch (err) {
      mostrarToast('error', (err as Error).message)
    } finally {
      setExcluindoId(null)
    }
  }

  const busy = saving || excluindoId !== null

  return (
    <Modal
      title={`Súmula · ${partida.time_mandante_nome} x ${partida.time_visitante_nome}`}
      onClose={onClose}
      busy={busy}
      wide
    >
      {status === 'ready' && (
        <div className={styles.placar} aria-label="Placar">
          <span className={styles.timeMandante}>{partida.time_mandante_nome}</span>
          <span className={`num ${styles.gols}`}>
            {contarGols(eventos, partida.time_mandante_id)} - {contarGols(eventos, partida.time_visitante_id)}
          </span>
          <span className={styles.timeVisitante}>{partida.time_visitante_nome}</span>
        </div>
      )}

      {status === 'ready' && somenteLeitura && (
        <p className={styles.aviso}>
          {partida.finalizada
            ? 'Partida finalizada. Reabra a partida para alterar os eventos.'
            : bloqueadaPeloPai
              ? 'Campeonato encerrado. A súmula fica só para consulta.'
              : 'A partida ainda não começou. Os eventos podem ser lançados a partir do horário do jogo.'}
        </p>
      )}

      {status === 'ready' && !somenteLeitura && (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.fields}>
            <Select
              label="Time"
              value={timeId}
              onChange={(event) => {
                setTimeId(event.target.value)
                setJogadorId('')
              }}
              disabled={saving}
            >
              <option value={partida.time_mandante_id}>{partida.time_mandante_nome}</option>
              <option value={partida.time_visitante_id}>{partida.time_visitante_nome}</option>
            </Select>
            <Select
              label="Jogador"
              value={jogadorId}
              onChange={(event) => setJogadorId(event.target.value)}
              error={jogadorError}
              disabled={saving || elencoDoTime.length === 0}
            >
              <option value="">{elencoDoTime.length === 0 ? 'Elenco vazio' : 'Escolha'}</option>
              {elencoDoTime.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.numero_camisa === null ? j.nome : `${j.numero_camisa} · ${j.nome}`}
                </option>
              ))}
            </Select>
            <Select
              label="Tipo"
              value={tipo}
              onChange={(event) => setTipo(event.target.value as TipoEvento)}
              disabled={saving}
            >
              {TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.label}
                </option>
              ))}
            </Select>
            <Input
              label="Minuto"
              type="number"
              inputMode="numeric"
              min={0}
              max={150}
              placeholder="Opcional"
              value={minuto}
              onChange={(event) => setMinuto(event.target.value)}
              error={minutoError}
              disabled={saving}
            />
          </div>

          {elencoDoTime.length === 0 && (
            <p className={styles.dica}>Cadastre jogadores no elenco de {nomeDoTime(Number(timeId))} para lançar eventos.</p>
          )}

          {formError && <FormError>{formError}</FormError>}

          <div className={styles.formActions}>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<PlusIcon />}
              loading={saving}
              loadingText="Lançando..."
              disabled={excluindoId !== null}
            >
              Lançar evento
            </Button>
          </div>
        </form>
      )}

      {status === 'loading' && <SkeletonLista linhas={3} />}

      {status === 'error' && (
        <div className={styles.state} role="alert">
          <p className={styles.errorTitle}>Não foi possível carregar a súmula</p>
          <p className={styles.stateText}>{loadError}</p>
          <Button variant="secondary" size="sm" onClick={handleRetry}>
            Tentar novamente
          </Button>
        </div>
      )}

      {status === 'ready' && eventos.length === 0 && (
        <p className={styles.stateText}>Nenhum gol ou cartão lançado ainda</p>
      )}

      {status === 'ready' && eventos.length > 0 && (
        <ul className={styles.list} aria-label="Eventos da partida">
          {eventos.map((evento) => (
            <li key={evento.id} className={styles.row}>
              <span className={`num ${styles.minuto}`}>{evento.minuto === null ? '–' : `${evento.minuto}'`}</span>
              <span className={`${styles.marca} ${styles[evento.tipo]}`} aria-hidden="true" />
              <span className={styles.info}>
                <span className={styles.jogador}>{nomeDoJogador(evento.jogador_id)}</span>
                <span className={styles.detalhe}>
                  {LABEL_TIPO[evento.tipo]} · {nomeDoTime(evento.time_id)}
                </span>
              </span>
              {!somenteLeitura && (
                <Button
                  size="sm"
                  variant="ghost"
                  className={styles.excluir}
                  onClick={() => handleExcluir(evento)}
                  loading={excluindoId === evento.id}
                  loadingText="Excluindo..."
                  disabled={busy}
                >
                  Excluir
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <ModalActions>
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Fechar
        </Button>
      </ModalActions>
    </Modal>
  )
}

export default SumulaModal
