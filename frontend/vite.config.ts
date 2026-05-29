/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      'lazeepos.local',
      'lazeepos'
    ],
    host: true, // Wajib agar bisa diakses dari luar Docker (Nginx)
    port: 5173, // Port default Vite
    // HMR via Nginx (Docker): baca dari env vars, tidak berpengaruh saat dev lokal
    hmr: process.env.VITE_HMR_PORT
      ? { clientPort: parseInt(process.env.VITE_HMR_PORT), host: process.env.VITE_HMR_HOST }
      : true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
})
