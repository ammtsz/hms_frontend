# Architecture & Technical Reference

Comprehensive technical architecture documentation for the Healthcare Management System frontend.

## 🏗 System Overview

The application follows a modern React architecture with clear separation of concerns:

- **Presentation Layer** - React components with co-located tests
- **State Management** - Hybrid React Query + Zustand pattern
- **Business Logic** - Custom hooks and utility functions
- **API Integration** - Type-safe API layer with automatic transformations
- **Routing** - Next.js App Router with file-based routing

## 📚 Technology Stack

### Core Framework

- **Next.js 16.2.6+** - React framework with App Router, `proxy.ts` route protection, and optimized bundling
- **React 19** - UI library with concurrent features and automatic batching
- **TypeScript 5** - Strict type checking and enhanced developer experience

### State Management (Hybrid Pattern)

**Server State** - React Query 5

- Data fetching and caching
- Automatic background refetching
- Optimistic updates
- Request deduplication
- Cache invalidation

**Client State** - Zustand 5

- UI state (modals, selections, drag state)
- Workflow state (day finalization)
- Ephemeral application state
- DevTools integration

**Global Context** - React Context

- Clinic timezone is resolved at build time from NEXT_PUBLIC_CLINIC_TIMEZONE and exposed through `ClinicTimezoneContext`
- Theme preferences (future)

### Styling & UI

- **TailwindCSS 4** - Utility-first CSS with JIT compiler
- **Custom Components** - Reusable UI components with consistent styling
- **Design Tokens** - Centralized color and spacing definitions

### Testing & Quality

- **Jest 29** - Test runner with coverage reporting
- **React Testing Library 16** - Component testing utilities
- **TypeScript Strict Mode** - Maximum type safety
- **ESLint** - Code quality and consistency

### Data & API

- **Axios** - HTTP client with interceptors (same-origin `/api` base URL)
- **BFF proxy** - Catch-all `src/app/api/[...path]` with allowlisted segments; auth via Server Actions
- **Automatic Case Conversion** - snake_case ↔ camelCase transformation

### Authentication (BFF)

- **Server Actions** - Login/logout call Nest directly with `API_URL` + `x-bff-secret`
- **httpOnly cookies** - Set by Next.js server (`authCookieOptions.ts`), never in client JS
- **proxy.ts** - Page-level JWT signature check (UX gate; Nest `JwtAuthGuard` is authoritative)
- **Env** - `API_URL`, `JWT_SECRET`, `BFF_INTERNAL_SECRET` (server-only; use `API_URL` only)

See [AUTHENTICATION.md](./AUTHENTICATION.md) (including Production Deployment).

## 🎨 Architecture Patterns

### 1. Hybrid State Management Pattern

**Problem:** Complex applications need both server data and UI state.

**Solution:** Use the right tool for each type of state.

```typescript
// ✅ Server State - React Query
const { data: patients, isLoading } = usePatientQueries();

// ✅ Client State - Zustand
const selectedDate = useBoardStore((state) => state.selectedDate);
const setSelectedDate = useBoardStore((state) => state.setSelectedDate);

// ✅ Global Settings - Context
const { clinicTimezone } = useClinicTimezone();
```

**Benefits:**

- Automatic caching and synchronization
- Optimized re-renders
- Clear separation of concerns
- Better performance

### 2. Component Organization Pattern

**File Structure:**

```
src/features/feature-name/
├── index.tsx                # Feature entry point
├── components/              # Private feature components
├── hooks/                   # Feature-only UI/workflow hooks
├── utils/                   # Feature-only utilities
├── __tests__/
│   ├── feature-name.test.tsx
│   └── useFeatureLogic.test.ts
└── styles/ (if complex)
```

Existing folders under `src/components` are migrated incrementally. New or
moved feature modules should prefer `src/features/<feature-name>`, while
`src/components/ui`, `src/components/layout`, and `src/components/common` remain
for domain-free primitives, app shell UI, and transitional shared components.

**Directory naming:** kebab-case under `src/app/` and `src/api/`; under
`src/features/` use lowercase or camelCase folders and PascalCase component
packages. See [src/features/README.md](../src/features/README.md) and
the project [SETUP guide](./SETUP.md).

**Benefits:**

- Co-located tests (easy to maintain)
- Self-contained features
- Clear dependencies
- Easy to delete/refactor

### 3. Custom Hook Pattern

**Single Responsibility Hooks:**

```typescript
// ❌ BAD: God hook doing everything
function useAppointmentEverything() {
  // 500 lines of mixed concerns
}

// ✅ GOOD: Focused hooks
function useDragAndDrop() {
  /* drag logic */
}
function useModalManagement() {
  /* modal state */
}
function useBoardWorkflow() {
  /* business rules */
}
```

**Hook Categories:**

- **Query Hooks** - React Query wrappers in `src/api/query/hooks` (`usePatientQueries.ts`, `useTreatmentsWithSessionRows.ts`)
- **Query Keys** - Cache identity factories in `src/api/query/keys` (import keys from here, not from hooks)
- **Business Logic Hooks** - Feature workflow rules, owned by the feature that uses them (`features/board/hooks/useDragAndDrop.ts`)
- **UI Hooks** - UI state and interactions near their owning feature or component group (`features/board/hooks/useModalManagement.ts`)
- **Form Hooks** - Form handling near the form workflow (`features/patients/form/hooks/usePatientForm.ts`, `features/board/components/Scheduling/hooks/useAppointmentForm.ts`)
- **Shared Non-Query Hooks** - Cross-feature utilities in `src/hooks` (`useDateHelpers.ts`)

### 4. API Integration Pattern

**Type-Safe API Layer:**

```typescript
// 1. Define types
interface Patient {
  id: number;
  name: string;
  birthDate: string; // camelCase
}

// 2. API function - Transformation automatic via interceptors
export async function getPatient(
  id: string,
): Promise<ApiResponse<PatientResponseDto>> {
  try {
    const { data } = await api.get(`/patients/${id}`);
    return { success: true, value: data }; // Already camelCase
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
}

// 3. React Query hook
export function usePatient(id: string) {
  return useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const result = await getPatient(id);
      if (!result.success || !result.value) {
        throw new Error(result.error || "Patient not found");
      }
      return result.value;
    },
    enabled: !!id,
  });
}

// 4. Use in component
function PatientDetail({ id }: Props) {
  const { data: patient, isLoading, error } = usePatient(id);
  // Automatic caching, refetching, error handling
}
```

### 5. Zustand Store Pattern

**Store Structure:**

```typescript
// Store definition
interface AppointmentStore {
  // State
  selectedDate: Date;
  draggedItem: DraggedAppointment | null;

  // Actions
  setSelectedDate: (date: Date) => void;
  setDraggedItem: (item: DraggedAppointment | null) => void;

  // Computed/Async
  checkEndOfDayStatus: () => Promise<boolean>;
}

// Store creation
export const useBoardStore = create<AppointmentStore>()(
  devtools((set, get) => ({
    selectedDate: new Date(),
    draggedItem: null,

    setSelectedDate: (date) => set({ selectedDate: date }),
    setDraggedItem: (item) => set({ draggedItem: item }),

    checkEndOfDayStatus: async () => {
      // Business logic
    },
  })),
);

// Selective subscriptions (performance)
const selectedDate = useBoardStore((state) => state.selectedDate);
const setDate = useBoardStore((state) => state.setSelectedDate);
```

**Selectors Pattern:**

```typescript
// Reusable selectors for consistent access
export const useSelectedDate = () =>
  useBoardStore((state) => state.selectedDate);

export const useSetSelectedDate = () =>
  useBoardStore((state) => state.setSelectedDate);
```

## 🔄 Data Flow

### Read Operations (Queries)

```
Component
    ↓
usePatientQueries() [React Query Hook]
    ↓
getPatient() [API Function]
    ↓
Axios + Interceptors
    ↓
Backend API
    ↓
Response Transformation (snake_case → camelCase)
    ↓
React Query Cache
    ↓
Component Re-render
```

### Write Operations (Mutations)

```
User Action
    ↓
Component Handler
    ↓
useMutation() [React Query]
    ↓
API Function (updatePatient)
    ↓
Axios POST/PUT/DELETE
    ↓
Backend API
    ↓
Success Response
    ↓
Cache Invalidation [Automatic]
    ↓
Refetch Related Queries
    ↓
UI Update
```

### UI State Management

```
User Interaction
    ↓
Event Handler
    ↓
Zustand Action (setDraggedItem)
    ↓
Store Update
    ↓
Subscribed Components Re-render [Only affected ones]
```

## 📂 Folder Structure & Responsibilities

Keep the structure section brief and use it as a navigation aid, not a full inventory.

| Area               | Purpose             | Notes                                                 |
| ------------------ | ------------------- | ----------------------------------------------------- |
| `/src/api/`        | Backend integration | CRUD functions, Axios config, response transformation |
| `/src/api/query/`  | React Query layer   | Query hooks, keys, and invalidation helpers           |
| `/src/app/`        | Next.js routes      | Pages, layouts, and route-level UI                    |
| `/src/components/` | Shared UI           | Generic primitives and transitional shared components |
| `/src/features/`   | Feature-owned code  | UI, hooks, and logic that belong to one domain        |
| `/src/hooks/`      | Shared hooks        | Cross-feature non-query logic only                    |
| `/src/stores/`     | Zustand stores      | Client-side UI state and selectors                    |
| `/src/types/`      | Shared types        | Frontend type definitions                             |
| `/src/utils/`      | Utilities           | Pure helpers for dates, forms, and business rules     |

Rules of thumb:

- Keep feature-specific code inside `src/features/<feature>`.
- Use `src/components/ui`, `src/components/common`, and `src/components/layout` for shared UI.
- Keep query keys in `src/api/query/keys` and invalidation helpers in `src/api/query/invalidation`.

## 🔌 Key Integrations

### Timezone System

**Implementation:** Global React Context derived from `NEXT_PUBLIC_CLINIC_TIMEZONE`

```typescript
// Context exposes the resolved clinic timezone
const { clinicTimezone } = useClinicTimezone();

// React components: useDateHelpers(); non-React code: getTodayClinic() / formatDateClinic()
const { getTodayDate, formatDate } = useDateHelpers();
const today = getTodayDate();
const formatted = formatDate(date);
```

**Features:**

- Single clinic-wide timezone configured by environment
- Read-only display in the top navigation
- Automatic date formatting
- Shared frontend/backend timezone value

### Physiotherapy domain model

The app models a **physiotherapy clinic** (not the legacy community-health diet/light-therapy workflow). Key contracts:

| Area | Frontend (camelCase) | Backend / DB (snake_case) | Notes |
|------|----------------------|---------------------------|-------|
| General recommendations | `homeExercises`, `painManagement`, `medications` | `home_exercises`, `pain_management`, `medications` on `hms_consultation` | Replaced legacy food/water/ointments fields |
| Treatment types | `physiotherapy`, `tens` | Same enum on `hms_treatment` / appointments | UI label for TENS is **TENS** (not Electrotherapy) |
| Session duration | `durationMinutes` | `duration_minutes` | Required **30, 45, or 60** minutes for both types |
| Defaults | `DEFAULT_PHYSIOTHERAPY_DURATION_MINUTES` (45), `DEFAULT_TENS_DURATION_MINUTES` (30) | `treatment.constants.ts` / `constants/treatment.ts` | Used in forms and validation |
| Scheduling conflicts | Body location + date + patient | `scheduling-signature.utils` | Same body location blocks duplicate open appointments |
| Appointment display grouping | `groupAppointmentsForDisplayWithBodyLocation()` | — | See [.cursor/rules/11-appointment-grouping.mdc](../.cursor/rules/11-appointment-grouping.mdc) |

**Constants:** `src/constants/treatment.ts` (frontend), `src/common/constants/treatment.constants.ts` (backend).

**Test fixtures:** `src/testFixtures/physiotherapyContext.ts` — shared example copy and `createMockConsultationResponse` / `createMockTreatmentResponse` / `createMockPostConsultationFormData` for unit tests.

**Database:** Schema changes require recreating the DB from `hms-backend/init.sql` (or `railway-init.sql`); there are no incremental migrations for this domain shift.

### Drag & Drop System

**Implementation:** Custom hook with Zustand state

```typescript
function useDragAndDrop() {
  const { draggedItem, setDraggedItem } = useBoardStore();

  const handleDragStart = (item: Appointment) => {
    setDraggedItem(item);
  };

  const handleDrop = async (targetStatus: AppointmentStatus) => {
    await updateAppointmentStatus(draggedItem.id, targetStatus);
    setDraggedItem(null);
    // React Query automatically refetches
  };

  return { handleDragStart, handleDrop };
}
```

**Features:**

- Visual feedback during drag
- Backend synchronization on drop
- Combined treatment handling (physiotherapy + tens)
- Automatic cache invalidation

### Form Handling

**Pattern:** Controlled components with custom hooks

```typescript
function usePatientForm() {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = () => {
    // Validation logic
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    await createPatient(formData);
  };

  return { formData, errors, handleChange, handleSubmit };
}
```

## ⚡ Performance Optimizations

### 1. Code Splitting

**Route-level lazy loading:**

```typescript
const AppointmentsBoard = lazy(
  () => import("@/features/board/AppointmentsBoard")
);

// In page
<Suspense fallback={<LoadingFallback />}>
  <AppointmentsBoard />
</Suspense>;
```

**Result:** 24% bundle size reduction

### 2. React Query Caching

- Automatic background refetching
- Stale-while-revalidate pattern
- Request deduplication
- Prefetching for better UX

### 3. Zustand Selective Subscriptions

```typescript
// ❌ Re-renders on any store change
const store = useBoardStore();

// ✅ Only re-renders when selectedDate changes
const selectedDate = useBoardStore((state) => state.selectedDate);
```

### 4. Memoization

```typescript
// Expensive calculations
const sortedData = useMemo(() => data.sort(complexSortFunction), [data]);

// Stable callbacks
const handleClick = useCallback(() => {
  doSomething(data);
}, [data]);
```

## 🧪 Testing Strategy

### Test Organization

- All tests in `__tests__/` folders
- Co-located with source code
- Comprehensive coverage (~81% statements on full `src/` run; see `npm test -- --coverage`)

### Test Types

**Unit Tests** - Components and hooks in isolation

```typescript
it("renders patient name", () => {
  render(<PatientCard patient={mockPatient} />);
  expect(screen.getByText("John Doe")).toBeInTheDocument();
});
```

**Integration Tests** - Multiple components working together

```typescript
it("completes appointment workflow", async () => {
  render(<AppointmentsBoard />);
  // Simulate user interactions
  // Verify end state
});
```

**Hook Tests** - Custom hook behavior

```typescript
it("fetches patient data", async () => {
  const { result } = renderHook(() => usePatient(1));
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBeDefined();
});
```

### Mocking Strategy

- Mock API calls with MSW or manual mocks
- Prefer `src/testFixtures/physiotherapyContext.ts` for consultation and treatment test data (physiotherapy-aligned field names and durations)
- Factory functions for other domains; keep mocks aligned with `constants/treatment.ts` (30 / 45 / 60 min)
- Consistent mock patterns across tests

## 🔒 Type Safety

### TypeScript Configuration

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true
}
```

### Type Patterns

**Props Types:**

```typescript
interface ComponentProps {
  required: string;
  optional?: number;
  children: React.ReactNode;
}
```

**API Response Types:**

```typescript
// Backend returns snake_case
interface PatientResponse {
  patient_id: number;
  full_name: string;
  birth_date: string;
}

// Frontend uses camelCase
interface Patient {
  patientId: number;
  fullName: string;
  birthDate: string;
}
```

**Generic Types:**

```typescript
type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};
```

## 📊 Performance Metrics

### Bundle Sizes (Post-Optimization)

- **Home Page:** 102kB
- **Appointment:** 132kB (was 170kB)
- **Schedule:** 102kB (was 137kB)
- **Patients:** 102kB (was 130kB)

### Test Execution

- **Time:** ~50 seconds (local full suite, May 2026)
- **Tests:** 3,771 passing (264 test suites)

### Coverage

(`npm test -- --coverage`, May 2026)

- **Statements:** 80.87%
- **Branches:** 69.03%
- **Functions:** 74.01%
- **Lines:** 80.91%

---

**Last Updated:** May 2026
**Architecture Version:** 3.1 (React Query + Zustand Hybrid + BFF Auth)
**Next.js Version:** 16.2.6+
**State Management:** Hybrid Pattern (React Query + Zustand + Context)
