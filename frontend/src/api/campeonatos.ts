
import {
  MOCK_ORGANIZADOR_ID,
  addMockCampeonato,
import {
  addMockCampeonato,
  findMockCampeonato,
  getMockCampeonatos,
  removeMockCampeonato,
  shouldMockFail,
  updateMockCampeonato,
} from '../mocks/campeonatos'

export interface Campeonato {
  id: number
  nome: string
  data_inicio: string
  encerrado: boolean
  organizador_id: number
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

const MOCK_NETWORK_DELAY_MS = 800
const NOT_FOUND_MESSAGE = 'Campeonato não encontrado'

function simulateNetwork(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_NETWORK_DELAY_MS))
}

export async function listar(): Promise<Campeonato[]> {
  await simulateNetwork()

  if (shouldMockFail()) {
    throw new Error('Não foi possível carregar os campeonatos.')
  }

  return getMockCampeonatos()
}

export async function obter(id: number): Promise<Campeonato> {
  await simulateNetwork()

  const campeonato = findMockCampeonato(id)
  if (!campeonato) {
    throw new Error(NOT_FOUND_MESSAGE)
  }

  return { ...campeonato }
}

export async function criar({ nome, data_inicio }: CampeonatoCreate): Promise<Campeonato> {
  await simulateNetwork()
  return addMockCampeonato(nome, data_inicio)
}

export async function editar(id: number, dados: CampeonatoUpdate): Promise<Campeonato> {
  await simulateNetwork()

  const campeonato = updateMockCampeonato(id, dados)
  if (!campeonato) {
    throw new Error(NOT_FOUND_MESSAGE)
  }

  return campeonato
}

export async function excluir(id: number): Promise<void> {
  await simulateNetwork()

  if (!removeMockCampeonato(id)) {
    throw new Error(NOT_FOUND_MESSAGE)
  }
}
