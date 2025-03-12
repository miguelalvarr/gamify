import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5179,
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'gamify-npnc.onrender.com',
      '.onrender.com'
    ]
  },
  preview: {
    port: 10000,
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'gamify-npnc.onrender.com',
      '.onrender.com'
    ]
  },
  build: {
    outDir: 'dist',
  },
  base: './'
})