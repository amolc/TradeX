import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const navigate = useNavigate()
  const { logout, role, user } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const supplierLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/supplier/enquiries', label: 'Enquiries' },
    { to: '/supplier/orders', label: 'Orders' },
    { to: '/supplier/shipments', label: 'Shipments' },
    { to: '/supplier/products', label: 'Products' },
  ]

  const buyerLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/products', label: 'Marketplace' },
    { to: '/logistics', label: 'Logistics' },
    { to: '/orders', label: 'Requests' },
  ]

  const navLinks = role === 'supplier' ? supplierLinks : buyerLinks

  return (
    <header className="navbar">
      <div>
        <p className="navbar-label">TradeX Asia</p>
        <h1 className="navbar-title">
          {role === 'supplier' ? 'Supplier Dashboard' : 'Buyer Dashboard'}
        </h1>
        <p className="navbar-subtitle">
          {user?.name || user?.email || 'Authenticated user'}
        </p>
      </div>

      <nav className="navbar-actions">
        {navLinks.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              `button ${isActive ? 'active' : 'secondary'}`
            }
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
        <button className="button secondary" onClick={handleLogout} type="button">
          Logout
        </button>
      </nav>
    </header>
  )
}

export default Navbar
