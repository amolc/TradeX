export default function EmptyState({ title, description }) {
  return (
    <div className="panel empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}
