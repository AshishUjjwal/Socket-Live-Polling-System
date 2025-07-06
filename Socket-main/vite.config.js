import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/socket.io': {
        target: 'https://socket-live-polling-system-gnbr-q3uxviqvy.vercel.app', // your backend
        ws: true,                         // enable websocket proxying
        changeOrigin: true,
      },
      '/api': {
        target: 'https://socket-live-polling-system-gnbr-q3uxviqvy.vercel.app', // same backend for REST
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
