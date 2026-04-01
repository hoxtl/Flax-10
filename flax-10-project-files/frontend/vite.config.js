import { defineConfig } from 'vite'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import react from '@vitejs/plugin-react'
import postcssImport from 'postcss-import'
import { patchCssModules } from 'vite-css-modules'
import { fileURLToPath, URL } from 'node:url'

/** Vitest forwards CLI args; bundled config still runs in the main vitest process. */
const coverageRun = process.argv.some(
  (arg) => arg === '--coverage' || arg.startsWith('--coverage.') || arg.startsWith('--coverage='),
)

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
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
    patchCssModules(),
    react(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: true,
    pool: 'forks',
    testTimeout: 15000,
    // Istanbul + all:true + CLI --coverage.include can delete/race on coverage/.tmp (ENOENT). Prefer all:false;
    // use `npm run coverage -- --coverage.all=true` when you need untested files in the report.
    ...(coverageRun ? { fileParallelism: false, maxWorkers: 1 } : {}),
    coverage: {
      provider: 'istanbul',
      reporter: ["text", "text-summary", "html", "lcov"],
      reportOnFailure: true,
      all: false,
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'node_modules/',
        'src/main.jsx',
        'src/**/*.test.{js,jsx}',
        'src/tests/**',
        '**/*.config.js',
        'src/setupTests.js',
        'src/pages/homepage/components/rightNowUtils.js',
        'src/pages/homepage/components/useSemesterOverviewData.js',
      ],
      // Uncomment to enforce 100% coverage once achieved:
      // thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
})
