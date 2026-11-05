export function ProgressBar({
  percent,
  label,
}: {
  percent: number
  label?: string
}) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div className="progress">
      <div className="progress-track" aria-hidden>
        <div className="progress-fill" style={{ width: `${clamped}%` }} />
      </div>
      {label != null && <span className="progress-label">{label}</span>}
    </div>
  )
}
