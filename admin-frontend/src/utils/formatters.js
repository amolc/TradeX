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

export function formatCurrency(value) {
  const numericValue = Number(value || 0)

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(numericValue)
  } catch {
    return `Rs. ${numericValue}`
  }
}
