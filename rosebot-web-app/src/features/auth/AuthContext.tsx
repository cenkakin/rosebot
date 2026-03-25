import { createContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { TOKEN_STORAGE_KEY } from '../../api/client'

interface AuthContextValue {
  token: string | null
  login: (token: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue>({
  token: null,
  login: () => {},
  logout: () => {},
})

function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
    return stored && isTokenValid(stored) ? stored : null
  })

  useEffect(() => {
    if (!token) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  }, [token])

  const login = (newToken: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
  }

  return <AuthContext value={{ token, login, logout }}>{children}</AuthContext>
}
