import {
  MOCK_ORGANIZADOR_ID,
  addMockCampeonato,
  getMockCampeonatos,
  removeMockCampeonato,
  updateMockCampeonato,
} from '../mocks/campeonatos'

export interface Campeonato {
  id: number
  nome: string
  data_inicio: string
  encerrado: boolean
  organizador_id: number
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

// TODO: substituir por chamada fetch real quando a API do backend estiver disponível
export async function listar(): Promise<Campeonato[]> {
  await simulateNetwork()
  return getMockCampeonatos()
}

// TODO: substituir por chamada fetch real quando a API do backend estiver disponível
export async function criar({ nome, data_inicio }: CampeonatoCreate): Promise<Campeonato> {
  await simulateNetwork()

  if (!nome.trim() || !data_inicio) {
    throw new Error('Nome e data de início são obrigatórios.')
  }

  return addMockCampeonato({
    nome: nome.trim(),
    data_inicio,
    encerrado: false,
    organizador_id: MOCK_ORGANIZADOR_ID,
  })
}

// TODO: substituir por chamada fetch real quando a API do backend estiver disponível
export async function editar(id: number, dados: CampeonatoUpdate): Promise<Campeonato> {
  await simulateNetwork()

  const changes: CampeonatoUpdate = { ...dados }
  if (changes.nome !== undefined) {
    changes.nome = changes.nome.trim()
    if (!changes.nome) {
      throw new Error('O nome não pode ficar vazio.')
    }
  }

  const campeonato = updateMockCampeonato(id, changes)
  if (!campeonato) {
    throw new Error(NOT_FOUND_MESSAGE)
  }

  return campeonato
}

// TODO: substituir por chamada fetch real quando a API do backend estiver disponível
export async function excluir(id: number): Promise<void> {
  await simulateNetwork()

  if (!removeMockCampeonato(id)) {
    throw new Error(NOT_FOUND_MESSAGE)
  }
}
