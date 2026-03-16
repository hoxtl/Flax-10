import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/context/*.node.test.js'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'text-summary'],
      reportOnFailure: true,
      all: true,
      include: ['src/context/TagContext.jsx', 'src/context/TimerContext.jsx'],
      exclude: [],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
