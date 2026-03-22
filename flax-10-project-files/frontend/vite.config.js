import { defineConfig } from 'vite'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import react from '@vitejs/plugin-react'

const CSS_IMPORT_RE = /^\s*@import\s+["'](.+?\.css)["'];\s*$/gm

// Inline nested CSS-module barrel imports before Vite emits the final bundle so
// production CSS never points the browser at non-emitted source module paths.
function inlineCssModuleImports() {
  function expandCss(code, id, seen = new Set()) {
    return code.replace(CSS_IMPORT_RE, (_match, importPath) => {
      const resolvedPath = resolve(dirname(id), importPath)
      if (seen.has(resolvedPath)) return ''
      const importedCss = readFileSync(resolvedPath, 'utf8')
      const nextSeen = new Set(seen)
      nextSeen.add(resolvedPath)
      return `/* inlined from ${importPath} */\n${expandCss(importedCss, resolvedPath, nextSeen)}\n`
    })
  }

  return {
    name: 'inline-css-module-imports',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.module.css') || !code.includes('@import')) return null
      return { code: expandCss(code, id), map: null }
    },
  }
}

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
  plugins: [inlineCssModuleImports(), react()],
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
