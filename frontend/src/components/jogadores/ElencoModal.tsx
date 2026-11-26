import { useEffect, useRef, useState, type FormEvent } from 'react'
import { criar, editar, excluir, listar, type Jogador, type JogadorDados } from '../../api/jogadores'
import type { Time } from '../../api/times'
import { Button } from '../ui/Button'
import { PlusIcon } from '../ui/Icons'
import Input, { FormError } from '../ui/Input'
import Modal, { ModalActions } from '../ui/Modal'
import { SkeletonLista } from '../ui/Skeleton'
import { useToast } from '../ui/useToast'
import styles from './ElencoModal.module.css'

type ElencoModalProps = {
  time: Time
  // campeonato encerrado: o elenco fica só para consulta
  somenteLeitura?: boolean
  onClose: () => void
}

const POSICOES = ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante']

// mesma ordem do backend: camisa (sem número no fim) e depois nome
function ordenar(jogadores: Jogador[]) {
  return [...jogadores].sort((a, b) => {
    if (a.numero_camisa !== b.numero_camisa) {
      if (a.numero_camisa === null) return 1
      if (b.numero_camisa === null) return -1
      return a.numero_camisa - b.numero_camisa
    }
    return a.nome.localeCompare(b.nome)
  })
}

function ElencoModal({ time, somenteLeitura = false, onClose }: ElencoModalProps) {
  const [jogadores, setJogadores] = useState<Jogador[]>([])
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  // o mesmo formulário serve pra cadastrar e pra editar
  const [editando, setEditando] = useState<Jogador | null>(null)
  const [nome, setNome] = useState('')
  const [camisa, setCamisa] = useState('')
  const [posicao, setPosicao] = useState('')
  const [nomeError, setNomeError] = useState<string | null>(null)
  const [camisaError, setCamisaError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const nomeRef = useRef<HTMLInputElement>(null)

  const [toDelete, setToDelete] = useState<Jogador | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const mostrarToast = useToast()

  useEffect(() => {
    listar(time.id)
      .then((data) => {
        setJogadores(data)
        setStatus('ready')
      })
      .catch((err: Error) => {
        setLoadError(err.message)
        setStatus('error')
      })
  }, [time.id, reloadKey])

  function handleRetry() {
    setStatus('loading')
    setReloadKey(reloadKey + 1)
  }

  function limparFormulario() {
    setEditando(null)
    setNome('')
    setCamisa('')
    setPosicao('')
    setNomeError(null)
    setCamisaError(null)
    setFormError(null)
  }

  function comecarEdicao(jogador: Jogador) {
    setToDelete(null)
    setEditando(jogador)
    setNome(jogador.nome)
    setCamisa(jogador.numero_camisa === null ? '' : String(jogador.numero_camisa))
    setPosicao(jogador.posicao ?? '')
    setNomeError(null)
    setCamisaError(null)
    setFormError(null)
    nomeRef.current?.focus()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nomeLimpo = nome.trim()
    const camisaLimpa = camisa.trim()
    const numero = camisaLimpa === '' ? null : Number(camisaLimpa)

    setNomeError(nomeLimpo ? null : 'Preencha o nome do jogador.')
    const camisaValida = numero === null || (Number.isInteger(numero) && numero >= 0 && numero <= 999)
    setCamisaError(camisaValida ? null : 'Use um número de 0 a 999.')
    if (!nomeLimpo || !camisaValida) {
      if (!nomeLimpo) nomeRef.current?.focus()
      return
    }

    const dados: JogadorDados = {
      nome: nomeLimpo,
      numero_camisa: numero,
      posicao: posicao.trim() || null,
    }

    setFormError(null)
    setSaving(true)

    try {
      if (editando) {
        const atualizado = await editar(editando.id, dados)
        setJogadores((atual) => ordenar(atual.map((j) => (j.id === atualizado.id ? atualizado : j))))
        mostrarToast('success', 'Jogador atualizado.')
      } else {
        const novo = await criar(time.id, dados)
        setJogadores((atual) => ordenar([...atual, novo]))
        mostrarToast('success', 'Jogador adicionado.')
      }
      limparFormulario()
      nomeRef.current?.focus()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!toDelete) return

    setDeleting(true)
    setDeleteError(null)

    try {
      await excluir(toDelete.id)
      setJogadores((atual) => atual.filter((j) => j.id !== toDelete.id))
      if (editando?.id === toDelete.id) limparFormulario()
      setToDelete(null)
      mostrarToast('success', 'Jogador excluído.')
    } catch (err) {
      setDeleteError((err as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal title={`Elenco · ${time.nome}`} onClose={onClose} busy={saving || deleting} wide>
      {status === 'ready' && somenteLeitura && (
        <p className={styles.aviso}>Campeonato encerrado. O elenco fica só para consulta.</p>
      )}

      {status === 'ready' && !somenteLeitura && (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.fields}>
            <Input
              ref={nomeRef}
              className={styles.nome}
              label="Nome"
              type="text"
              maxLength={150}
              placeholder="Nome do jogador"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              error={nomeError}
              disabled={saving}
            />
            <Input
              className={styles.camisa}
              label="Camisa"
              type="number"
              inputMode="numeric"
              min={0}
              max={999}
              placeholder="Nº"
              value={camisa}
              onChange={(event) => setCamisa(event.target.value)}
              error={camisaError}
              disabled={saving}
            />
            <Input
              className={styles.posicao}
              label="Posição"
              type="text"
              maxLength={50}
              list="posicoes-jogador"
              placeholder="Opcional"
              value={posicao}
              onChange={(event) => setPosicao(event.target.value)}
              disabled={saving}
            />
            <datalist id="posicoes-jogador">
              {POSICOES.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          {formError && <FormError>{formError}</FormError>}

          <div className={styles.formActions}>
            {editando && (
              <Button variant="secondary" size="sm" onClick={limparFormulario} disabled={saving}>
                Cancelar edição
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={editando ? undefined : <PlusIcon />}
              loading={saving}
              loadingText="Salvando..."
            >
              {editando ? 'Salvar jogador' : 'Adicionar jogador'}
            </Button>
          </div>
        </form>
      )}

      {status === 'loading' && <SkeletonLista linhas={3} />}

      {status === 'error' && (
        <div className={styles.state} role="alert">
          <p className={styles.errorTitle}>Não foi possível carregar o elenco</p>
          <p className={styles.stateText}>{loadError}</p>
          <Button variant="secondary" size="sm" onClick={handleRetry}>
            Tentar novamente
          </Button>
        </div>
      )}

      {status === 'ready' && jogadores.length === 0 && (
        <p className={styles.stateText}>Nenhum jogador cadastrado ainda</p>
      )}

      {status === 'ready' && jogadores.length > 0 && (
        <ul className={styles.list} aria-label={`Jogadores de ${time.nome}`}>
          {jogadores.map((jogador) => (
            <li
              key={jogador.id}
              className={editando?.id === jogador.id ? `${styles.row} ${styles.rowActive}` : styles.row}
            >
              {toDelete?.id === jogador.id ? (
                <div className={styles.confirm}>
                  <p className={styles.confirmText}>
                    Excluir <strong>{jogador.nome}</strong>?
                  </p>
                  {deleteError && <FormError>{deleteError}</FormError>}
                  <div className={styles.rowActions}>
                    <Button size="sm" variant="secondary" onClick={() => setToDelete(null)} disabled={deleting}>
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={handleConfirmDelete}
                      loading={deleting}
                      loadingText="Excluindo..."
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <span className={styles.numero} aria-label="Camisa">
                    {jogador.numero_camisa ?? '–'}
                  </span>
                  <span className={styles.info}>
                    <span className={styles.nomeJogador}>{jogador.nome}</span>
                    {jogador.posicao && <span className={styles.posicaoJogador}>{jogador.posicao}</span>}
                  </span>
                  {!somenteLeitura && (
                    <div className={styles.rowActions}>
                      <Button size="sm" variant="ghost" onClick={() => comecarEdicao(jogador)} disabled={saving}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={styles.excluir}
                        onClick={() => {
                          setDeleteError(null)
                          setToDelete(jogador)
                        }}
                        disabled={saving}
                      >
                        Excluir
                      </Button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <ModalActions>
        <Button variant="secondary" onClick={onClose} disabled={saving || deleting}>
          Fechar
        </Button>
      </ModalActions>
    </Modal>
  )
}

export default ElencoModal
