export function formatDateTime(value) {
  if (!value) {
    return 'N/A'
  }

  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}
