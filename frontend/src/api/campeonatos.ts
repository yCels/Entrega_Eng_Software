import { request } from './client'

export interface Campeonato {
  id: number
  nome: string
  data_inicio: string
  encerrado: boolean
  organizador_id: number
  // o backend ainda não manda esses dois, por isso são opcionais
  total_times?: number
  total_partidas?: number
}

export interface CampeonatoCreate {
  nome: string
  data_inicio: string
}

export interface CampeonatoUpdate {
  nome?: string
  data_inicio?: string
  encerrado?: boolean
}

export async function listar(): Promise<Campeonato[]> {
  return (await request('/campeonatos/')) as Campeonato[]
}

export async function obter(id: number): Promise<Campeonato> {
  return (await request(`/campeonatos/${id}`)) as Campeonato
}

export async function criar(dados: CampeonatoCreate): Promise<Campeonato> {
  return (await request('/campeonatos/', 'POST', dados)) as Campeonato
}

export async function editar(id: number, dados: CampeonatoUpdate): Promise<Campeonato> {
  return (await request(`/campeonatos/${id}`, 'PUT', dados)) as Campeonato
}

export async function excluir(id: number): Promise<void> {
  await request(`/campeonatos/${id}`, 'DELETE')
}
