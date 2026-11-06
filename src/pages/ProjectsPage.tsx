import { useMemo, useState, type FormEvent } from 'react'
import { Modal } from '../components/Modal'
import { useAtlas } from '../context/AtlasContext'
import { formatDisplayDate, todayISO } from '../lib/fiscal'
import type { Project, ProjectStatus } from '../types'

const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: 'Active',
  on_hold: 'On hold',
  done: 'Done',
}

export function ProjectsPage() {
  const {
    data,
    addProject,
    updateProject,
    deleteProject,
    addProjectUpdate,
    deleteProjectUpdate,
  } = useAtlas()

  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [updateForId, setUpdateForId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('active')
  const [targetDate, setTargetDate] = useState('')
  const [updateBody, setUpdateBody] = useState('')
  const [updateDate, setUpdateDate] = useState(todayISO())
  const [filter, setFilter] = useState<'all' | ProjectStatus>('active')

  const projects = useMemo(() => {
    const list = data?.projects ?? []
    const filtered = filter === 'all' ? list : list.filter((p) => p.status === filter)
    return [...filtered].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [data, filter])

  if (!data) return null

  function resetForm() {
    setTitle('')
    setDescription('')
    setStatus('active')
    setTargetDate('')
    setEditId(null)
  }

  function openCreate() {
    resetForm()
    setCreateOpen(true)
  }

  function openEdit(project: Project) {
    setEditId(project.id)
    setTitle(project.title)
    setDescription(project.description)
    setStatus(project.status)
    setTargetDate(project.targetDate ?? '')
    setCreateOpen(false)
  }

  function onSaveProject(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    if (editId) {
      updateProject(editId, {
        title: title.trim(),
        description: description.trim(),
        status,
        targetDate: targetDate || null,
      })
    } else {
      addProject({
        title,
        description,
        status,
        targetDate: targetDate || null,
      })
    }
    setCreateOpen(false)
    resetForm()
  }

  function onAddUpdate(e: FormEvent) {
    e.preventDefault()
    if (!updateForId || !updateBody.trim()) return
    addProjectUpdate(updateForId, updateBody, updateDate)
    setUpdateBody('')
    setUpdateDate(todayISO())
    setUpdateForId(null)
  }

  const formOpen = createOpen || editId != null

  return (
    <div className="page">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Multi-week work</p>
          <h1>Projects</h1>
          <p className="lede">
            Track larger efforts that span weeks. Keep a running log of what&apos;s going on.
          </p>
        </div>
        <button type="button" className="primary-btn" onClick={openCreate}>
          Add project
        </button>
      </div>

      <div className="filter-row" style={{ marginBottom: '1rem' }}>
        {(['active', 'on_hold', 'done', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={filter === f ? 'chip active' : 'chip'}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {projects.length === 0 ? (
        <div className="empty">
          <h2>No projects here</h2>
          <p>Add a multi-week workstream and post updates as things move.</p>
        </div>
      ) : (
        <div className="project-list">
          {projects.map((project) => {
            const latest = project.updates[0]
            return (
              <article key={project.id} className="project-card">
                <div className="project-card-top">
                  <div>
                    <div className="project-meta">
                      <span className={`status-pill status-${project.status}`}>
                        {STATUS_LABEL[project.status]}
                      </span>
                      {project.targetDate && (
                        <span className="muted">
                          Target {formatDisplayDate(project.targetDate)}
                        </span>
                      )}
                    </div>
                    <h2>{project.title}</h2>
                    {project.description && <p className="muted">{project.description}</p>}
                  </div>
                  <div className="btn-row milestone-actions">
                    <button
                      type="button"
                      className="pill-btn"
                      onClick={() => {
                        setUpdateBody('')
                        setUpdateDate(todayISO())
                        setUpdateForId(project.id)
                      }}
                    >
                      Add update
                    </button>
                    <button
                      type="button"
                      className="pill-btn"
                      onClick={() => openEdit(project)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="pill-btn danger"
                      onClick={() => {
                        if (confirm('Delete this project and its updates?')) {
                          deleteProject(project.id)
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {latest ? (
                  <div className="latest-update">
                    <p className="eyebrow">Latest</p>
                    <p>
                      <time dateTime={latest.date}>{formatDisplayDate(latest.date)}</time>
                      {' — '}
                      {latest.body}
                    </p>
                  </div>
                ) : (
                  <p className="muted">No updates yet.</p>
                )}

                {project.updates.length > 0 && (
                  <details className="update-history">
                    <summary>
                      All updates ({project.updates.length})
                    </summary>
                    <ul className="update-list">
                      {project.updates.map((u) => (
                        <li key={u.id}>
                          <div>
                            <time dateTime={u.date}>{formatDisplayDate(u.date)}</time>
                            <p>{u.body}</p>
                          </div>
                          <button
                            type="button"
                            className="text-btn"
                            onClick={() => deleteProjectUpdate(project.id, u.id)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </article>
            )
          })}
        </div>
      )}

      {formOpen && (
        <Modal
          title={editId ? 'Edit project' : 'New project'}
          onClose={() => {
            setCreateOpen(false)
            resetForm()
          }}
        >
          <form className="stack-form" onSubmit={onSaveProject}>
            <label>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
            </label>
            <label>
              What is this?
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Scope, why it matters, stakeholders…"
              />
            </label>
            <div className="score-row">
              <label>
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On hold</option>
                  <option value="done">Done</option>
                </select>
              </label>
              <label>
                Target date
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </label>
            </div>
            <button type="submit" className="primary-btn">
              Save project
            </button>
          </form>
        </Modal>
      )}

      {updateForId && (
        <Modal title="Project update" onClose={() => setUpdateForId(null)}>
          <form className="stack-form" onSubmit={onAddUpdate}>
            <label>
              Date
              <input
                type="date"
                value={updateDate}
                onChange={(e) => setUpdateDate(e.target.value)}
                required
              />
            </label>
            <label>
              What&apos;s going on?
              <textarea
                value={updateBody}
                onChange={(e) => setUpdateBody(e.target.value)}
                rows={5}
                required
                autoFocus
                placeholder="Progress, blockers, next steps…"
              />
            </label>
            <button type="submit" className="primary-btn">
              Post update
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
