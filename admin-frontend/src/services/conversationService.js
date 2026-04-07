import apiClient from './apiClient'

export async function getAdminConversations() {
  const response = await apiClient.get('conversations/')
  return response.data || []
}

export async function getConversationMessages(conversationId) {
  const response = await apiClient.get(`conversations/${conversationId}/messages/`)
  return response.data || []
}
