import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ProgressBar } from '../components/ProgressBar'
import { Modal } from '../components/Modal'
import { useAtlas } from '../context/AtlasContext'
import { fyStartDate, formatDisplayDate } from '../lib/fiscal'
import { goalProgress } from '../lib/progress'

export function DashboardPage() {
  const { data, addGoal } = useAtlas()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  if (!data) return null

  const fyGoals = data.goals.filter((g) => g.fiscalYear === data.settings.fyLabel)
  const start = fyStartDate(data.settings.fyEndDate)

  function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    addGoal({ title, description })
    setTitle('')
    setDescription('')
    setOpen(false)
  }

  return (
    <div className="page">
      <div className="page-hero">
        <div>
          <p className="eyebrow">{data.settings.fyLabel} objectives</p>
          <h1>Yearly map</h1>
          <p className="lede">
            {formatDisplayDate(start)} → {formatDisplayDate(data.settings.fyEndDate)}. Progress
            rolls up from milestone tasks.
          </p>
        </div>
        <button type="button" className="primary-btn" onClick={() => setOpen(true)}>
          Add objective
        </button>
      </div>

      {fyGoals.length === 0 ? (
        <div className="empty">
          <h2>No objectives yet</h2>
          <p>Define what {data.settings.fyLabel} should deliver, then break it into milestones.</p>
        </div>
      ) : (
        <div className="goal-grid">
          {fyGoals.map((goal) => {
            const progress = goalProgress(goal.id, data.milestones, data.tasks)
            const milestones = data.milestones.filter((m) => m.goalId === goal.id)
            return (
              <Link key={goal.id} to={`/goals/${goal.id}`} className="goal-card">
                <div className="goal-card-top">
                  <h2>{goal.title}</h2>
                  <span className="percent">{progress.percent}%</span>
                </div>
                {goal.description && <p className="muted">{goal.description}</p>}
                <ProgressBar
                  percent={progress.percent}
                  label={`${progress.done}/${progress.total} tasks · ${milestones.length} milestones`}
                />
              </Link>
            )
          })}
        </div>
      )}

      {open && (
        <Modal title="New objective" onClose={() => setOpen(false)}>
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
            <button type="submit" className="primary-btn">
              Save objective
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
