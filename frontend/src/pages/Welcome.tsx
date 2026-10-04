import Brand from '../components/ui/Brand'
import { ButtonLink } from '../components/ui/Button'
import AuthLayout from '../layouts/AuthLayout'
import styles from './Welcome.module.css'

function Welcome() {
  return (
    <AuthLayout withPattern>
      <div className={styles.welcome}>
        <h1 className={styles.title}>
          <Brand size="lg" />
        </h1>
        <p className={styles.description}>
          Organize campeonatos amadores de futebol: times, partidas e classificação em um só lugar.
        </p>
        <div className={styles.actions}>
          <ButtonLink to="/login" variant="primary">
            Entrar
          </ButtonLink>
          <ButtonLink to="/cadastro" variant="secondary">
            Criar conta
          </ButtonLink>
        </div>
      </div>
    </AuthLayout>
  )
}

export default Welcome
