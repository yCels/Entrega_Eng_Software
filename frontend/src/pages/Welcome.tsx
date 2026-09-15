import { useNavigate } from 'react-router-dom'
import BallIcon from '../components/BallIcon'
import FieldPattern from '../components/FieldPattern'
import styles from './Welcome.module.css'

function Welcome() {
  const navigate = useNavigate()

  return (
    <section className={styles.welcome}>
      <FieldPattern className={styles.pattern} />

      <div className={styles.welcomeCard}>
        <h1 className={styles.title}>
          Bem-vindo ao{' '}
          <span className={styles.brand}>
            <BallIcon className={styles.brandIcon} />
            Nexum
          </span>
        </h1>
        <p className={styles.welcomeDescription}>
          Organize e acompanhe seus campeonatos em um só lugar.
        </p>
        <button
          type="button"
          className={styles.welcomeSubmit}
          onClick={() => navigate('/login')}
        >
          Entrar
        </button>
      </div>
    </section>
  )
}

export default Welcome
