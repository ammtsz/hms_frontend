# Frontend API Layer

Typed API clients, React Query hooks, and cache helpers for the Next.js BFF layer.

## Structure

```text
src/api/
├── types.ts          # Shared DTOs, enums, and request/response types
├── lib/axios.ts      # Same-origin /api client and case conversion
├── query/
│   ├── hooks/        # React Query hooks
│   ├── keys/         # Query key factories
│   └── invalidation/ # Shared cache invalidation helpers
├── <resource>/       # Resource clients such as patients, attendances, treatments
└── utils/            # Shared API helpers and messages
```

## Conventions

- Use `src/api/<resource>/index.ts` for backend resource clients
- Keep React Query hooks in `src/api/query/hooks`
- Keep query keys in `src/api/query/keys`
- Keep invalidation helpers in `src/api/query/invalidation`
- Use `src/api/types.ts` for DTOs and enums that match the backend

## Imports

```typescript
import { getPatients, createPatient } from "@/api/patients";
import { usePatients } from "@/api/query/hooks/usePatientQueries";
import { attendanceKeys } from "@/api/query/keys/attendanceKeys";
import { ApiResponse, AttendanceType, PatientPriority } from "@/api/types";
```

## Data flow

1. Components call a query hook or resource client
2. Requests go through the same-origin `/api` client
3. Axios transforms snake_case and camelCase automatically
4. The BFF forwards allowlisted requests to the backend

## Notes

- Check `success` before reading `value` from an `ApiResponse<T>`
- Keep API-specific logic out of feature components when possible
- Prefer small resource modules over large generic service files
