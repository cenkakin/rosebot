import { Navigate, Outlet } from 'react-router'
import { useAuth } from './useAuth'

export function ProtectedRoute() {
  const { token, isInitializing } = useAuth()
  if (isInitializing) return null
  return token ? <Outlet /> : <Navigate to="/login" replace />
}
