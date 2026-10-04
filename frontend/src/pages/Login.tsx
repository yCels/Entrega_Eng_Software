import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, saveToken } from '../api/auth'
import { Button } from '../components/ui/Button'
import Input, { FormError } from '../components/ui/Input'
import AuthLayout, { AuthCard } from '../layouts/AuthLayout'

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
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout showBack>
      <AuthCard
        title="Entrar"
        subtitle="Acesse seus campeonatos."
        onSubmit={handleSubmit}
        footer={
          <>
            Não tem conta? <Link to="/cadastro">Criar conta</Link>
          </>
        }
      >
        <Input
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
        />

        <Input
          id="password"
          name="password"
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={loading}
        />

        {error && <FormError>{error}</FormError>}

        <Button type="submit" variant="primary" fullWidth loading={loading} loadingText="Entrando...">
          Entrar
        </Button>
      </AuthCard>
    </AuthLayout>
  )
}

export default Login
