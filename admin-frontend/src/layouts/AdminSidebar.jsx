import { NavLink } from 'react-router-dom'
import { adminNavItems } from '../utils/constants'

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <p>TradeX Asia</p>
        <h2>Admin Panel</h2>
      </div>

      <nav className="admin-nav">
        {adminNavItems.map((item) => (
          <NavLink
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? 'active' : ''}`
            }
            end={item.to === '/'}
            key={item.to}
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
