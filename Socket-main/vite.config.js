import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001', // your backend
        ws: true,                         // enable websocket proxying
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3001', // same backend for REST
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
