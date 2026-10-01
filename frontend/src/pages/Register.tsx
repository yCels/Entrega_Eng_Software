import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import styles from './Register.module.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
): string | null {
  if (!name.trim()) {
    return 'Preencha o nome.'
  }
  if (!email.trim() || !password) {
    return 'Preencha email e senha.'
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'Informe um email válido.'
  }
  if (password.length < 6) {
    return 'A senha deve ter pelo menos 6 caracteres.'
  }
  if (confirmPassword !== password) {
    return 'As senhas não coincidem.'
  }
  return null
}

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validate(name, email, password, confirmPassword)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setLoading(true)

    try {
      await register({ name, email, password })
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir o cadastro.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={styles.register}>
      <Link to="/" className={styles.backLink}>
        ← Voltar
      </Link>

      <form className={styles.registerCard} onSubmit={handleSubmit} noValidate>
        <h1>Criar conta</h1>

        <label className={styles.registerField} htmlFor="name">
          Nome
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={loading}
          />
        </label>

        <label className={styles.registerField} htmlFor="email">
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

        <label className={styles.registerField} htmlFor="password">
          Senha
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
          />
        </label>

        <label className={styles.registerField} htmlFor="confirmPassword">
          Confirmar senha
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={loading}
          />
        </label>

        {error && (
          <p className={styles.registerError} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className={styles.registerSubmit} disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>

        <p className={styles.switchText}>
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </section>
  )
}

export default Register
