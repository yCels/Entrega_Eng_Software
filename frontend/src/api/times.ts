import { request } from './client'

export interface Time {
  id: number
  nome: string
  campeonato_id: number
}

export async function listar(campeonatoId: number): Promise<Time[]> {
  return (await request(`/campeonatos/${campeonatoId}/times`)) as Time[]
}

export async function criar(campeonatoId: number, nome: string): Promise<Time> {
  return (await request(`/campeonatos/${campeonatoId}/times`, 'POST', { nome })) as Time
}

export async function editar(timeId: number, nome: string): Promise<Time> {
  return (await request(`/times/${timeId}`, 'PUT', { nome })) as Time
}

export async function excluir(timeId: number): Promise<void> {
  await request(`/times/${timeId}`, 'DELETE')
}
