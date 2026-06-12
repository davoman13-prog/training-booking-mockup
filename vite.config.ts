import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/training-booking-mockup/',
  plugins: [react()],
  server: {
    port: 4173,
  },
})
