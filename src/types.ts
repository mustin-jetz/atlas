export type TaskStatus = 'open' | 'in_progress' | 'done'
export type Score = 1 | 2 | 3 | 4

export interface Settings {
  pinHash: string
  /** ISO date YYYY-MM-DD — end of the active fiscal year */
  fyEndDate: string
  /** Display label e.g. FY27 */
  fyLabel: string
}

export interface Goal {
  id: string
  title: string
  description: string
  fiscalYear: string
  createdAt: string
}

export interface Milestone {
  id: string
  goalId: string
  title: string
  description: string
  taskIds: string[]
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  urgency: Score
  importance: Score
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export interface JournalEntry {
  id: string
  title: string
  body: string
  date: string
  taskIds: string[]
  createdAt: string
  updatedAt: string
}

export type ProjectStatus = 'active' | 'on_hold' | 'done'

export interface ProjectUpdate {
  id: string
  date: string
  body: string
  createdAt: string
}

/** Multi-week work streams with a running status log */
export interface Project {
  id: string
  title: string
  description: string
  status: ProjectStatus
  targetDate: string | null
  updates: ProjectUpdate[]
  createdAt: string
  updatedAt: string
}

export interface AtlasData {
  version: 1
  settings: Settings
  goals: Goal[]
  milestones: Milestone[]
  tasks: Task[]
  journal: JournalEntry[]
  projects: Project[]
  /** Manually curated task IDs for Today focus */
  todayFocusIds: string[]
}

export const STORAGE_KEY = 'atlas-v1'
export const SESSION_KEY = 'atlas-session-unlocked'

export const DEFAULT_FY_END = '2027-04-24'
export const DEFAULT_FY_LABEL = 'FY27'

export function createEmptyData(pinHash: string): AtlasData {
  return {
    version: 1,
    settings: {
      pinHash,
      fyEndDate: DEFAULT_FY_END,
      fyLabel: DEFAULT_FY_LABEL,
    },
    goals: [],
    milestones: [],
    tasks: [],
    journal: [],
    projects: [],
    todayFocusIds: [],
  }
}

/** Backfill fields added after first local installs. */
export function normalizeData(data: AtlasData): AtlasData {
  return {
    ...data,
    projects: data.projects ?? [],
  }
}
