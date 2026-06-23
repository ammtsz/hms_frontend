# HMS Frontend Copilot Instructions

Keep suggestions aligned with the docs in ./docs and the rule files under ./.cursor/rules.

## Working rules

- Prefer the existing feature-based structure under src/app, src/api, src/components, src/features, src/hooks, src/stores, src/types, and src/utils.
- Add or update tests with the change. Co-locate tests in **tests** folders and follow the existing Jest + RTL patterns.
- Use TypeScript strict mode, avoid any, and remove unused code.
- Use the shared axios client in src/api/lib/axios.ts and rely on the existing case-conversion interceptors.
- Use React Query for server data, Zustand for UI state, and Context only for stable global settings.
- Use YYYY-MM-DD strings for calendar dates and the timezone helpers from src/utils/timezoneDate.ts or src/hooks/useDateHelpers.ts.
- Preserve the current auth/BFF flow, appointment grouping rules, and responsive modal/table patterns.

## Before changing behavior

- Check the relevant docs in ./docs before changing workflows or architecture.
- Update documentation only when the change affects project structure, public behavior, or setup.
- Keep changes small and reuse existing helpers, hooks, and shared UI components.
