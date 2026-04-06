import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import AddProductPage from './pages/AddProductPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import MarketplacePage from './pages/MarketplacePage'
import OrdersPage from './pages/OrdersPage'
import ProductDetailsPage from './pages/ProductDetailsPage'
import ProductsPage from './pages/ProductsPage'
import RegisterPage from './pages/RegisterPage'
import { useAuth } from './context/AuthContext'
import './App.css'
import ConversationList from './components/ConversationList'  // ✅ already added

function AppLayout() {
  const { isAuthenticated } = useAuth()

  return (
    <main className="app-shell">
      {isAuthenticated ? <Navbar /> : null}
      <div className="container">
        <Routes>
          <Route path="/" element={<MarketplacePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 🔥 NEW ROUTE (ADD THIS) */}
          <Route
            path="/conversations"
            element={
              <ProtectedRoute>
                <ConversationList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:productId"
            element={
              <ProtectedRoute>
                <ProductDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-product"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <AddProductPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={<Navigate replace to={isAuthenticated ? '/dashboard' : '/'} />}
          />
        </Routes>
      </div>
    </main>
  )
}

export default AppLayout