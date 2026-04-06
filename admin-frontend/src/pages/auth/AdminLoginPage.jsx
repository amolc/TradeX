import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLoginForm from '../../components/forms/AdminLoginForm'
import { useAuth } from '../../hooks/useAuth'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { login, loading } = useAuth()
  const [error, setError] = useState('')

  const handleSubmit = async (credentials) => {
    setError('')

    try {
      const nextState = await login(credentials)

      if (nextState.role !== 'admin') {
        setError('This panel is restricted to admin users only.')
        return
      }

      navigate('/')
    } catch {
      setError('Could not sign in with those credentials.')
    }
  }

  return (
    <div className="auth-shell">
      <AdminLoginForm error={error} loading={loading} onSubmit={handleSubmit} />
    </div>
  )
}
