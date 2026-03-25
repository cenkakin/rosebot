import { Navigate, Outlet } from 'react-router'
import { useAuth } from './useAuth'

export function ProtectedRoute() {
  const { token } = useAuth()
  return token ? <Outlet /> : <Navigate to="/login" replace />
}
