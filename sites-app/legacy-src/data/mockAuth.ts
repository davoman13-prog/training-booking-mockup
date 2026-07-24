import { MockCredential } from '../types'

export const mockUsers: MockCredential[] = [
  {
    id: 'mock-delegate-1',
    name: 'Alice Marshall',
    email: 'delegate@kalu.test',
    password: 'Password123',
    role: 'delegate',
  },
  {
    id: 'mock-admin-1',
    name: 'Kalu Training Admin',
    email: 'admin@kalu.test',
    password: 'Password123',
    role: 'admin',
  },
]
