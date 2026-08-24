import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    },
    fs: {
      allow: ['..']
    }
  },
  resolve: {
    alias: {
      '/IMAGES': path.resolve(__dirname, '../IMAGES')
    }
  },
  publicDir: 'public'
})
