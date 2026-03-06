export function StatCard({ title, value, helper }: { title: string; value: string; helper?: string }) {
  return (
    <div className="card stat-card">
      <p className="muted small">{title}</p>
      <h3>{value}</h3>
      {helper ? <p className="muted small">{helper}</p> : null}
    </div>
  );
}
