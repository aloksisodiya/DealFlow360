import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all local IPs including 127.0.0.1 and localhost
    port: 5173,
    strictPort: true
  }
})
