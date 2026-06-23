# Zustand Stores

Local UI and workflow state for the frontend.

## What lives here

```text
src/stores/
├── index.ts
├── boardStore.ts
├── boardSelectors.ts
├── scheduleStore.ts
├── scheduleSelectors.ts
├── modalStore.ts
└── __tests__/
```

## Store responsibilities

- `boardStore.ts`: appointment date, drag state, loading, and end-of-day workflow
- `boardSelectors.ts`: optimized selectors for appointment subscriptions
- `scheduleStore.ts`: calendar navigation, filters, and schedule UI state
- `scheduleSelectors.ts`: optimized selectors for schedule subscriptions
- `modalStore.ts`: shared modal and dialog state for appointment workflows

## Usage

```typescript
import { useBoardStore, useScheduleStore } from "@/stores";
import { useOpenCancellation } from "@/stores/modalStore";

const selectedDate = useBoardStore((state) => state.selectedDate);
const navigateToDate = useScheduleStore((state) => state.navigateToDate);
```

## Notes

- Use the barrel export in `@/stores` for appointment and schedule state
- Import modal state directly from `@/stores/modalStore`
- Prefer selectors when a component only needs one field or action
- Keep server data in React Query, not in Zustand
