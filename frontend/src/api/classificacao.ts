import { request } from './client'

export interface LinhaClassificacao {
  posicao: number
  time_id: number
  time_nome: string
  pontos: number
  jogos: number
  vitorias: number
  empates: number
  derrotas: number
  gols_pro: number
  gols_contra: number
  saldo_gols: number
}

export async function obterClassificacao(campeonatoId: number): Promise<LinhaClassificacao[]> {
  return (await request(`/campeonatos/${campeonatoId}/classificacao`)) as LinhaClassificacao[]
}
