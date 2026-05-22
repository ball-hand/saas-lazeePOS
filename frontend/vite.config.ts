import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Wajib agar bisa diakses dari luar Docker (Nginx)
    port: 5173, // Port default Vite
  },
})
