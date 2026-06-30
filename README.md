# Healthcare Management System – Frontend

Frontend for a healthcare management system originally built for a community health center in Brazil and later adapted to a physiotherapy workflow for public documentation.

**Status:** ✅ Deployed and operational | 🔄 Active development

## Overview

This app is a Next.js frontend with:

- React 19 and TypeScript
- React Query for server state
- Zustand for client UI state
- TailwindCSS for styling
- JWT-based authentication with HTTP-only cookies and a BFF proxy layer

## Prerequisites

- Node.js 20 or newer
- The backend API running locally on port `3002` or an equivalent environment
- A valid local environment file in the frontend root

## Environment Variables

Create a .env.local file with the values required by the frontend and auth flow.

```bash
API_URL=http://localhost:3002
JWT_SECRET=your_shared_secret
BFF_INTERNAL_SECRET=your_shared_secret
NEXT_PUBLIC_CLINIC_TIMEZONE=America/Vancouver
```

If you use the BFF auth flow, also set BFF_INTERNAL_SECRET to the same value as the backend.
The clinic timezone is fixed by environment variable; users do not select timezones in the UI.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000 after the backend is available.

## Available Scripts

- `npm run dev` – start the development server
- `npm run build` – build for production
- `npm run start` – start the production server
- `npm test` – run the Jest test suite
- `npm run test:cov` – run tests with coverage
- `npm run lint` – run linting
- `npm run verify:paths` – validate refactor-safe import paths
- `npm run verify:import-casing` – validate import casing

## Testing & Quality

**Test Suite:**

- 3,491 tests passing across 260 test suites
- ~40 seconds execution time locally
- Zero failing tests

**Coverage** (`npm test -- --coverage`, June 2026):

- Statements: ~81% (run locally for current branch/line/function breakdown)

**Testing Strategy:**

- Co-located tests in `__tests__` folders
- Shared fixtures in `src/testFixtures/physiotherapyContext.ts` for consultation/treatment mocks
- Component, hook, and integration coverage
- Mocked API responses and dependencies

## Core Features

- Protected routes with session-aware navigation
- Appointment, schedule, patient, treatment, and settings flows
- Clinic timezone formatting and read-only display
- Drag-and-drop workflow for appointment management
- Server-side authentication with secure cookie handling

## Documentation

- [Documentation Hub](./docs/README.md) – Canonical entry point for frontend docs
- [Setup Guide](./docs/SETUP.md) – Local onboarding and environment setup
- [Architecture](./docs/ARCHITECTURE.md) – Project structure and design patterns
- [Authentication](./docs/AUTHENTICATION.md) – Auth flow and session management
- [Testing Checklist](./docs/TESTING_CHECKLIST.md) – QA and testing procedures
- [API Layer](./src/api/README.md) – API client and data fetching
- [Feature Modules](./src/features/README.md) – Feature structure and organization
- [Zustand Stores](./src/stores/README.md) – State management patterns

## Notes

- The app uses same-origin `/api` traffic in the browser; the backend must be running for most features.
- The architecture and authentication docs are the source of truth for implementation details.
