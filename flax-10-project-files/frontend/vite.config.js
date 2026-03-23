import { defineConfig } from 'vite'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import react from '@vitejs/plugin-react'
import postcssImport from 'postcss-import'
import { viteCssModules } from 'vite-css-modules'

// https://vite.dev/config/
export default defineConfig({
  build: {
    manifest: true,
    emptyOutDir: true,
  },
  css: {
    postcss: {
      plugins: [
        postcssImport(), // resolves @import in .module.css before CSS Modules scoping
      ],
    },
  },
  plugins: [
    viteCssModules(),
    react(),
  ],
  server: {
    host: '127.0.0.1',
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
    pool: 'threads',
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
