import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    minify: false, // Disable minification to preserve React DevTools
    sourcemap: true,
  },
  esbuild: {
    drop: [], // Don't drop console/debugger - keeps React DevTools working
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
  },
})
