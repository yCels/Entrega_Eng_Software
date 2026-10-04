import { clearToken, getToken } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// rotas onde 401 é só "senha errada", aí não pode mandar pro login
const PUBLIC_PATHS = ['/auth/login', '/auth/cadastro']

type ErrorBody = {
  detail?: string | { msg: string }[]
}

function getErrorMessage(body: ErrorBody | null): string {
  if (typeof body?.detail === 'string') return body.detail
  // no 422 o FastAPI manda uma lista com os erros de validação
  if (Array.isArray(body?.detail) && body.detail.length > 0) return body.detail[0].msg
  return 'Algo deu errado. Tente novamente.'
}

export async function request(path: string, method = 'GET', body?: object): Promise<unknown> {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Não foi possível conectar ao servidor.')
  }

  if (response.status === 401 && !PUBLIC_PATHS.includes(path)) {
    clearToken()
    window.location.href = '/login'
  }

  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(getErrorMessage(data))
  }

  return data
}
