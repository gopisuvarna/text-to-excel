import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Dev proxy — routes API calls to local FastAPI during development.
    // In production (Vercel) VITE_API_URL points directly to Render, so proxy is not used.
    proxy: {
      '/upload':   'http://localhost:8000',
      '/download': 'http://localhost:8000',
      '/schema':   'http://localhost:8000',
      '/stats':    'http://localhost:8000',
      '/health':   'http://localhost:8000',
    },
  },
})
