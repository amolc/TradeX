import { useAuth } from '../hooks/useAuth'

export default function AdminTopbar() {
  const { logout, user } = useAuth()

  return (
    <header className="admin-topbar">
      <div>
        <p className="page-eyebrow">Management Console</p>
        <h2 className="admin-topbar-title">Welcome {user?.name || 'Admin'}</h2>
      </div>
      <button className="button button-secondary" onClick={logout} type="button">
        Logout
      </button>
    </header>
  )
}
