import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, saveToken } from '../api/auth'
import styles from './Login.module.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(email: string, password: string): string | null {
  if (!email.trim() || !password) {
    return 'Preencha email e senha.'
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'Informe um email válido.'
  }
  if (password.length < 6) {
    return 'A senha deve ter pelo menos 6 caracteres.'
  }
  return null
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validate(email, password)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { token } = await login({ email, password })
      saveToken(token)
      navigate('/campeonatos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível fazer login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={styles.login}>
      <Link to="/" className={styles.backLink}>
        ← Voltar
      </Link>

      <form className={styles.loginCard} onSubmit={handleSubmit} noValidate>
        <h1>Entrar</h1>

        <label className={styles.loginField} htmlFor="email">
          Email
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={loading}
          />
        </label>

        <label className={styles.loginField} htmlFor="password">
          Senha
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
          />
        </label>

        {error && (
          <p className={styles.loginError} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className={styles.loginSubmit} disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </section>
  )
}

export default Login
