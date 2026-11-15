import { request } from './client'

export interface LoginCredentials {
  email: string
  password: string
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

export async function login({ email, password }: LoginCredentials): Promise<void> {
  await request('/auth/login', 'POST', { email, senha: password })
}

export async function logout(): Promise<void> {
  await request('/auth/logout', 'POST')
}

export async function register({ name, email, password }: RegisterData): Promise<void> {
  await request('/auth/cadastro', 'POST', { nome: name, email, senha: password })
}

export async function getUsuarioLogado(): Promise<UsuarioLogado> {
  const data = (await request('/auth/me')) as UsuarioLogado
  return { nome: data.nome, email: data.email }
}
