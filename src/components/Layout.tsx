import { NavLink, Outlet } from 'react-router-dom'
import { useAtlas } from '../context/AtlasContext'
import { daysUntil, formatDisplayDate } from '../lib/fiscal'

const links = [
  { to: '/', label: 'Objectives', end: true },
  { to: '/projects', label: 'Projects' },
  { to: '/today', label: 'Today' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/journal', label: 'Journal' },
  { to: '/search', label: 'Search' },
  { to: '/settings', label: 'Settings' },
]

export function Layout() {
  const { data, lock } = useAtlas()
  if (!data) return null

  const { fyLabel, fyEndDate } = data.settings
  const remaining = daysUntil(fyEndDate)
  const openTasks = data.tasks.filter((t) => t.status !== 'done').length
  const overdue = data.tasks.filter(
    (t) => t.dueDate && t.status !== 'done' && t.dueDate < new Date().toISOString().slice(0, 10),
  ).length
  const attention = overdue + data.tasks.filter((t) => t.status === 'in_progress').length

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand">Atlas</div>
          <p className="brand-sub">
            {fyLabel} · ends {formatDisplayDate(fyEndDate)}
            {remaining >= 0 ? ` · ${remaining}d left` : ' · ended'}
          </p>
        </div>
        <div className="topbar-meta">
          {attention > 0 && (
            <span className="attention-badge" title="In progress + overdue">
              {attention} need attention
            </span>
          )}
          <span className="meta-chip">{openTasks} open tasks</span>
          <button type="button" className="ghost-btn" onClick={lock}>
            Lock
          </button>
        </div>
      </header>

      <nav className="nav" aria-label="Primary">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
