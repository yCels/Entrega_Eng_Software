import { MOCK_USERS } from '../mocks/auth'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}

const MOCK_NETWORK_DELAY_MS = 800
const TOKEN_STORAGE_KEY = 'auth_token'

// TODO: substituir por chamada fetch real quando a API de autenticação do backend estiver disponível
export async function login({ email, password }: LoginCredentials): Promise<LoginResponse> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_NETWORK_DELAY_MS))

  const user = MOCK_USERS.find(
    (candidate) =>
      candidate.email.toLowerCase() === email.toLowerCase() && candidate.password === password,
  )

  if (!user) {
    throw new Error('Email ou senha inválidos.')
  }

  return { token: `mock-token.${btoa(email)}` }
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}
