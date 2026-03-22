import { defineConfig } from 'vite'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  build: {
    manifest: true,
	emptyOutDir: true,
	rollupOptions: {
      input: {
        main: resolve(__dirname, "src/main.jsx"),
      },
    },
  },
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: true,
    coverage: {
      provider: 'istanbul',
      reporter: ["text", "text-summary", "html", "lcov"],
      reportOnFailure: true,
      all: true,
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'node_modules/',
        'src/main.jsx',
        'src/**/*.test.{js,jsx}',
        'src/tests/**',
        '**/*.config.js',
        'src/setupTests.js',
      ],
      // Uncomment to enforce 100% coverage once achieved:
      // thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
})