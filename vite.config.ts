import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base must match the GitHub repo name for project Pages:
// https://mustin-jetz.github.io/atlas/
export default defineConfig({
  plugins: [react()],
  base: '/atlas/',
})
