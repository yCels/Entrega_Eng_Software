import { useEffect, useState, type FormEvent } from 'react'
import { gerarCalendario, type Partida } from '../../api/partidas'
import { listar as listarTimes } from '../../api/times'
import { Button } from '../ui/Button'
import Input, { FormError } from '../ui/Input'
import Modal, { ModalActions } from '../ui/Modal'
import { SkeletonLista } from '../ui/Skeleton'
import { formatDate } from '../../utils/campeonatos'
import styles from './GerarCalendarioModal.module.css'

type GerarCalendarioModalProps = {
  campeonatoId: number
  // AAAA-MM-DD do início do campeonato, usado como data mínima
  dataInicio: string
  onGerado: (partidas: Partida[]) => void
  onClose: () => void
}

// todos contra todos: com número ímpar de times, cada rodada tem um time de folga
function resumir(totalTimes: number, idaEVolta: boolean) {
  const rodadas = totalTimes % 2 === 0 ? totalTimes - 1 : totalTimes
  const jogos = (totalTimes * (totalTimes - 1)) / 2
  const vezes = idaEVolta ? 2 : 1
  return `${totalTimes} times → ${jogos * vezes} partidas em ${rodadas * vezes} rodadas`
}

function GerarCalendarioModal({ campeonatoId, dataInicio: inicioCampeonato, onGerado, onClose }: GerarCalendarioModalProps) {
  const [totalTimes, setTotalTimes] = useState<number | null>(null)
  const [local, setLocal] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [horario, setHorario] = useState('15:00')
  const [intervalo, setIntervalo] = useState('7')
  const [idaEVolta, setIdaEVolta] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listarTimes(campeonatoId)
      .then((times) => setTotalTimes(times.length))
      .catch((err: Error) => setSubmitError(err.message))
  }, [campeonatoId])

  const dataAntesDoInicio = dataInicio !== '' && dataInicio < inicioCampeonato

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!local.trim()) {
      setLocalError('Informe o local das partidas.')
      return
    }

    // o min do campo não impede digitar a data, então confere aqui também
    if (dataAntesDoInicio) return

    setLocalError(null)
    setSubmitError(null)
    setSaving(true)
    try {
      const partidas = await gerarCalendario(campeonatoId, {
        local: local.trim(),
        data_inicio: dataInicio || undefined,
        horario,
        intervalo_dias: Number(intervalo) || 7,
        ida_e_volta: idaEVolta,
      })
      onGerado(partidas)
    } catch (err) {
      setSubmitError((err as Error).message)
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Gerar calendário"
      description="Cria as partidas de todos contra todos automaticamente, uma rodada por dia."
      onClose={onClose}
      busy={saving}
    >
      {totalTimes === null && !submitError && <SkeletonLista linhas={3} />}

      {totalTimes !== null && totalTimes < 2 && (
        <p className={styles.aviso}>Cadastre pelo menos dois times para gerar o calendário.</p>
      )}

      {totalTimes === null && submitError && <FormError>{submitError}</FormError>}

      {totalTimes !== null && totalTimes >= 2 && (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            label="Local"
            type="text"
            maxLength={200}
            placeholder="Ex.: Quadra Central"
            value={local}
            onChange={(event) => setLocal(event.target.value)}
            error={localError}
            disabled={saving}
          />

          <div className={styles.linha}>
            <Input
              label="Primeira rodada"
              type="date"
              min={inicioCampeonato}
              value={dataInicio}
              onChange={(event) => setDataInicio(event.target.value)}
              error={dataAntesDoInicio ? `A partir de ${formatDate(inicioCampeonato)}.` : null}
              disabled={saving}
            />
            <Input
              label="Horário do 1º jogo"
              type="time"
              value={horario}
              onChange={(event) => setHorario(event.target.value)}
              disabled={saving}
            />
          </div>
          <p className={styles.dica}>Sem data, começa no dia de início do campeonato.</p>

          <Input
            label="Dias entre as rodadas"
            type="number"
            min={1}
            value={intervalo}
            onChange={(event) => setIntervalo(event.target.value)}
            disabled={saving}
          />

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={idaEVolta}
              onChange={(event) => setIdaEVolta(event.target.checked)}
              disabled={saving}
            />
            Ida e volta (returno com os mandos invertidos)
          </label>

          <p className={`num ${styles.resumo}`}>{resumir(totalTimes, idaEVolta)}</p>

          {submitError && <FormError>{submitError}</FormError>}

          <ModalActions>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={saving} loadingText="Gerando...">
              Gerar calendário
            </Button>
          </ModalActions>
        </form>
      )}
    </Modal>
  )
}

export default GerarCalendarioModal
