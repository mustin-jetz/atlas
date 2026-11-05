import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AtlasProvider, useAtlas } from './context/AtlasContext'
import { DashboardPage } from './pages/DashboardPage'
import { GoalDetailPage } from './pages/GoalDetailPage'
import { JournalPage } from './pages/JournalPage'
import { SearchPage } from './pages/SearchPage'
import { SettingsPage } from './pages/SettingsPage'
import { TasksPage } from './pages/TasksPage'
import { TodayPage } from './pages/TodayPage'
import { UnlockPage } from './pages/UnlockPage'

function Gate() {
  const { unlocked, needsSetup } = useAtlas()
  if (!unlocked || needsSetup) return <UnlockPage />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="goals/:goalId" element={<GoalDetailPage />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="journal" element={<JournalPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AtlasProvider>
      <HashRouter>
        <Gate />
      </HashRouter>
    </AtlasProvider>
  )
}
