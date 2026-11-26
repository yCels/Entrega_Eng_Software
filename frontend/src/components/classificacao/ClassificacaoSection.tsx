import { useEffect, useState } from 'react'
import { obterClassificacao, type LinhaClassificacao } from '../../api/classificacao'
import { Button } from '../ui/Button'
import { SkeletonLista } from '../ui/Skeleton'
import styles from './ClassificacaoSection.module.css'

type ClassificacaoSectionProps = {
  campeonatoId: number
  // muda quando uma partida é finalizada ou reaberta, pra tabela recarregar
  versao: number
}

function formatarSaldo(saldo: number) {
  return saldo > 0 ? `+${saldo}` : String(saldo)
}

function ClassificacaoSection({ campeonatoId, versao }: ClassificacaoSectionProps) {
  const [linhas, setLinhas] = useState<LinhaClassificacao[]>([])
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    obterClassificacao(campeonatoId)
      .then((data) => {
        setLinhas(data)
        setStatus('ready')
      })
      .catch((err: Error) => {
        setLoadError(err.message)
        setStatus('error')
      })
  }, [campeonatoId, reloadKey, versao])

  function handleRetry() {
    setStatus('loading')
    setReloadKey(reloadKey + 1)
  }

  const temJogos = linhas.some((linha) => linha.jogos > 0)

  return (
    <section id="classificacao" className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Classificação</h2>
      </div>

      {status === 'loading' && <SkeletonLista linhas={4} />}

      {status === 'error' && (
        <div className={styles.state} role="alert">
          <h3 className={styles.errorTitle}>Não foi possível carregar a classificação</h3>
          <p className={styles.stateText}>{loadError}</p>
          <Button variant="secondary" onClick={handleRetry}>
            Tentar novamente
          </Button>
        </div>
      )}

      {status === 'ready' && !temJogos && (
        <div className={styles.state}>
          <p className={styles.stateText}>A tabela aparece quando a primeira partida for finalizada.</p>
        </div>
      )}

      {status === 'ready' && temJogos && (
        <>
          <div className={styles.wrapper}>
            <table className={styles.table}>
              <caption className="visually-hidden">Tabela de classificação</caption>
              <thead>
                <tr>
                  <th scope="col" className={styles.numeric}>#</th>
                  <th scope="col">Time</th>
                  <th scope="col" className={styles.numeric}>P</th>
                  <th scope="col" className={styles.numeric}>J</th>
                  <th scope="col" className={styles.numeric}>V</th>
                  <th scope="col" className={styles.numeric}>E</th>
                  <th scope="col" className={styles.numeric}>D</th>
                  <th scope="col" className={`${styles.numeric} ${styles.desktopOnly}`}>GP</th>
                  <th scope="col" className={`${styles.numeric} ${styles.desktopOnly}`}>GC</th>
                  <th scope="col" className={styles.numeric}>SG</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha) => (
                  <tr key={linha.time_id} className={linha.posicao === 1 ? styles.lider : undefined}>
                    <td className={`num ${styles.numeric}`}>{String(linha.posicao).padStart(2, '0')}</td>
                    <td className={styles.timeCell}>{linha.time_nome}</td>
                    <td className={`num ${styles.numeric} ${styles.pontos}`}>{linha.pontos}</td>
                    <td className={`num ${styles.numeric}`}>{linha.jogos}</td>
                    <td className={`num ${styles.numeric}`}>{linha.vitorias}</td>
                    <td className={`num ${styles.numeric}`}>{linha.empates}</td>
                    <td className={`num ${styles.numeric}`}>{linha.derrotas}</td>
                    <td className={`num ${styles.numeric} ${styles.desktopOnly}`}>{linha.gols_pro}</td>
                    <td className={`num ${styles.numeric} ${styles.desktopOnly}`}>{linha.gols_contra}</td>
                    <td className={`num ${styles.numeric}`}>{formatarSaldo(linha.saldo_gols)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.legenda}>
            P pontos · J jogos · V vitórias · E empates · D derrotas · GP gols pró · GC gols contra · SG
            saldo de gols
          </p>
        </>
      )}
    </section>
  )
}

export default ClassificacaoSection
