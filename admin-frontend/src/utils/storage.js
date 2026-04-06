import { AUTH_STORAGE_KEY } from './constants'

export const emptyAuthState = {
  token: '',
  refreshToken: '',
  role: '',
  user: null,
}

export function getStoredAdminAuth() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)

  if (!raw) {
    return emptyAuthState
  }

  try {
    return {
      ...emptyAuthState,
      ...JSON.parse(raw),
    }
  } catch {
    return emptyAuthState
  }
}

export function setStoredAdminAuth(value) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value))
}

export function clearStoredAdminAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}
