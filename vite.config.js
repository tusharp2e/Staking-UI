import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Expose env variables globally (optional)
    'process.env': {}, // Only needed if legacy code expects process.env
  },
})
