export default function StatusBadge({ label }) {
  const tone = String(label || '').toLowerCase()
  const className = tone.includes('pending')
    ? 'status-badge pending'
    : tone.includes('confirmed') || tone.includes('approved') || tone.includes('responded')
      ? 'status-badge success'
      : tone.includes('rejected') || tone.includes('blocked')
        ? 'status-badge danger'
        : 'status-badge'

  return <span className={className}>{label || 'Unknown'}</span>
}
