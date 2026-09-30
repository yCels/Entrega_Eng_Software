export interface MockCampeonato {
  id: number
  nome: string
  data_inicio: string
  encerrado: boolean
  organizador_id: number
}

export const MOCK_ORGANIZADOR_ID = 1

const MOCK_CAMPEONATOS: MockCampeonato[] = [
  {
    id: 1,
    nome: 'Copa da Várzea 2026',
    data_inicio: '2026-08-15',
    encerrado: false,
    organizador_id: MOCK_ORGANIZADOR_ID,
  },
  {
    id: 2,
    nome: 'Torneio de Verão do Bairro',
    data_inicio: '2026-01-10',
    encerrado: true,
    organizador_id: MOCK_ORGANIZADOR_ID,
  },
  {
    id: 3,
    nome: 'Liga Amadora Society',
    data_inicio: '2026-09-05',
    encerrado: false,
    organizador_id: MOCK_ORGANIZADOR_ID,
  },
  {
    id: 4,
    nome: 'Taça dos Veteranos',
    data_inicio: '2025-11-22',
    encerrado: true,
    organizador_id: MOCK_ORGANIZADOR_ID,
  },
]

let nextMockId = MOCK_CAMPEONATOS.length + 1

export function getMockCampeonatos(): MockCampeonato[] {
  return MOCK_CAMPEONATOS.map((campeonato) => ({ ...campeonato }))
}

export function findMockCampeonato(id: number): MockCampeonato | undefined {
  return MOCK_CAMPEONATOS.find((campeonato) => campeonato.id === id)
}

export function addMockCampeonato(data: Omit<MockCampeonato, 'id'>): MockCampeonato {
  const campeonato: MockCampeonato = { id: nextMockId++, ...data }
  MOCK_CAMPEONATOS.push(campeonato)
  return { ...campeonato }
}

export function updateMockCampeonato(
  id: number,
  changes: Partial<Omit<MockCampeonato, 'id' | 'organizador_id'>>,
): MockCampeonato | undefined {
  const campeonato = findMockCampeonato(id)
  if (!campeonato) {
    return undefined
  }
  Object.assign(campeonato, changes)
  return { ...campeonato }
}

export function removeMockCampeonato(id: number): boolean {
  const index = MOCK_CAMPEONATOS.findIndex((campeonato) => campeonato.id === id)
  if (index === -1) {
    return false
  }
  MOCK_CAMPEONATOS.splice(index, 1)
  return true
}
