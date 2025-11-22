import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true, // ← This allows ALL hosts
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://verdent-production.up.railway.app',
        changeOrigin: true,
      }
    }
  }
})
