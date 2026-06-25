import { useState } from 'react'
import { api } from '../lib/api'

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'))

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('access_token', data.accessToken)
    setToken(data.accessToken)
    return data
  }

  function logout() {
    localStorage.removeItem('access_token')
    setToken(null)
  }

  return { token, login, logout }
}
