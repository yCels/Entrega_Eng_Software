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

export interface PartidaCreate {
  data_hora: string
  local: string
  time_mandante_id: number
  time_visitante_id: number
}

export interface CalendarioCreate {
  local: string
  data_inicio?: string
  horario: string
  intervalo_dias: number
  ida_e_volta: boolean
}

export async function listarPartidas(campeonatoId: number): Promise<Partida[]> {
  return (await request(`/campeonatos/${campeonatoId}/partidas`)) as Partida[]
}

export async function agendarPartida(campeonatoId: number, dados: PartidaCreate): Promise<Partida> {
  return (await request(`/campeonatos/${campeonatoId}/partidas`, 'POST', dados)) as Partida
}

export async function gerarCalendario(campeonatoId: number, dados: CalendarioCreate): Promise<Partida[]> {
  return (await request(`/campeonatos/${campeonatoId}/calendario`, 'POST', dados)) as Partida[]
}

export async function editarPartida(partidaId: number, dados: PartidaCreate): Promise<Partida> {
  return (await request(`/partidas/${partidaId}`, 'PUT', dados)) as Partida
}

export async function excluirPartida(partidaId: number): Promise<void> {
  await request(`/partidas/${partidaId}`, 'DELETE')
}

export async function finalizarPartida(partidaId: number): Promise<Partida> {
  return (await request(`/partidas/${partidaId}/finalizar`, 'PATCH')) as Partida
}

export async function reabrirPartida(partidaId: number): Promise<Partida> {
  return (await request(`/partidas/${partidaId}/reabrir`, 'PATCH')) as Partida
}
