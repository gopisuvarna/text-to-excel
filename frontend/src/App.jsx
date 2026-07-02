import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar     from './components/Sidebar'
import Header      from './components/Header'
import Dashboard   from './pages/Dashboard'
import UploadPage  from './pages/UploadPage'
import HistoryPage from './pages/HistoryPage'
import { AppProvider } from './context/AppContext'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden bg-surface dark:bg-dark-bg transition-colors duration-300">

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto">
            <div className="p-5 md:p-7 lg:p-8 max-w-screen-xl mx-auto">
              <Routes>
                <Route path="/"        element={<Dashboard  />} />
                <Route path="/upload"  element={<UploadPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="*"        element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>

      </div>
    </AppProvider>
  )
}
