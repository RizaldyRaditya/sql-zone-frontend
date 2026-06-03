import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    middlewareMode: false,
    // Ensure all non-file routes fallback to index.html for SPA
    fs: {
      strict: false,
    },
  },
  // Build config untuk production SPA
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
