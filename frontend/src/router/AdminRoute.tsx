// AdminRoute.tsx — Redirects to / if user is not an admin

import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  if (!user || user.role !== 'ADMIN') return <Navigate to="/" replace />

  return <>{children}</>
}