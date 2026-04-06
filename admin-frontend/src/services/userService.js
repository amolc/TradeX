import apiClient from './apiClient'

export async function getAdminUsers() {
  const response = await apiClient.get('users/')
  return response.data || []
}

export async function updateUserRole(userId, role) {
  const response = await apiClient.patch(`users/${userId}/`, { role })
  return response.data
}

export async function deleteUser(userId) {
  return apiClient.delete(`users/${userId}/`)
}
