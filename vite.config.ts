import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const githubPagesBasePath = process.env.GITHUB_PAGES_BASE_PATH ?? '/kanban-design/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? githubPagesBasePath : '/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.ts',
    css: true,
  },
}))
