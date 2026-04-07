import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import ProtectedAdminRoute from './ProtectedAdminRoute'
import ActivityLogsPage from '../pages/activity/ActivityLogsPage'
import AdminLoginPage from '../pages/auth/AdminLoginPage'
import AdminChatPage from '../pages/conversations/AdminChatPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import InquiriesPage from '../pages/inquiries/InquiriesPage'
import OrdersPage from '../pages/orders/OrdersPage'
import ProductsPage from '../pages/products/ProductsPage'
import ShipmentsPage from '../pages/shipments/ShipmentsPage'
import UsersPage from '../pages/users/UsersPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLoginPage />} path="/login" />
        <Route element={<ProtectedAdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route element={<DashboardPage />} path="/" />
            <Route element={<UsersPage />} path="/users" />
            <Route element={<InquiriesPage />} path="/inquiries" />
            <Route element={<OrdersPage />} path="/orders" />
            <Route element={<ShipmentsPage />} path="/shipments" />
            <Route element={<ProductsPage />} path="/products" />
            <Route element={<AdminChatPage />} path="/conversations" />
            <Route element={<ActivityLogsPage />} path="/activity" />
          </Route>
        </Route>
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </BrowserRouter>
  )
}
