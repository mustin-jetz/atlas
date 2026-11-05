import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createId } from '../lib/id'
import { hashPin, verifyPin } from '../lib/pin'
import {
  exportCsv,
  exportJson,
  hasExistingData,
  importJson,
  initializeWithPin,
  isSessionUnlocked,
  loadData,
  saveData,
  setSessionUnlocked,
} from '../lib/storage'
import type {
  AtlasData,
  Goal,
  JournalEntry,
  Milestone,
  Score,
  Task,
  TaskStatus,
} from '../types'
import { todayISO } from '../lib/fiscal'

interface AtlasContextValue {
  ready: boolean
  unlocked: boolean
  needsSetup: boolean
  data: AtlasData | null
  setupPin: (pin: string) => Promise<void>
  unlock: (pin: string) => Promise<boolean>
  lock: () => void
  // Goals
  addGoal: (input: { title: string; description?: string }) => void
  updateGoal: (id: string, patch: Partial<Pick<Goal, 'title' | 'description'>>) => void
  deleteGoal: (id: string) => void
  // Milestones
  addMilestone: (goalId: string, input: { title: string; description?: string }) => void
  updateMilestone: (
    id: string,
    patch: Partial<Pick<Milestone, 'title' | 'description' | 'taskIds'>>,
  ) => void
  deleteMilestone: (id: string) => void
  linkTaskToMilestone: (milestoneId: string, taskId: string) => void
  unlinkTaskFromMilestone: (milestoneId: string, taskId: string) => void
  // Tasks
  addTask: (input: {
    title: string
    description?: string
    urgency: Score
    importance: Score
    dueDate?: string | null
    status?: TaskStatus
  }) => string
  updateTask: (
    id: string,
    patch: Partial<
      Pick<Task, 'title' | 'description' | 'status' | 'urgency' | 'importance' | 'dueDate'>
    >,
  ) => void
  deleteTask: (id: string) => void
  // Journal
  addJournal: (input: {
    title: string
    body: string
    date?: string
    taskIds?: string[]
  }) => void
  updateJournal: (
    id: string,
    patch: Partial<Pick<JournalEntry, 'title' | 'body' | 'date' | 'taskIds'>>,
  ) => void
  deleteJournal: (id: string) => void
  // Today focus
  setTodayFocus: (taskIds: string[]) => void
  toggleTodayFocus: (taskId: string) => void
  // Settings
  updateFy: (fyLabel: string, fyEndDate: string) => void
  changePin: (currentPin: string, newPin: string) => Promise<boolean>
  // Backup
  downloadJson: () => void
  downloadCsv: () => void
  restoreJson: (raw: string) => void
}

const AtlasContext = createContext<AtlasContextValue | null>(null)

function persist(next: AtlasData) {
  saveData(next)
  return next
}

export function AtlasProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AtlasData | null>(() => loadData())
  const [unlocked, setUnlocked] = useState(() => isSessionUnlocked() && hasExistingData())

  const mutate = useCallback((fn: (prev: AtlasData) => AtlasData) => {
    setData((prev) => {
      if (!prev) return prev
      return persist(fn(prev))
    })
  }, [])

  const setupPin = useCallback(async (pin: string) => {
    const pinHash = await hashPin(pin)
    const next = initializeWithPin(pinHash)
    setData(next)
    setUnlocked(true)
  }, [])

  const unlock = useCallback(
    async (pin: string) => {
      const current = data ?? loadData()
      if (!current) return false
      const ok = await verifyPin(pin, current.settings.pinHash)
      if (ok) {
        setData(current)
        setSessionUnlocked(true)
        setUnlocked(true)
      }
      return ok
    },
    [data],
  )

  const lock = useCallback(() => {
    setSessionUnlocked(false)
    setUnlocked(false)
  }, [])

  const addGoal = useCallback(
    (input: { title: string; description?: string }) => {
      mutate((prev) => ({
        ...prev,
        goals: [
          ...prev.goals,
          {
            id: createId('goal'),
            title: input.title.trim(),
            description: input.description?.trim() ?? '',
            fiscalYear: prev.settings.fyLabel,
            createdAt: new Date().toISOString(),
          },
        ],
      }))
    },
    [mutate],
  )

  const updateGoal = useCallback(
    (id: string, patch: Partial<Pick<Goal, 'title' | 'description'>>) => {
      mutate((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
      }))
    },
    [mutate],
  )

  const deleteGoal = useCallback(
    (id: string) => {
      mutate((prev) => ({
        ...prev,
        goals: prev.goals.filter((g) => g.id !== id),
        milestones: prev.milestones.filter((m) => m.goalId !== id),
      }))
    },
    [mutate],
  )

  const addMilestone = useCallback(
    (goalId: string, input: { title: string; description?: string }) => {
      mutate((prev) => ({
        ...prev,
        milestones: [
          ...prev.milestones,
          {
            id: createId('ms'),
            goalId,
            title: input.title.trim(),
            description: input.description?.trim() ?? '',
            taskIds: [],
            createdAt: new Date().toISOString(),
          },
        ],
      }))
    },
    [mutate],
  )

  const updateMilestone = useCallback(
    (
      id: string,
      patch: Partial<Pick<Milestone, 'title' | 'description' | 'taskIds'>>,
    ) => {
      mutate((prev) => ({
        ...prev,
        milestones: prev.milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      }))
    },
    [mutate],
  )

  const deleteMilestone = useCallback(
    (id: string) => {
      mutate((prev) => ({
        ...prev,
        milestones: prev.milestones.filter((m) => m.id !== id),
      }))
    },
    [mutate],
  )

  const linkTaskToMilestone = useCallback(
    (milestoneId: string, taskId: string) => {
      mutate((prev) => ({
        ...prev,
        milestones: prev.milestones.map((m) =>
          m.id === milestoneId && !m.taskIds.includes(taskId)
            ? { ...m, taskIds: [...m.taskIds, taskId] }
            : m,
        ),
      }))
    },
    [mutate],
  )

  const unlinkTaskFromMilestone = useCallback(
    (milestoneId: string, taskId: string) => {
      mutate((prev) => ({
        ...prev,
        milestones: prev.milestones.map((m) =>
          m.id === milestoneId
            ? { ...m, taskIds: m.taskIds.filter((id) => id !== taskId) }
            : m,
        ),
      }))
    },
    [mutate],
  )

  const addTask = useCallback(
    (input: {
      title: string
      description?: string
      urgency: Score
      importance: Score
      dueDate?: string | null
      status?: TaskStatus
    }) => {
      const id = createId('task')
      const now = new Date().toISOString()
      mutate((prev) => ({
        ...prev,
        tasks: [
          ...prev.tasks,
          {
            id,
            title: input.title.trim(),
            description: input.description?.trim() ?? '',
            status: input.status ?? 'open',
            urgency: input.urgency,
            importance: input.importance,
            dueDate: input.dueDate ?? null,
            createdAt: now,
            updatedAt: now,
          },
        ],
      }))
      return id
    },
    [mutate],
  )

  const updateTask = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<Task, 'title' | 'description' | 'status' | 'urgency' | 'importance' | 'dueDate'>
      >,
    ) => {
      mutate((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
        ),
      }))
    },
    [mutate],
  )

  const deleteTask = useCallback(
    (id: string) => {
      mutate((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
        milestones: prev.milestones.map((m) => ({
          ...m,
          taskIds: m.taskIds.filter((tid) => tid !== id),
        })),
        journal: prev.journal.map((j) => ({
          ...j,
          taskIds: j.taskIds.filter((tid) => tid !== id),
        })),
        todayFocusIds: prev.todayFocusIds.filter((tid) => tid !== id),
      }))
    },
    [mutate],
  )

  const addJournal = useCallback(
    (input: { title: string; body: string; date?: string; taskIds?: string[] }) => {
      const now = new Date().toISOString()
      mutate((prev) => ({
        ...prev,
        journal: [
          {
            id: createId('jrnl'),
            title: input.title.trim(),
            body: input.body.trim(),
            date: input.date ?? todayISO(),
            taskIds: input.taskIds ?? [],
            createdAt: now,
            updatedAt: now,
          },
          ...prev.journal,
        ],
      }))
    },
    [mutate],
  )

  const updateJournal = useCallback(
    (
      id: string,
      patch: Partial<Pick<JournalEntry, 'title' | 'body' | 'date' | 'taskIds'>>,
    ) => {
      mutate((prev) => ({
        ...prev,
        journal: prev.journal.map((j) =>
          j.id === id ? { ...j, ...patch, updatedAt: new Date().toISOString() } : j,
        ),
      }))
    },
    [mutate],
  )

  const deleteJournal = useCallback(
    (id: string) => {
      mutate((prev) => ({
        ...prev,
        journal: prev.journal.filter((j) => j.id !== id),
      }))
    },
    [mutate],
  )

  const setTodayFocus = useCallback(
    (taskIds: string[]) => {
      mutate((prev) => ({ ...prev, todayFocusIds: taskIds }))
    },
    [mutate],
  )

  const toggleTodayFocus = useCallback(
    (taskId: string) => {
      mutate((prev) => {
        const has = prev.todayFocusIds.includes(taskId)
        return {
          ...prev,
          todayFocusIds: has
            ? prev.todayFocusIds.filter((id) => id !== taskId)
            : [...prev.todayFocusIds, taskId],
        }
      })
    },
    [mutate],
  )

  const updateFy = useCallback(
    (fyLabel: string, fyEndDate: string) => {
      mutate((prev) => ({
        ...prev,
        settings: { ...prev.settings, fyLabel: fyLabel.trim(), fyEndDate },
      }))
    },
    [mutate],
  )

  const changePin = useCallback(
    async (currentPin: string, newPin: string) => {
      if (!data) return false
      const ok = await verifyPin(currentPin, data.settings.pinHash)
      if (!ok) return false
      const pinHash = await hashPin(newPin)
      mutate((prev) => ({
        ...prev,
        settings: { ...prev.settings, pinHash },
      }))
      return true
    },
    [data, mutate],
  )

  const downloadJson = useCallback(() => {
    if (!data) return
    const blob = new Blob([exportJson(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `atlas-backup-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [data])

  const downloadCsv = useCallback(() => {
    if (!data) return
    const blob = new Blob([exportCsv(data)], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `atlas-export-${todayISO()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [data])

  const restoreJson = useCallback((raw: string) => {
    const next = importJson(raw)
    saveData(next)
    setData(next)
    setSessionUnlocked(true)
    setUnlocked(true)
  }, [])

  const value = useMemo<AtlasContextValue>(
    () => ({
      ready: true,
      unlocked,
      needsSetup: data == null,
      data,
      setupPin,
      unlock,
      lock,
      addGoal,
      updateGoal,
      deleteGoal,
      addMilestone,
      updateMilestone,
      deleteMilestone,
      linkTaskToMilestone,
      unlinkTaskFromMilestone,
      addTask,
      updateTask,
      deleteTask,
      addJournal,
      updateJournal,
      deleteJournal,
      setTodayFocus,
      toggleTodayFocus,
      updateFy,
      changePin,
      downloadJson,
      downloadCsv,
      restoreJson,
    }),
    [
      unlocked,
      data,
      setupPin,
      unlock,
      lock,
      addGoal,
      updateGoal,
      deleteGoal,
      addMilestone,
      updateMilestone,
      deleteMilestone,
      linkTaskToMilestone,
      unlinkTaskFromMilestone,
      addTask,
      updateTask,
      deleteTask,
      addJournal,
      updateJournal,
      deleteJournal,
      setTodayFocus,
      toggleTodayFocus,
      updateFy,
      changePin,
      downloadJson,
      downloadCsv,
      restoreJson,
    ],
  )

  return <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>
}

export function useAtlas() {
  const ctx = useContext(AtlasContext)
  if (!ctx) throw new Error('useAtlas must be used within AtlasProvider')
  return ctx
}
