export default function StatCard({ title, value, detail }) {
  return (
    <article className="panel stat-card">
      <p className="stat-card-title">{title}</p>
      <h3 className="stat-card-value">{value}</h3>
      {detail ? <p className="stat-card-detail">{detail}</p> : null}
    </article>
  )
}
