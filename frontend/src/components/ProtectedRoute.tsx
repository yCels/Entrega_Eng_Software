import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getUsuarioLogado } from '../api/auth'

type ProtectedRouteProps = {
  children: ReactNode
}

type Sessao = 'verificando' | 'logado' | 'deslogado'

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [sessao, setSessao] = useState<Sessao>('verificando')

  useEffect(() => {
    // o JS não consegue ler o cookie HttpOnly, então pergunta pro back se a sessão é válida
    getUsuarioLogado()
      .then(() => setSessao('logado'))
      .catch(() => setSessao('deslogado'))
  }, [])

  if (sessao === 'verificando') {
    return null
  }

  if (sessao === 'deslogado') {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
