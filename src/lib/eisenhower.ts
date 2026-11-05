import type { Score, Task } from '../types'

export type Quadrant = 'do' | 'schedule' | 'delegate' | 'eliminate'

export const QUADRANT_LABELS: Record<Quadrant, string> = {
  do: 'Do',
  schedule: 'Schedule',
  delegate: 'Delegate',
  eliminate: 'Eliminate',
}

/** Classic: high = 3–4, low = 1–2 */
export function getQuadrant(urgency: Score, importance: Score): Quadrant {
  const urgent = urgency >= 3
  const important = importance >= 3
  if (urgent && important) return 'do'
  if (!urgent && important) return 'schedule'
  if (urgent && !important) return 'delegate'
  return 'eliminate'
}

export function scoreLabel(n: Score): string {
  return ['', 'Low', 'Med-Low', 'Med-High', 'High'][n] ?? String(n)
}

export function groupByQuadrant(tasks: Task[]): Record<Quadrant, Task[]> {
  const groups: Record<Quadrant, Task[]> = {
    do: [],
    schedule: [],
    delegate: [],
    eliminate: [],
  }
  for (const task of tasks) {
    groups[getQuadrant(task.urgency, task.importance)].push(task)
  }
  return groups
}
