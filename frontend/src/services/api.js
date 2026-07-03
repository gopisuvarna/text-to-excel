import axios from 'axios'

// VITE_API_URL is injected at Vercel build time from:
//   - frontend/.env.production  (committed, contains public Render URL)
//   - OR Vercel Dashboard → Settings → Environment Variables → VITE_API_URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  // 3 min — covers Render free-tier cold start (~60s) + LLM extraction time
  timeout: 180_000,
})

// Intercept errors to provide cleaner messages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response) {
      // No response at all = network / CORS / server down
      err.message =
        'Cannot reach the backend. The server may be starting up (Render free tier takes ~60s). ' +
        'Please wait a moment and try again.'
    }
    return Promise.reject(err)
  }
)

/** Ping /health — use before first upload to wake Render if it's cold */
export const pingHealth = () =>
  api.get('/health', { timeout: 10_000 }).catch(() => null) // never throws

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
