import { createContext, useContext } from 'react'

export type TipoToast = 'success' | 'error'

export const ToastContext = createContext<(tipo: TipoToast, mensagem: string) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}
