# StudyFlax — Frontend

React + Vite frontend for StudyFlax. For the full project setup, seeded access credentials, and recommended Nix workflow, see the [root README](../../README.md).

## Overview

This frontend is a React single-page application built with Vite. It communicates with the Django backend over REST endpoints, using `/api` in local development.

## Recommended Setup

The recommended way to run the full project is from the repository root with the Nix commands documented in the root README:

```bash
nix --extra-experimental-features 'nix-command flakes' run .#init
nix --extra-experimental-features 'nix-command flakes' run .#run
```

That workflow installs frontend dependencies automatically and starts both the backend and frontend together.

## Frontend-Only Development

If you want to work on the frontend by itself, use the `frontend/` directory:

```bash
npm ci
npm run dev
```

Useful additional commands:

```bash
npm run build
npm run preview
npm run lint
```

By default, the Vite development server runs on:

- `http://127.0.0.1:5173`

In frontend-only development, the local Vite config proxies `/api` requests to the backend on:

- `http://localhost:8000`

When you use the root `nix run .#run` workflow instead, the frontend and backend ports are chosen dynamically and printed in the terminal when the servers start.

## Environment Variables

Optional frontend environment variables:

- `VITE_API_BASE_URL`
- `VITE_MAPBOX_TOKEN`
- `VITE_TFL_API_KEY`

These should not be hard-coded into documentation or committed with real secrets for submission. If omitted, optional features that depend on external APIs may not function locally.

## Testing

The main frontend test commands are:

```bash
npm run test
npm run test:watch
npm run test:ui
npm run coverage
npm run coverage:homepage
npm run coverage-report-clover
```

Additional project test-audit helpers:

```bash
npm run test:audit-dead
npm run test:check-spacing
npm run test:fix-spacing
```

Tests live in `src/tests/` and broadly mirror the feature structure of `src/`.

## Tech Stack

- **React 19** for UI
- **Vite 7** for bundling and dev server
- **React Router 7** for routing
- **Material UI** and **styled-components** for interface work
- **Framer Motion** for animation
- **Mapbox GL** for map-based features
- **Vitest** and **Testing Library** for frontend tests

## Structure

```text
frontend/
├── public/                  # Static assets served directly
├── src/
│   ├── api/                 # Frontend API clients
│   ├── app/                 # App bootstrapping and top-level wiring
│   ├── assets/              # Project assets used by the frontend
│   ├── components/          # Shared and feature components
│   ├── context/             # React context providers
│   ├── hooks/               # Reusable hooks
│   ├── layout/              # Layout and navigation structure
│   ├── lib/                 # Small supporting library-style utilities
│   ├── pages/               # Route-level pages
│   ├── styles/              # Global styling
│   ├── tests/               # Vitest test suites
│   └── utils/               # Pure helper functions
├── scripts/                 # Frontend-specific maintenance/test scripts
├── package.json             # Frontend scripts and dependencies
└── vite.config.js           # Vite + Vitest configuration
```
