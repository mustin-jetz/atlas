import {
  STORAGE_KEY,
  SESSION_KEY,
  type AtlasData,
  createEmptyData,
} from '../types'

export function loadData(): AtlasData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AtlasData
    if (parsed.version !== 1) return null
    return parsed
  } catch {
    return null
  }
}

export function saveData(data: AtlasData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function hasExistingData(): boolean {
  return localStorage.getItem(STORAGE_KEY) != null
}

export function isSessionUnlocked(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function setSessionUnlocked(unlocked: boolean): void {
  if (unlocked) sessionStorage.setItem(SESSION_KEY, '1')
  else sessionStorage.removeItem(SESSION_KEY)
}

export function initializeWithPin(pinHash: string): AtlasData {
  const data = createEmptyData(pinHash)
  saveData(data)
  setSessionUnlocked(true)
  return data
}

export function exportJson(data: AtlasData): string {
  return JSON.stringify(data, null, 2)
}

export function importJson(raw: string): AtlasData {
  const parsed = JSON.parse(raw) as AtlasData
  if (parsed.version !== 1 || !parsed.settings?.pinHash) {
    throw new Error('Invalid Atlas backup file')
  }
  return parsed
}

export function exportCsv(data: AtlasData): string {
  const lines: string[] = []
  lines.push('type,id,title,status,date,extra')
  const esc = (v: string) => `"${v.replaceAll('"', '""')}"`

  for (const g of data.goals) {
    lines.push(['goal', g.id, esc(g.title), '', g.fiscalYear, esc(g.description)].join(','))
  }
  for (const m of data.milestones) {
    lines.push(
      ['milestone', m.id, esc(m.title), '', m.goalId, esc(m.taskIds.join('|'))].join(','),
    )
  }
  for (const t of data.tasks) {
    lines.push(
      [
        'task',
        t.id,
        esc(t.title),
        t.status,
        t.dueDate ?? '',
        `u${t.urgency}/i${t.importance}`,
      ].join(','),
    )
  }
  for (const j of data.journal) {
    lines.push(
      ['journal', j.id, esc(j.title), '', j.date, esc(j.body.slice(0, 200))].join(','),
    )
  }
  return lines.join('\n')
}
