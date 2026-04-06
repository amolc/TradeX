import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react'
import { loginAdmin } from '../services/authService'
import {
  clearStoredAdminAuth,
  emptyAuthState,
  getStoredAdminAuth,
  setStoredAdminAuth,
} from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => getStoredAdminAuth())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setStoredAdminAuth(authState)
  }, [authState])

  const login = async ({ username, password }) => {
    setLoading(true)

    try {
      const tokenResponse = await loginAdmin({ username, password })
      const user = tokenResponse.data.user || null
      const isAdmin = Boolean(user?.is_admin)

      const nextState = {
        token: tokenResponse.data.access || '',
        refreshToken: tokenResponse.data.refresh || '',
        role: isAdmin ? 'admin' : '',
        user,
      }

      setAuthState(nextState)
      return nextState
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearStoredAdminAuth()
    setAuthState(emptyAuthState)
  }

  const value = useMemo(
    () => ({
      ...authState,
      loading,
      isAuthenticated: Boolean(authState.token),
      isAdmin: authState.role === 'admin',
      login,
      logout,
    }),
    [authState, loading],
  )

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
