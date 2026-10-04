import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import { Button } from '../components/ui/Button'
import Input, { FormError } from '../components/ui/Input'
import AuthLayout, { AuthCard } from '../layouts/AuthLayout'

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
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout showBack>
      <AuthCard
        title="Criar conta"
        subtitle="Comece a organizar seus campeonatos."
        onSubmit={handleSubmit}
        footer={
          <>
            Já tem conta? <Link to="/login">Entrar</Link>
          </>
        }
      >
        <Input
          id="name"
          name="name"
          label="Nome"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={loading}
        />

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
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={loading}
        />

        <Input
          id="confirmPassword"
          name="confirmPassword"
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={loading}
        />

        {error && <FormError>{error}</FormError>}

        <Button type="submit" variant="primary" fullWidth loading={loading} loadingText="Cadastrando...">
          Cadastrar
        </Button>
      </AuthCard>
    </AuthLayout>
  )
}

export default Register
