import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const HISTORY_KEY  = 'inv_upload_history'
const DARKMODE_KEY = 'inv_dark_mode'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  /* ── Upload history (localStorage-persisted) ── */
  const [uploadHistory, setUploadHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') }
    catch { return [] }
  })

  /* ── Stats refresh counter ── */
  const [statsVersion, setStatsVersion] = useState(0)

  /* ── Dark mode ── */
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem(DARKMODE_KEY) === 'true' }
    catch { return false }
  })

  /* Sync dark class on <html> */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem(DARKMODE_KEY, darkMode)
  }, [darkMode])

  /* Persist history */
  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(uploadHistory.slice(0, 100))) }
    catch { /* quota */ }
  }, [uploadHistory])

  const addUploadRecord = useCallback((record) => {
    setUploadHistory((prev) => [record, ...prev])
    setStatsVersion((v) => v + 1)
  }, [])

  const clearHistory = useCallback(() => {
    setUploadHistory([])
    localStorage.removeItem(HISTORY_KEY)
  }, [])

  const toggleDark = useCallback(() => setDarkMode((d) => !d), [])

  return (
    <AppContext.Provider value={{ uploadHistory, addUploadRecord, clearHistory, statsVersion, darkMode, toggleDark }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
