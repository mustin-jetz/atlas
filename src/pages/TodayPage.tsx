import { Link } from 'react-router-dom'
import { useAtlas } from '../context/AtlasContext'
import { QUADRANT_LABELS, getQuadrant, groupByQuadrant } from '../lib/eisenhower'
import type { TaskStatus } from '../types'

export function TodayPage() {
  const { data, toggleTodayFocus, updateTask } = useAtlas()
  if (!data) return null

  const focus = data.todayFocusIds
    .map((id) => data.tasks.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))

  const available = groupByQuadrant(data.tasks.filter((t) => t.status !== 'done'))

  return (
    <div className="page">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Manual focus</p>
          <h1>Today</h1>
          <p className="lede">
            Choose from the matrix what belongs on today&apos;s list. Nothing is auto-added.
          </p>
        </div>
        <Link to="/tasks" className="ghost-btn">
          Open matrix
        </Link>
      </div>

      <section className="today-focus">
        <h2>Focus list ({focus.length})</h2>
        {focus.length === 0 ? (
          <div className="empty compact">
            <p>Pick tasks below (or from the matrix) to build today&apos;s list.</p>
          </div>
        ) : (
          <ul className="today-list">
            {focus.map((t) => (
              <li key={t.id}>
                <select
                  value={t.status}
                  onChange={(e) => updateTask(t.id, { status: e.target.value as TaskStatus })}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
                <div className="today-main">
                  <strong className={t.status === 'done' ? 'done-text' : ''}>{t.title}</strong>
                  <span className="muted">
                    {QUADRANT_LABELS[getQuadrant(t.urgency, t.importance)]}
                  </span>
                </div>
                <button type="button" className="text-btn" onClick={() => toggleTodayFocus(t.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="pick-from-matrix">
        <h2>Add from matrix</h2>
        <div className="matrix-grid compact">
          {(['do', 'schedule', 'delegate', 'eliminate'] as const).map((q) => (
            <div key={q} className={`matrix-cell matrix-${q}`}>
              <h3>{QUADRANT_LABELS[q]}</h3>
              <ul>
                {available[q].map((t) => {
                  const on = data.todayFocusIds.includes(t.id)
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        className={on ? 'matrix-item on-today' : 'matrix-item'}
                        onClick={() => toggleTodayFocus(t.id)}
                      >
                        {on ? '✓ ' : '+ '}
                        {t.title}
                      </button>
                    </li>
                  )
                })}
                {available[q].length === 0 && <li className="muted">—</li>}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
