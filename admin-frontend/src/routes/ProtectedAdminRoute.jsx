import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedAdminRoute() {
  const { isAdmin, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />
  }

  if (!isAdmin) {
    return <Navigate replace to="/login" />
  }

  return <Outlet />
}
