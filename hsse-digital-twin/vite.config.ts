import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset URLs so the build runs from any sub-path (static hosts, previews).
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    // The lazily-loaded 3D chunk is mostly three.js itself (~1 MB min / ~270 kB gzip).
    chunkSizeWarningLimit: 1100,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
