import apiClient from './apiClient'

export async function getAdminShipments() {
  const response = await apiClient.get('logistics/')
  return response.data || []
}

export async function updateAdminShipment(shipmentId, payload) {
  const response = await apiClient.patch(`logistics/${shipmentId}/`, payload)
  return response.data
}
