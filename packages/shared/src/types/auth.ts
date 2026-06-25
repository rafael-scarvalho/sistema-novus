export type UserRole = 'ADMIN' | 'SURGEON' | 'ASSISTANT' | 'GUARDIAN'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginRequest {
  email: string
  password: string
}
