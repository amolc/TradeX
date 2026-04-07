import { Navigate, Route, Routes } from 'react-router-dom'
import ConversationList from './components/ConversationList'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'
import { useAuth } from './context/AuthContext'
import AddProductPage from './pages/AddProductPage'
import ChatPage from './pages/ChatPage'
import DashboardPage from './pages/DashboardPage'
import Enquiries from './pages/Enquiries'
import LogisticsPage from './pages/LogisticsPage'
import LoginPage from './pages/LoginPage'
import MarketplacePage from './pages/MarketplacePage'
import Orders from './pages/Orders'
import OrdersPage from './pages/OrdersPage'
import ProductDetailsPage from './pages/ProductDetailsPage'
import Products from './pages/Products'
import ProductsPage from './pages/ProductsPage'
import RegisterPage from './pages/RegisterPage'
import Shipments from './pages/Shipments'
import SupplierDashboard from './pages/SupplierDashboard'

function AppLayout() {
  const { isAuthenticated, role } = useAuth()

  return (
    <main className="app-shell">
      {isAuthenticated ? <Navbar /> : null}
      <div className="container">
        <Routes>
          <Route element={<MarketplacePage />} path="/" />
          <Route element={<LoginPage />} path="/login" />
          <Route element={<RegisterPage />} path="/register" />

          <Route
            element={
              <ProtectedRoute>
                <ConversationList />
              </ProtectedRoute>
            }
            path="/conversations"
          />
          <Route
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
            path="/conversations/:id"
          />
          <Route
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
            path="/enquiry/:id"
          />

          <Route
            element={
              <ProtectedRoute>
                {role === 'supplier' ? <SupplierDashboard /> : <DashboardPage />}
              </ProtectedRoute>
            }
            path="/dashboard"
          />
          <Route
            element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            }
            path="/products"
          />
          <Route
            element={
              <ProtectedRoute>
                <LogisticsPage />
              </ProtectedRoute>
            }
            path="/logistics"
          />
          <Route
            element={
              <ProtectedRoute>
                <ProductDetailsPage />
              </ProtectedRoute>
            }
            path="/products/:productId"
          />
          <Route
            element={
              <ProtectedRoute>
                <ProductDetailsPage />
              </ProtectedRoute>
            }
            path="/product/:productId"
          />
          <Route
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
            path="/orders"
          />
          <Route
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
            path="/orders/:id"
          />
          <Route
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
            path="/shipments/:id"
          />
          <Route
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <AddProductPage />
              </ProtectedRoute>
            }
            path="/add-product"
          />

          <Route
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <Products />
              </ProtectedRoute>
            }
            path="/supplier/products"
          />
          <Route
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <Enquiries />
              </ProtectedRoute>
            }
            path="/supplier/enquiries"
          />
          <Route
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <Enquiries />
              </ProtectedRoute>
            }
            path="/supplier/enquiries/:enquiryId"
          />
          <Route
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <Orders />
              </ProtectedRoute>
            }
            path="/supplier/orders"
          />
          <Route
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <Shipments />
              </ProtectedRoute>
            }
            path="/supplier/shipments"
          />

          <Route element={<Navigate replace to={isAuthenticated ? '/dashboard' : '/'} />} path="*" />
        </Routes>
      </div>
    </main>
  )
}

export default AppLayout
