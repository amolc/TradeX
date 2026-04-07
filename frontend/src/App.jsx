import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import AddProductPage from './pages/AddProductPage'
import ChatPage from './pages/ChatPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import LogisticsPage from './pages/LogisticsPage'
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
            path="/conversations/:id"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enquiry/:id"
            element={
              <ProtectedRoute>
                <ChatPage />
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
            path="/logistics"
            element={
              <ProtectedRoute>
                <LogisticsPage />
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
            path="/product/:productId"
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
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shipments/:id"
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
