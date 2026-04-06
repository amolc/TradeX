import { useState } from 'react'

export default function AdminLoginForm({ onSubmit, loading, error }) {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  })

  return (
    <form
      className="auth-card"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(credentials)
      }}
    >
      <p className="page-eyebrow">Internal Access</p>
      <h1 className="page-title">Admin Sign In</h1>
      <p className="page-description">
        Use an admin account to access the management dashboard.
      </p>

      {error ? <div className="alert error">{error}</div> : null}

      <label className="field">
        <span>Username or Email</span>
        <input
          className="input"
          onChange={(event) =>
            setCredentials((current) => ({
              ...current,
              username: event.target.value,
            }))
          }
          type="text"
          value={credentials.username}
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          className="input"
          onChange={(event) =>
            setCredentials((current) => ({
              ...current,
              password: event.target.value,
            }))
          }
          type="password"
          value={credentials.password}
        />
      </label>

      <button className="button button-primary" disabled={loading} type="submit">
        {loading ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  )
}
