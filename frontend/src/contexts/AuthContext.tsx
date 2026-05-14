// AuthContext.tsx — Provides authenticated user state across the entire app
// Exposes user, isLoading, login(), logout() via useAuth() hook

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import api from '../lib/axios'
import type { SafeUser, AuthContextValue } from '../types/models.types'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount — check if a valid session exists by fetching the current user
  // This handles page refreshes where cookies are still valid
  useEffect(() => {
    api.get<SafeUser>('/auth/me', { _skipRefresh: true })
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  async function login(email: string, password: string, onSuccess?: () => Promise<void>): Promise<void> {
    await api.post('/auth/login', { email, password })
    const res = await api.get<SafeUser>('/auth/me')
    setUser(res.data)
    if (onSuccess) await onSuccess()
  }

  //refreshUser — fetch the user anew without changing the sessiion
  async function refreshUser(): Promise<void> {
    const res = await api.get<SafeUser>('/auth/me')
    setUser(res.data)
  }

  async function logout(): Promise<void> {
    await api.post('/auth/logout')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — throws if used outside of AuthProvider
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}