import { request } from './client'

export interface Jogador {
  id: number
  nome: string
  numero_camisa: number | null
  posicao: string | null
  time_id: number
}

export interface JogadorDados {
  nome: string
  // null apaga o campo na edição
  numero_camisa: number | null
  posicao: string | null
}

export async function listar(timeId: number): Promise<Jogador[]> {
  return (await request(`/times/${timeId}/jogadores`)) as Jogador[]
}

export async function criar(timeId: number, dados: JogadorDados): Promise<Jogador> {
  return (await request(`/times/${timeId}/jogadores`, 'POST', dados)) as Jogador
}

export async function editar(jogadorId: number, dados: JogadorDados): Promise<Jogador> {
  return (await request(`/jogadores/${jogadorId}`, 'PUT', dados)) as Jogador
}

export async function excluir(jogadorId: number): Promise<void> {
  await request(`/jogadores/${jogadorId}`, 'DELETE')
}
