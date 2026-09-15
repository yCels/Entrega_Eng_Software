export interface MockUser {
  email: string
  password: string
  name: string
}

export const MOCK_USERS: MockUser[] = [
  { email: 'admin@example.com', password: '123456', name: 'Admin' },
  { email: 'usuario@example.com', password: 'senha123', name: 'Usuário Teste' },
]

export function addMockUser(user: MockUser): void {
  MOCK_USERS.push(user)
}
