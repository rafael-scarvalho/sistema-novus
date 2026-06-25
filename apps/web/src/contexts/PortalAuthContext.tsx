import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface PortalUser {
  id: string
  name: string
  email?: string | null
}

interface PortalAuthContextType {
  token: string | null
  user: PortalUser | null
  login: (token: string, user: PortalUser) => void
  logout: () => void
}

const PortalAuthContext = createContext<PortalAuthContextType | null>(null)

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('portal_token'))
  const [user, setUser] = useState<PortalUser | null>(() => {
    const u = localStorage.getItem('portal_user')
    return u ? JSON.parse(u) : null
  })

  const login = useCallback((t: string, u: PortalUser) => {
    localStorage.setItem('portal_token', t)
    localStorage.setItem('portal_user', JSON.stringify(u))
    setToken(t)
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('portal_token')
    localStorage.removeItem('portal_user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <PortalAuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </PortalAuthContext.Provider>
  )
}

export function usePortalAuth() {
  const ctx = useContext(PortalAuthContext)
  if (!ctx) throw new Error('usePortalAuth fora do PortalAuthProvider')
  return ctx
}
