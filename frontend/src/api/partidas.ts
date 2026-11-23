import { request } from './client'

export interface Partida {
  id: number
  data_hora: string
  local: string
  campeonato_id: number
  time_mandante_id: number
  time_mandante_nome: string
  time_visitante_id: number
  time_visitante_nome: string
  finalizada: boolean
  gols_mandante: number
  gols_visitante: number
}

export async function listarPartidas(campeonatoId: number): Promise<Partida[]> {
  return (await request(`/campeonatos/${campeonatoId}/partidas`)) as Partida[]
}
