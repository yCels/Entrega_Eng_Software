import type { MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Campeonato } from '../../api/campeonatos'
import { formatDate } from '../../utils/campeonatos'
import ActionMenu from '../ui/ActionMenu'
import StatusIndicator from '../ui/StatusIndicator'
import styles from './CampeonatosTable.module.css'

type CampeonatosTableProps = {
  campeonatos: Campeonato[]
  busyIds: number[]
  onEdit: (campeonato: Campeonato) => void
  onToggleEncerrado: (campeonato: Campeonato) => void
  onDelete: (campeonato: Campeonato) => void
}

function CampeonatosTable({
  campeonatos,
  busyIds,
  onEdit,
  onToggleEncerrado,
  onDelete,
}: CampeonatosTableProps) {
  const navigate = useNavigate()

  // a linha toda é clicável, mas o link do nome continua pra quem usa teclado
  function handleRowClick(event: MouseEvent<HTMLTableRowElement>, id: number) {
    if ((event.target as HTMLElement).closest('a, button')) return
    navigate(`/campeonatos/${id}`)
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <caption className="visually-hidden">Lista de campeonatos</caption>
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Início</th>
            <th scope="col">Status</th>
            <th scope="col" className={styles.numeric}>
              Times
            </th>
            <th scope="col" className={styles.numeric}>
              Partidas
            </th>
            <th scope="col" className={styles.actionsCell}>
              <span className="visually-hidden">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {campeonatos.map((campeonato) => {
            const busy = busyIds.includes(campeonato.id)
            const times = campeonato.total_times ?? 0
            const partidas = campeonato.total_partidas ?? 0
            let rowClass = `${styles.row} ${campeonato.encerrado ? styles.closed : styles.open}`
            if (busy) rowClass += ` ${styles.busy}`

            return (
              <tr
                key={campeonato.id}
                className={rowClass}
                onClick={(event) => handleRowClick(event, campeonato.id)}
              >
                <td className={styles.nameCell}>
                  <Link to={`/campeonatos/${campeonato.id}`} className={styles.nameLink}>
                    {campeonato.nome}
                  </Link>
                  <div className={`${styles.mobileMeta} ${styles.mobileOnly}`}>
                    <time className="num" dateTime={campeonato.data_inicio}>
                      {formatDate(campeonato.data_inicio)}
                    </time>
                    <StatusIndicator encerrado={campeonato.encerrado} />
                    <span>
                      <span className="num">{times}</span> times ·{' '}
                      <span className="num">{partidas}</span> partidas
                    </span>
                  </div>
                </td>
                <td className={styles.desktopOnly}>
                  <time className={`num ${styles.date}`} dateTime={campeonato.data_inicio}>
                    {formatDate(campeonato.data_inicio)}
                  </time>
                </td>
                <td className={styles.desktopOnly}>
                  <StatusIndicator encerrado={campeonato.encerrado} />
                </td>
                <td className={`num ${styles.numeric} ${styles.desktopOnly}`}>{times}</td>
                <td className={`num ${styles.numeric} ${styles.desktopOnly}`}>{partidas}</td>
                <td className={styles.actionsCell}>
                  <ActionMenu
                    label={`Ações de ${campeonato.nome}`}
                    disabled={busy}
                    items={[
                      { label: 'Editar', onSelect: () => onEdit(campeonato) },
                      {
                        label: campeonato.encerrado ? 'Reabrir' : 'Encerrar',
                        onSelect: () => onToggleEncerrado(campeonato),
                      },
                      { label: 'Excluir', onSelect: () => onDelete(campeonato), danger: true },
                    ]}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default CampeonatosTable
