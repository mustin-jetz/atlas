import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { ProgressBar } from '../components/ProgressBar'
import { useAtlas } from '../context/AtlasContext'
import { goalProgress, milestoneProgress } from '../lib/progress'
import type { Score, TaskStatus } from '../types'

export function GoalDetailPage() {
  const { goalId } = useParams()
  const navigate = useNavigate()
  const {
    data,
    updateGoal,
    deleteGoal,
    addMilestone,
    deleteMilestone,
    addTask,
    linkTaskToMilestone,
    unlinkTaskFromMilestone,
    updateTask,
  } = useAtlas()

  const [editOpen, setEditOpen] = useState(false)
  const [msOpen, setMsOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState<string | null>(null)
  const [newTaskOpen, setNewTaskOpen] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [msTitle, setMsTitle] = useState('')
  const [msDesc, setMsDesc] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [urgency, setUrgency] = useState<Score>(3)
  const [importance, setImportance] = useState<Score>(3)

  const goal = data?.goals.find((g) => g.id === goalId)

  const milestones = useMemo(
    () => data?.milestones.filter((m) => m.goalId === goalId) ?? [],
    [data, goalId],
  )

  if (!data || !goal) {
    return (
      <div className="page">
        <p>Objective not found.</p>
        <Link to="/">Back</Link>
      </div>
    )
  }

  const progress = goalProgress(goal.id, data.milestones, data.tasks)

  function openEdit() {
    setTitle(goal!.title)
    setDescription(goal!.description)
    setEditOpen(true)
  }

  function saveGoal(e: FormEvent) {
    e.preventDefault()
    updateGoal(goal!.id, { title: title.trim(), description: description.trim() })
    setEditOpen(false)
  }

  function createMilestone(e: FormEvent) {
    e.preventDefault()
    if (!msTitle.trim()) return
    addMilestone(goal!.id, { title: msTitle, description: msDesc })
    setMsTitle('')
    setMsDesc('')
    setMsOpen(false)
  }

  function createLinkedTask(e: FormEvent) {
    e.preventDefault()
    if (!newTaskOpen || !taskTitle.trim()) return
    const id = addTask({ title: taskTitle, urgency, importance })
    linkTaskToMilestone(newTaskOpen, id)
    setTaskTitle('')
    setNewTaskOpen(null)
  }

  return (
    <div className="page">
      <p className="crumb">
        <Link to="/">Objectives</Link> / {goal.title}
      </p>
      <div className="page-hero">
        <div>
          <p className="eyebrow">{goal.fiscalYear}</p>
          <h1>{goal.title}</h1>
          {goal.description && <p className="lede">{goal.description}</p>}
          <ProgressBar
            percent={progress.percent}
            label={`${progress.done}/${progress.total} linked tasks complete`}
          />
        </div>
        <div className="btn-row">
          <button type="button" className="ghost-btn" onClick={openEdit}>
            Edit
          </button>
          <button type="button" className="primary-btn" onClick={() => setMsOpen(true)}>
            Add milestone
          </button>
        </div>
      </div>

      {milestones.length === 0 ? (
        <div className="empty">
          <h2>No milestones</h2>
          <p>Break this objective into milestones, then link tasks to drive progress.</p>
        </div>
      ) : (
        <div className="milestone-list">
          {milestones.map((ms) => {
            const mp = milestoneProgress(ms, data.tasks)
            const linked = data.tasks.filter((t) => ms.taskIds.includes(t.id))
            return (
              <section key={ms.id} className="milestone-block">
                <div className="milestone-head">
                  <div>
                    <h2>{ms.title}</h2>
                    {ms.description && <p className="muted">{ms.description}</p>}
                  </div>
                  <div className="btn-row">
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => setNewTaskOpen(ms.id)}
                    >
                      New task
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => setLinkOpen(ms.id)}
                    >
                      Link task
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => {
                        if (confirm('Delete this milestone?')) deleteMilestone(ms.id)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <ProgressBar percent={mp.percent} label={`${mp.done}/${mp.total} tasks`} />
                <ul className="task-mini-list">
                  {linked.length === 0 && <li className="muted">No linked tasks yet.</li>}
                  {linked.map((t) => (
                    <li key={t.id}>
                      <select
                        value={t.status}
                        onChange={(e) =>
                          updateTask(t.id, { status: e.target.value as TaskStatus })
                        }
                        aria-label={`Status for ${t.title}`}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In progress</option>
                        <option value="done">Done</option>
                      </select>
                      <span className={t.status === 'done' ? 'done-text' : ''}>{t.title}</span>
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => unlinkTaskFromMilestone(ms.id, t.id)}
                      >
                        Unlink
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      <div className="danger-zone">
        <button
          type="button"
          className="danger-btn"
          onClick={() => {
            if (confirm('Delete this objective and its milestones?')) {
              deleteGoal(goal.id)
              navigate('/')
            }
          }}
        >
          Delete objective
        </button>
      </div>

      {editOpen && (
        <Modal title="Edit objective" onClose={() => setEditOpen(false)}>
          <form className="stack-form" onSubmit={saveGoal}>
            <label>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
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
              Save
            </button>
          </form>
        </Modal>
      )}

      {msOpen && (
        <Modal title="New milestone" onClose={() => setMsOpen(false)}>
          <form className="stack-form" onSubmit={createMilestone}>
            <label>
              Title
              <input
                value={msTitle}
                onChange={(e) => setMsTitle(e.target.value)}
                required
                autoFocus
              />
            </label>
            <label>
              Description
              <textarea value={msDesc} onChange={(e) => setMsDesc(e.target.value)} rows={3} />
            </label>
            <button type="submit" className="primary-btn">
              Save milestone
            </button>
          </form>
        </Modal>
      )}

      {linkOpen && (
        <Modal title="Link existing task" onClose={() => setLinkOpen(null)}>
          <ul className="picker-list">
            {data.tasks
              .filter((t) => !data.milestones.find((m) => m.id === linkOpen)?.taskIds.includes(t.id))
              .map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="picker-item"
                    onClick={() => {
                      linkTaskToMilestone(linkOpen, t.id)
                      setLinkOpen(null)
                    }}
                  >
                    {t.title}
                    <span className="muted">{t.status.replace('_', ' ')}</span>
                  </button>
                </li>
              ))}
          </ul>
          {data.tasks.length === 0 && <p className="muted">No tasks yet — create one first.</p>}
        </Modal>
      )}

      {newTaskOpen && (
        <Modal title="New linked task" onClose={() => setNewTaskOpen(null)}>
          <form className="stack-form" onSubmit={createLinkedTask}>
            <label>
              Title
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
                autoFocus
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
            <button type="submit" className="primary-btn">
              Create & link
            </button>
          </form>
        </Modal>
      )}

    </div>
  )
}
