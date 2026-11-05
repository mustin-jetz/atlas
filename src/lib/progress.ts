import type { Milestone, Task } from '../types'

export interface Progress {
  total: number
  done: number
  percent: number
}

export function taskProgress(tasks: Task[]): Progress {
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'done').length
  return {
    total,
    done,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  }
}

export function milestoneProgress(milestone: Milestone, tasks: Task[]): Progress {
  const linked = tasks.filter((t) => milestone.taskIds.includes(t.id))
  return taskProgress(linked)
}

export function goalProgress(
  goalId: string,
  milestones: Milestone[],
  tasks: Task[],
): Progress {
  const goalMilestones = milestones.filter((m) => m.goalId === goalId)
  const taskIds = new Set(goalMilestones.flatMap((m) => m.taskIds))
  const linked = tasks.filter((t) => taskIds.has(t.id))
  return taskProgress(linked)
}
