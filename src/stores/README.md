# Zustand Stores

Local UI and workflow state for the frontend.

## What lives here

```text
src/stores/
├── index.ts
├── attendanceStore.ts
├── attendanceSelectors.ts
├── scheduleStore.ts
├── scheduleSelectors.ts
├── modalStore.ts
└── __tests__/
```

## Store responsibilities

- `attendanceStore.ts`: attendance date, drag state, loading, and end-of-day workflow
- `attendanceSelectors.ts`: optimized selectors for attendance subscriptions
- `scheduleStore.ts`: calendar navigation, filters, and schedule UI state
- `scheduleSelectors.ts`: optimized selectors for schedule subscriptions
- `modalStore.ts`: shared modal and dialog state for attendance workflows

## Usage

```typescript
import { useAttendanceStore, useScheduleStore } from "@/stores";
import { useOpenCancellation } from "@/stores/modalStore";

const selectedDate = useAttendanceStore((state) => state.selectedDate);
const navigateToDate = useScheduleStore((state) => state.navigateToDate);
```

## Notes

- Use the barrel export in `@/stores` for attendance and schedule state
- Import modal state directly from `@/stores/modalStore`
- Prefer selectors when a component only needs one field or action
- Keep server data in React Query, not in Zustand
