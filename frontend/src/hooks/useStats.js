import { useState, useEffect, useCallback } from 'react'
import { fetchStats } from '../services/api'
import { useApp } from '../context/AppContext'

const FALLBACK = { total_records: 0, files_processed: 0, total_columns: 0, new_columns_added: 0 }

export function useStats() {
  const { statsVersion, uploadHistory } = useApp()
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchStats()
      // Merge backend total_records with local files_processed count
      setStats({
        ...FALLBACK,
        ...res.data,
        files_processed: uploadHistory.length,
      })
    } catch {
      setStats({
        ...FALLBACK,
        files_processed: uploadHistory.length,
      })
    } finally {
      setLoading(false)
    }
  }, [statsVersion, uploadHistory.length]) // re-run whenever an upload completes

  useEffect(() => { load() }, [load])

  return { stats, loading, reload: load }
}
