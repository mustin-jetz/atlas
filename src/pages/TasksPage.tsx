import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { useAtlas } from '../context/AtlasContext'
import {
  QUADRANT_LABELS,
  getQuadrant,
  groupByQuadrant,
  type Quadrant,
} from '../lib/eisenhower'
import { formatDisplayDate } from '../lib/fiscal'
import type { Score, TaskStatus } from '../types'

export function TasksPage() {
  const { data, addTask, updateTask, deleteTask, toggleTodayFocus } = useAtlas()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState<Score>(3)
  const [importance, setImportance] = useState<Score>(3)
  const [dueDate, setDueDate] = useState('')
  const [filter, setFilter] = useState<'all' | TaskStatus>('all')

  const tasks = useMemo(() => {
    if (!data) return []
    const list = filter === 'all' ? data.tasks : data.tasks.filter((t) => t.status === filter)
    return [...list].sort((a, b) => {
      const qa = quadrantRank(getQuadrant(a.urgency, a.importance))
      const qb = quadrantRank(getQuadrant(b.urgency, b.importance))
      if (qa !== qb) return qa - qb
      return b.urgency + b.importance - (a.urgency + a.importance)
    })
  }, [data, filter])

  const matrix = useMemo(
    () => groupByQuadrant(data?.tasks.filter((t) => t.status !== 'done') ?? []),
    [data],
  )

  if (!data) return null

  function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    addTask({
      title,
      description,
      urgency,
      importance,
      dueDate: dueDate || null,
    })
    setTitle('')
    setDescription('')
    setDueDate('')
    setUrgency(3)
    setImportance(3)
    setOpen(false)
  }

  const quadrants: Quadrant[] = ['do', 'schedule', 'delegate', 'eliminate']

  return (
    <div className="page">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Prioritization</p>
          <h1>Tasks & matrix</h1>
          <p className="lede">
            Score urgency and importance (1–4). Pick items into{' '}
            <Link to="/today">Today focus</Link> manually.
          </p>
        </div>
        <button type="button" className="primary-btn" onClick={() => setOpen(true)}>
          Add task
        </button>
      </div>

      <div className="matrix-grid">
        {quadrants.map((q) => (
          <section key={q} className={`matrix-cell matrix-${q}`}>
            <h2>{QUADRANT_LABELS[q]}</h2>
            <ul>
              {matrix[q].length === 0 && <li className="muted">Empty</li>}
              {matrix[q].map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className={
                      data.todayFocusIds.includes(t.id) ? 'matrix-item on-today' : 'matrix-item'
                    }
                    onClick={() => toggleTodayFocus(t.id)}
                    title="Toggle Today focus"
                  >
                    {t.title}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="hint">Click a matrix item to add/remove it from Today focus.</p>

      <div className="section-head">
        <h2>All tasks</h2>
        <div className="filter-row">
          {(['all', 'open', 'in_progress', 'done'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={filter === f ? 'chip active' : 'chip'}
              onClick={() => setFilter(f)}
            >
              {f === 'in_progress' ? 'In progress' : f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <ul className="task-table">
        {tasks.map((t) => (
          <li key={t.id} className="task-row">
            <div className="task-main">
              <strong>{t.title}</strong>
              <span className="muted">
                {QUADRANT_LABELS[getQuadrant(t.urgency, t.importance)]} · U{t.urgency} / I
                {t.importance}
                {t.dueDate ? ` · due ${formatDisplayDate(t.dueDate)}` : ''}
              </span>
            </div>
            <div className="task-actions">
              <select
                value={t.status}
                onChange={(e) => updateTask(t.id, { status: e.target.value as TaskStatus })}
              >
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
              <button
                type="button"
                className={data.todayFocusIds.includes(t.id) ? 'chip active' : 'chip'}
                onClick={() => toggleTodayFocus(t.id)}
              >
                Today
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={() => {
                  if (confirm('Delete task?')) deleteTask(t.id)
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {tasks.length === 0 && <li className="muted">No tasks in this filter.</li>}
      </ul>

      {open && (
        <Modal title="New task" onClose={() => setOpen(false)}>
          <form className="stack-form" onSubmit={onCreate}>
            <label>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </label>
            <div className="score-row">
              <label>
                Urgency (1–4)
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={urgency}
                  onChange={(e) => setUrgency(Number(e.target.value) as Score)}
                />
              </label>
              <label>
                Importance (1–4)
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={importance}
                  onChange={(e) => setImportance(Number(e.target.value) as Score)}
                />
              </label>
            </div>
            <label>
              Due date (optional)
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
            <button type="submit" className="primary-btn">
              Save task
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

function quadrantRank(q: Quadrant): number {
  return { do: 0, schedule: 1, delegate: 2, eliminate: 3 }[q]
}
