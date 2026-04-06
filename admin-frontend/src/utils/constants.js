export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/'

export const AUTH_STORAGE_KEY = 'tradex_admin_auth'

export const adminNavItems = [
  { to: '/', label: 'Overview' },
  { to: '/users', label: 'Users' },
  { to: '/inquiries', label: 'Inquiries' },
  { to: '/products', label: 'Listings' },
  { to: '/conversations', label: 'Chat' },
  { to: '/activity', label: 'Activity' },
]
