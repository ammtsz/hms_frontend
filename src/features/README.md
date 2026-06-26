# Feature Modules

Feature folders own route-level or workflow-specific UI, hooks, utilities, and tests that do not belong in shared app code.

## Standard shape

```text
src/features/<feature>/
├── index.tsx
├── components/
├── hooks/
├── utils/
└── __tests__/
```

## Naming rules

- Use lowercase for one-word feature folders: `board`, `patients`
- Use PascalCase for component folders and component files inside `components/`
- Use lowercase for `hooks/`, `utils/`, and similar helper folders
- Avoid kebab-case under `src/features/`
- Use kebab-case only under `src/app/` and `src/api/`

## Example layout

```text
src/features/board/
├── components/
│   ├── Board/
│   ├── Cards/
│   ├── Scheduling/
│   └── WalkIn/
├── hooks/
├── utils/
└── __tests__/
```

## Where shared code goes

- `src/components/ui` for reusable primitives
- `src/components/layout` for app shell pieces
- `src/components/common` for transitional shared components
- `src/api/query/hooks` for React Query hooks
- `src/hooks` for cross-feature non-query hooks
- `src/testFixtures/` for shared Jest mocks (e.g. `physiotherapyContext.ts`)

Keep code inside the feature only when it is owned by that feature.
