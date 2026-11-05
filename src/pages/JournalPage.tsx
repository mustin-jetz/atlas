import { useState, type FormEvent } from 'react'
import { Modal } from '../components/Modal'
import { useAtlas } from '../context/AtlasContext'
import { formatDisplayDate, todayISO } from '../lib/fiscal'

export function JournalPage() {
  const { data, addJournal, updateJournal, deleteJournal } = useAtlas()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [date, setDate] = useState(todayISO())
  const [taskIds, setTaskIds] = useState<string[]>([])

  if (!data) return null

  const entries = [...data.journal].sort((a, b) => b.date.localeCompare(a.date))

  function resetForm() {
    setTitle('')
    setBody('')
    setDate(todayISO())
    setTaskIds([])
    setEditId(null)
  }

  function openCreate() {
    resetForm()
    setOpen(true)
  }

  function openEdit(id: string) {
    const entry = data!.journal.find((j) => j.id === id)
    if (!entry) return
    setEditId(id)
    setTitle(entry.title)
    setBody(entry.body)
    setDate(entry.date)
    setTaskIds([...entry.taskIds])
    setOpen(true)
  }

  function onSave(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    if (editId) {
      updateJournal(editId, { title, body, date, taskIds })
    } else {
      addJournal({ title, body, date, taskIds })
    }
    setOpen(false)
    resetForm()
  }

  function toggleTask(id: string) {
    setTaskIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  return (
    <div className="page">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Narrative log</p>
          <h1>Journal</h1>
          <p className="lede">Write when it matters. Link entries to any tasks you touched.</p>
        </div>
        <button type="button" className="primary-btn" onClick={openCreate}>
          New entry
        </button>
      </div>

      <div className="journal-list">
        {entries.length === 0 && (
          <div className="empty">
            <h2>No entries yet</h2>
            <p>Capture work stories as they happen — irregular is fine.</p>
          </div>
        )}
        {entries.map((entry) => {
          const linked = data.tasks.filter((t) => entry.taskIds.includes(t.id))
          return (
            <article key={entry.id} className="journal-card">
              <header>
                <time dateTime={entry.date}>{formatDisplayDate(entry.date)}</time>
                <h2>{entry.title}</h2>
              </header>
              <p className="journal-body">{entry.body}</p>
              {linked.length > 0 && (
                <ul className="tag-row">
                  {linked.map((t) => (
                    <li key={t.id}>{t.title}</li>
                  ))}
                </ul>
              )}
              <div className="btn-row">
                <button type="button" className="ghost-btn" onClick={() => openEdit(entry.id)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="danger-btn"
                  onClick={() => {
                    if (confirm('Delete this entry?')) deleteJournal(entry.id)
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {open && (
        <Modal title={editId ? 'Edit entry' : 'New entry'} onClose={() => setOpen(false)} wide>
          <form className="stack-form" onSubmit={onSave}>
            <label>
              Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <label>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
            </label>
            <label>
              Body
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} required />
            </label>
            <fieldset className="task-link-fieldset">
              <legend>Linked tasks</legend>
              {data.tasks.length === 0 && <p className="muted">No tasks to link yet.</p>}
              <div className="check-grid">
                {data.tasks.map((t) => (
                  <label key={t.id} className="check-item">
                    <input
                      type="checkbox"
                      checked={taskIds.includes(t.id)}
                      onChange={() => toggleTask(t.id)}
                    />
                    {t.title}
                  </label>
                ))}
              </div>
            </fieldset>
            <button type="submit" className="primary-btn">
              Save entry
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
