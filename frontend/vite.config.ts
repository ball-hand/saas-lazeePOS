/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      '6f61-2404-c0-2c10-00-1e9c-647b.ngrok-free.app'
    ],
    host: true, // Wajib agar bisa diakses dari luar Docker (Nginx)
    port: 5173, // Port default Vite
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
})
