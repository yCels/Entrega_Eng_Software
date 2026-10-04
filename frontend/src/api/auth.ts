import { request } from './client'

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

export interface UsuarioLogado {
  nome: string
  email: string
}

const TOKEN_STORAGE_KEY = 'auth_token'

export async function login({ email, password }: LoginCredentials): Promise<LoginResponse> {
  const data = (await request('/auth/login', 'POST', { email, senha: password })) as { access_token: string }
  return { token: data.access_token }
}

// o cadastro não devolve token, por isso a tela manda pro login depois
export async function register({ name, email, password }: RegisterData): Promise<void> {
  await request('/auth/cadastro', 'POST', { nome: name, email, senha: password })
}

export async function getUsuarioLogado(): Promise<UsuarioLogado> {
  const data = (await request('/auth/me')) as UsuarioLogado
  return { nome: data.nome, email: data.email }
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
