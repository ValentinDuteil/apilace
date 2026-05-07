// ProtectedRoute.tsx — Redirects to /connexion if user is not authenticated

import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return null // avoid redirect flash while session is being checked

  if (!user) return <Navigate to="/connexion" replace />

  return <>{children}</>
}