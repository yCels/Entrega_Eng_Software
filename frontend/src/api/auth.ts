// TODO: trocar o mock por fetch quando a api de login ficar pronta
import { MOCK_USERS, addMockUser } from '../mocks/auth'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
}

export interface RegisterResponse {
  token: string
}

export interface UsuarioLogado {
  nome: string
  email: string
}

const MOCK_NETWORK_DELAY_MS = 800
const TOKEN_STORAGE_KEY = 'auth_token'

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

export async function register({ name, email, password }: RegisterData): Promise<RegisterResponse> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_NETWORK_DELAY_MS))

  const existingUser = MOCK_USERS.find(
    (candidate) => candidate.email.toLowerCase() === email.toLowerCase(),
  )

  if (existingUser) {
    throw new Error('Este email já está cadastrado.')
  }

  addMockUser({ name, email, password })

  return { token: `mock-token.${btoa(email)}` }
}

// TODO: trocar por fetch em GET /api/auth/me quando o backend ficar pronto
export async function getUsuarioLogado(): Promise<UsuarioLogado> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_NETWORK_DELAY_MS))

  const token = getToken()
  if (!token) {
    throw new Error('Usuário não está logado.')
  }

  // o token do mock é "mock-token." + email em base64
  const email = atob(token.replace('mock-token.', ''))
  const user = MOCK_USERS.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase())

  if (!user) {
    throw new Error('Usuário não encontrado.')
  }

  return { nome: user.name, email: user.email }
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
