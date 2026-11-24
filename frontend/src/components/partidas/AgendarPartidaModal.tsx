import { useEffect, useState, type FormEvent } from 'react'
import { agendarPartida, editarPartida, type Partida } from '../../api/partidas'
import { listar as listarTimes, type Time } from '../../api/times'
import { Button } from '../ui/Button'
import Input, { FormError } from '../ui/Input'
import Modal, { ModalActions } from '../ui/Modal'
import Select from '../ui/Select'
import { SkeletonLista } from '../ui/Skeleton'
import styles from './AgendarPartidaModal.module.css'

type AgendarPartidaModalProps = {
  campeonatoId: number
  partidas: Partida[]
  // com partida, o modal remarca ela em vez de agendar uma nova
  partida?: Partida
  onSalva: (partida: Partida) => void
  onClose: () => void
}

type Campos = { data: string; hora: string; local: string; mandante: string; visitante: string }

// mesma regra do back, checada enquanto o usuário preenche
function procurarConflito(campos: Campos, partidas: Partida[], times: Time[]): string | null {
  const { data, hora, mandante, visitante } = campos
  const local = campos.local.trim()

  if (mandante && mandante === visitante) {
    return 'Escolha dois times diferentes.'
  }
  if (!data || !hora) return null

  const dataHora = `${data}T${hora}`
  for (const partida of partidas) {
    if (partida.data_hora.slice(0, 16) !== dataHora) continue

    const confronto = `${partida.time_mandante_nome} x ${partida.time_visitante_nome}`
    if (local && partida.local === local) {
      return `${local} já está ocupado às ${hora} (${confronto}).`
    }
    for (const id of [mandante, visitante]) {
      if (!id) continue
      if (Number(id) === partida.time_mandante_id || Number(id) === partida.time_visitante_id) {
        const nome = times.find((time) => time.id === Number(id))?.nome
        return `${nome} já joga às ${hora} (${confronto}).`
      }
    }
  }
  return null
}

function AgendarPartidaModal({ campeonatoId, partidas, partida, onSalva, onClose }: AgendarPartidaModalProps) {
  const [times, setTimes] = useState<Time[]>([])
  const [status, setStatus] = useState('loading')
  const [campos, setCampos] = useState<Campos>({
    data: partida?.data_hora.slice(0, 10) ?? '',
    hora: partida?.data_hora.slice(11, 16) ?? '',
    local: partida?.local ?? '',
    mandante: partida ? String(partida.time_mandante_id) : '',
    visitante: partida ? String(partida.time_visitante_id) : '',
  })
  const [faltando, setFaltando] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listarTimes(campeonatoId)
      .then((data) => {
        setTimes(data)
        setStatus('ready')
      })
      .catch((err: Error) => {
        setSubmitError(err.message)
        setStatus('error')
      })
  }, [campeonatoId])

  function alterar(campo: keyof Campos, valor: string) {
    setCampos((atual) => ({ ...atual, [campo]: valor }))
    setSubmitError(null)
  }

  // na remarcação a própria partida não conta como conflito
  const outras = partidas.filter((p) => p.id !== partida?.id)
  const conflito = procurarConflito(campos, outras, times)
  const locais = [...new Set(partidas.map((partida) => partida.local))]

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const { data, hora, local, mandante, visitante } = campos
    if (!data || !hora || !local.trim() || !mandante || !visitante) {
      setFaltando(true)
      return
    }
    if (conflito) return

    setSaving(true)
    const dados = {
      data_hora: `${data}T${hora}:00`,
      local: local.trim(),
      time_mandante_id: Number(mandante),
      time_visitante_id: Number(visitante),
    }
    try {
      const salva = partida ? await editarPartida(partida.id, dados) : await agendarPartida(campeonatoId, dados)
      onSalva(salva)
    } catch (err) {
      setSubmitError((err as Error).message)
      setSaving(false)
    }
  }

  const erroCampo = (valor: string) => (faltando && !valor.trim() ? 'Obrigatório.' : null)

  return (
    <Modal title={partida ? 'Remarcar partida' : 'Agendar partida'} onClose={onClose} busy={saving}>
      {status === 'loading' && <SkeletonLista linhas={3} />}

      {status === 'error' && <FormError>{submitError}</FormError>}

      {status === 'ready' && times.length < 2 && (
        <p className={styles.aviso}>Cadastre pelo menos dois times para agendar uma partida.</p>
      )}

      {status === 'ready' && times.length >= 2 && (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.linha}>
            <Input
              label="Data"
              type="date"
              value={campos.data}
              onChange={(event) => alterar('data', event.target.value)}
              error={erroCampo(campos.data)}
              disabled={saving}
            />
            <Input
              label="Horário"
              type="time"
              value={campos.hora}
              onChange={(event) => alterar('hora', event.target.value)}
              error={erroCampo(campos.hora)}
              disabled={saving}
            />
          </div>

          <Input
            label="Local"
            type="text"
            maxLength={200}
            list="locais-partida"
            placeholder="Ex.: Quadra Central"
            value={campos.local}
            onChange={(event) => alterar('local', event.target.value)}
            error={erroCampo(campos.local)}
            disabled={saving}
          />
          <datalist id="locais-partida">
            {locais.map((local) => (
              <option key={local} value={local} />
            ))}
          </datalist>

          <div className={styles.linha}>
            <Select
              label="Mandante"
              value={campos.mandante}
              onChange={(event) => alterar('mandante', event.target.value)}
              error={erroCampo(campos.mandante)}
              disabled={saving}
            >
              <option value="">Escolha um time</option>
              {times.map((time) => (
                <option key={time.id} value={time.id}>
                  {time.nome}
                </option>
              ))}
            </Select>
            <Select
              label="Visitante"
              value={campos.visitante}
              onChange={(event) => alterar('visitante', event.target.value)}
              error={erroCampo(campos.visitante)}
              disabled={saving}
            >
              <option value="">Escolha um time</option>
              {times.map((time) => (
                <option key={time.id} value={time.id}>
                  {time.nome}
                </option>
              ))}
            </Select>
          </div>

          {conflito && (
            <p className={styles.conflito} role="alert">
              {conflito}
            </p>
          )}

          {submitError && <FormError>{submitError}</FormError>}

          <ModalActions>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              loadingText="Salvando..."
              disabled={conflito !== null}
            >
              {partida ? 'Salvar' : 'Agendar partida'}
            </Button>
          </ModalActions>
        </form>
      )}
    </Modal>
  )
}

export default AgendarPartidaModal
