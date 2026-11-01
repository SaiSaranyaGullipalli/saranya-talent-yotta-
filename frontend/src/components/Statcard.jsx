
export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>

        <div
          className="stat-icon"
          style={{ backgroundColor: color }}
        >
          <Icon size={21} />
        </div>
      </div>

      <h2>{value}</h2>
      <p>{description}</p>
    </div>
  );
}
