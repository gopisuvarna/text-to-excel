import axios from 'axios'

const api = axios.create({
  // Use VITE_API_URL env var so production builds point to the right host.
  // Falls back to localhost:8000 for local development.
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  timeout: 120_000,
})

/** POST /upload — accepts array of File objects */
export const uploadFiles = (files, onProgress) => {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  return api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })
}

/** GET /download — triggers browser file-save */
export const downloadExcel = async () => {
  const res = await api.get('/download', { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const a   = document.createElement('a')
  a.href     = url
  a.download = 'master_inventory.xlsx'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

/** GET /schema */
export const fetchSchema = () => api.get('/schema')

/** GET /stats */
export const fetchStats  = () => api.get('/stats')
