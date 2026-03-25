import type { AuthResponse, LoginRequest } from '../types/auth'
import { client } from './client'

export const login = (req: LoginRequest): Promise<AuthResponse> =>
  client.post<AuthResponse>('/auth/login', req).then((r) => r.data)
