import type { AtlasData, Goal, JournalEntry, Milestone, Project, Task } from '../types'

export interface SearchHit {
  kind: 'goal' | 'milestone' | 'task' | 'journal' | 'project'
  id: string
  title: string
  snippet: string
}

function matches(query: string, ...fields: string[]): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return false
  return fields.some((f) => f.toLowerCase().includes(q))
}

function snippet(text: string, query: string, max = 120): string {
  const q = query.trim().toLowerCase()
  const lower = text.toLowerCase()
  const idx = lower.indexOf(q)
  if (idx < 0) return text.slice(0, max)
  const start = Math.max(0, idx - 40)
  const end = Math.min(text.length, idx + q.length + 60)
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}

export function searchAll(data: AtlasData, query: string): SearchHit[] {
  const q = query.trim()
  if (!q) return []

  const hits: SearchHit[] = []

  for (const g of data.goals as Goal[]) {
    if (matches(q, g.title, g.description)) {
      hits.push({
        kind: 'goal',
        id: g.id,
        title: g.title,
        snippet: snippet(g.description || g.title, q),
      })
    }
  }

  for (const m of data.milestones as Milestone[]) {
    if (matches(q, m.title, m.description)) {
      hits.push({
        kind: 'milestone',
        id: m.id,
        title: m.title,
        snippet: snippet(m.description || m.title, q),
      })
    }
  }

  for (const t of data.tasks as Task[]) {
    if (matches(q, t.title, t.description)) {
      hits.push({
        kind: 'task',
        id: t.id,
        title: t.title,
        snippet: snippet(t.description || t.title, q),
      })
    }
  }

  for (const j of data.journal as JournalEntry[]) {
    if (matches(q, j.title, j.body)) {
      hits.push({
        kind: 'journal',
        id: j.id,
        title: j.title,
        snippet: snippet(j.body || j.title, q),
      })
    }
  }

  for (const p of (data.projects ?? []) as Project[]) {
    const updateText = p.updates.map((u) => u.body).join(' ')
    if (matches(q, p.title, p.description, updateText)) {
      hits.push({
        kind: 'project',
        id: p.id,
        title: p.title,
        snippet: snippet(p.description || updateText || p.title, q),
      })
    }
  }

  return hits
}
