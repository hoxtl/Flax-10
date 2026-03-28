# StudyFlax — Frontend

React + Vite frontend for StudyFlax. See the [root README](../../README.md) for full installation instructions, access credentials, and project overview.

## Tech Stack

- **React 19** — UI component library
- **Vite 7** — build tool and development server
- **Framer Motion** — animations
- **Vitest** — unit and integration testing

## Development

```bash
npm install
npm run dev        # starts dev server on http://localhost:5173
npm run build      # production build
```

## Testing

```bash
npm run test              # run all tests
npm run coverage          # run tests with coverage report
```

Tests live in `src/tests/` and mirror the structure of `src/`.

## Structure

```
src/
├── api/           # API client functions (one file per backend domain)
├── components/    # Shared and feature-specific React components
├── context/       # React context providers (auth, theme, toast)
├── hooks/         # Custom React hooks
├── layout/        # Dashboard shell and navigation layout
├── pages/         # Top-level page components
├── styles/        # Global CSS
├── tests/         # Vitest test suites
└── utils/         # Pure utility functions
```
