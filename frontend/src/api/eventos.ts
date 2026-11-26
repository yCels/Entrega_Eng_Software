import { request } from './client'

export type TipoEvento = 'gol' | 'cartao_amarelo' | 'cartao_vermelho'

export interface Evento {
  id: number
  partida_id: number
  jogador_id: number
  time_id: number
  tipo: TipoEvento
  minuto: number | null
}

export interface EventoCreate {
  jogador_id: number
  time_id: number
  tipo: TipoEvento
  minuto: number | null
}

export async function listarEventos(partidaId: number): Promise<Evento[]> {
  return (await request(`/partidas/${partidaId}/eventos`)) as Evento[]
}

export async function registrarEvento(partidaId: number, dados: EventoCreate): Promise<Evento> {
  return (await request(`/partidas/${partidaId}/eventos`, 'POST', dados)) as Evento
}

export async function excluirEvento(eventoId: number): Promise<void> {
  await request(`/eventos/${eventoId}`, 'DELETE')
}
