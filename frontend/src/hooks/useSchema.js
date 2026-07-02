import { useState, useEffect, useCallback } from 'react'
import { fetchSchema } from '../services/api'
import { useApp } from '../context/AppContext'

const BASE_SCHEMA = [
  'Model', 'Direction', 'Date', 'Tag No',
  'Serial No', 'Type/Description', 'Recipient/Team', 'Notes',
]

export function useSchema() {
  const { statsVersion } = useApp() // refresh schema after every upload
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchSchema()
      setColumns(res.data?.columns ?? BASE_SCHEMA)
    } catch {
      setColumns(BASE_SCHEMA)
    } finally {
      setLoading(false)
    }
  }, [statsVersion])

  useEffect(() => { load() }, [load])

  return { columns, loading, reload: load }
}
