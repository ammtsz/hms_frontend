# Setup Guide

Quick start guide for installing and running the Healthcare Management System frontend.

> **Documentation map:** see [docs/README.md](./README.md) for the canonical guide to the frontend docs.

## 📋 Prerequisites

### Required Software

- **Node.js 20+** and npm
- **Git** for version control
- **Code editor** (VS Code recommended)

### Backend Requirement

This frontend requires the backend API to be running. See the [backend repository](https://github.com/ammtsz/hms_backend) for setup instructions.

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/ammtsz/hms_frontend.git
cd hms-frontend
```

### 2. Install Dependencies

```bash
npm install
```

This installs:

- Next.js 16.2.6+, React 19, TypeScript 5
- React Query 5, Zustand 5
- TailwindCSS 4, Axios
- Jest 29, React Testing Library 16

### 3. Configure Environment

Create a `.env.local` file in the project root:

```bash
# Private backend URL — used by Server Actions and API route handlers only.
# Do NOT prefix with NEXT_PUBLIC_. This value is never sent to the browser.
API_URL=http://localhost:3002

# Must match backend JWT_SECRET (proxy.ts signature check)
JWT_SECRET=CHANGE_ME_same_as_backend

# Optional locally: must match backend when set (openssl rand -base64 32)
# BFF_INTERNAL_SECRET=

# Development settings
NODE_ENV=development

# Clinic timezone (fixed per deployment; must match backend CLINIC_TIMEZONE)
NEXT_PUBLIC_CLINIC_TIMEZONE=America/Sao_Paulo
```

> **Note:** `JWT_SECRET` must also be set here because `proxy.ts` verifies
> access token signatures locally on the Edge Runtime (server-side, never sent
> to the browser). It must match the backend value exactly.
> `JWT_REFRESH_SECRET` is NOT needed in the frontend — refresh tokens are
> validated by the backend only.
>
> The backend typically runs on port 3002. Adjust `API_URL` if different.
> Set `CLINIC_TIMEZONE=America/Sao_Paulo` on the backend with the same fixed
> IANA value as `NEXT_PUBLIC_CLINIC_TIMEZONE`. The clinic timezone is a
> deployment setting; users do not pick timezones in the UI.

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

**Development Server Features:**

- Hot module replacement
- Fast refresh for React components
- TypeScript compilation on save
- TailwindCSS with JIT mode

## 📋 Available Commands

### Development

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm start            # Start production server
```

### Testing

```bash
npm test                        # Run all tests
npm test -- --watch            # Run tests in watch mode
npm test -- --coverage         # Run tests with coverage report
npm test -- MyComponent        # Run specific test file
npm test -- --clearCache       # Clear Jest cache
```

### Code Quality

```bash
npm run lint                   # Run ESLint
npx tsc --noEmit              # Check TypeScript errors
```

### Bundle Analysis

```bash
npm run analyze                # Generate bundle analysis
npm run bundle-report          # View bundle report in browser
npm run bundle-size            # Quick bundle size check
```

## 🔧 IDE Setup

### VS Code (Recommended)

**Install Extensions:**

- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)

**Settings (.vscode/settings.json):**

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## 📁 Project Structure Overview

```
hms-frontend/
├── src/                      # Source code
│   ├── api/                  # HTTP clients + shared API types
│   │   ├── <resource>/       # e.g. patients/, attendances/, treatments/
│   │   └── query/
│   │       ├── hooks/        # React Query hooks
│   │       ├── keys/         # Query key factories
│   │       └── invalidation/ # Shared cache invalidation helpers
│   ├── app/                  # Next.js pages (App Router)
│   ├── features/             # Feature modules (attendance, patients, …)
│   ├── components/           # Shared UI: auth/, common/, layout/, ui/
│   ├── contexts/             # React Context providers
│   ├── hooks/                # Cross-feature non-query hooks
│   ├── stores/               # Zustand stores
│   ├── types/                # TypeScript types
│   ├── utils/                # Helpers (incl. testUtils.tsx for tests)
│   └── providers/            # App-level providers (e.g. QueryClient)
├── public/                   # Static assets
├── docs/                     # Documentation
│   ├── README.md             # Documentation hub
│   ├── ARCHITECTURE.md       # System architecture
│   ├── AUTHENTICATION.md     # Auth flow and security notes
│   ├── SETUP.md              # Local onboarding and environment setup
│   └── TESTING_CHECKLIST.md  # Manual QA and regression checklist
├── .next/                    # Build output (gitignored)
├── node_modules/             # Dependencies (gitignored)
└── Configuration files
```

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## 🚢 Deployment

### Build for Production

```bash
# Build
npm run build

# Start production server
npm start
```

Server runs on port 3000 by default.

### Environment Variables (Production)

```env
# Private backend URL (server-only — NOT prefixed with NEXT_PUBLIC_)
API_URL=https://your-backend-api.com
BFF_INTERNAL_SECRET=<same value as Railway>
JWT_SECRET=<same value as backend>
NODE_ENV=production
NEXT_PUBLIC_CLINIC_TIMEZONE=America/Sao_Paulo
```

> **Do NOT** set `NEXT_PUBLIC_API_URL` for server-side code. Add it only if a
> legacy client utility requires it, and ensure it is never used in Server
> Actions or API route handlers.

### Deployment Platforms

**Vercel (Recommended):**

```bash
npm install -g vercel
vercel
```

**Railway/Render:**

- Build command: `npm run build`
- Start command: `npm start`
- Node version: 18+

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Module Not Found Errors

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### Test Failures

```bash
# Clear Jest cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose
```

### TypeScript Errors

```bash
# Check all type errors
npx tsc --noEmit

# Restart TS server (VS Code)
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Build Errors

```bash
# Clean build artifacts
rm -rf .next

# Rebuild
npm run build
```

### Dependencies Issues

```bash
# Clear npm cache
npm cache clean --force

# Remove lock file and reinstall
rm package-lock.json
rm -rf node_modules
npm install
```

## 🔍 Verifying Installation

After setup, verify everything works:

1. **Development server starts:**

   ```bash
   npm run dev
   # Should see: Ready - started server on 0.0.0.0:3000
   ```

2. **Tests pass:**

   ```bash
   npm test
   # Should see: 3,771 tests passing
   ```

3. **No TypeScript errors:**

   ```bash
   npx tsc --noEmit
   # Should complete with no errors
   ```

4. **Production build works:**
   ```bash
   npm run build
   # Should complete successfully
   ```

## 📊 Test Coverage

Current test metrics:

- **Tests:** 3,771 passing (264 test suites)
- **Statements:** 80.87%
- **Branches:** 69.03%
- **Functions:** 74.01%
- **Lines:** 80.91%

Run `npm test -- --coverage` to view detailed coverage report.

## 🆘 Getting Help

- **Setup issues:** Check this document first
- **Architecture questions:** See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Auth/security questions:** See [AUTHENTICATION.md](./AUTHENTICATION.md)
- **QA and verification:** See [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)
- **Documentation map:** See [README.md](./README.md)
- **GitHub issues:** Search or create new issue

## 📚 Next Steps

After setup is complete:

1. Review [README.md](./README.md) for the documentation map
2. Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system
3. Review [AUTHENTICATION.md](./AUTHENTICATION.md) before changing auth flows
4. Use [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) before releases or regressions
5. Run tests frequently during development

---

**Last Updated:** May 2026
**Next.js Version:** 16.2.6+
**Node Version Required:** 20+

**Auth & security deploy:** See [AUTHENTICATION.md](./AUTHENTICATION.md)
