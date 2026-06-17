# Frontend Authentication Documentation

**Last updated:** June 17, 2026  
**Status:** Production ready  
**Architecture:** Server Actions + JWT + HTTP-only cookies + BFF proxy

This document covers the frontend authentication flow only. Backend behavior and security rules are documented in [hms-backend/docs/AUTHENTICATION.md](../../hms-backend/docs/AUTHENTICATION.md).

---

## Scope

This authentication layer uses four parts:

1. **Backend JWT guard** — authoritative API protection
2. **BFF proxy** — same-origin browser boundary and token refresh
3. **proxy.ts** — route-level redirect for protected pages
4. **Auth context** — UI state only, never used for authorization

### Core rules

- Tokens are stored only in HTTP-only cookies
- Browser requests go to same-origin `/api/*` routes
- `proxy.ts` is only a UX gate
- Refresh tokens are rotated and revoked in the database

---

## Authentication flow

### Login

1. The user submits credentials in the login form
2. A server action calls backend `/auth/login` through the BFF
3. The backend validates the credentials and returns access and refresh tokens
4. The server action stores both tokens as HTTP-only cookies
5. The user is redirected to the requested page

### Protected route access

1. The user visits a protected page such as `/attendance`
2. `proxy.ts` checks the access token signature locally
3. If the token is valid, the page renders
4. The UI loads user data from `/api/auth/me`
5. If the access token is expired, the BFF refreshes it server-side and retries

### Logout

1. The user triggers logout
2. A server action calls backend `/auth/logout`
3. The backend revokes the refresh token
4. The server action clears both cookies
5. The user is redirected to `/login`

---

## Token policy

| Token         | Lifetime | Storage                     | Purpose                            |
| ------------- | -------- | --------------------------- | ---------------------------------- |
| Access token  | 8 hours  | HTTP-only cookie            | API authentication                 |
| Refresh token | 7 days   | HTTP-only cookie + database | Token rotation and session renewal |

### Security characteristics

- `SameSite=strict` reduces CSRF risk
- HTTP-only cookies prevent JavaScript access to tokens
- Refresh token revocation invalidates old sessions immediately
- Login is rate-limited and accounts can be locked after repeated failures

---

## Where the logic lives

- **Frontend server actions**: login and logout
- **BFF proxy**: request forwarding, refresh handling, cookie management
- **`proxy.ts`**: redirect to `/login` when no valid access token exists
- **Catch-all API proxy**: allowlisted by first path segment; `auth/*` is intentionally denied so the browser never receives raw auth tokens
- **Backend**: credential validation, token issuance, refresh, revocation, and authorization

Auth context should be treated as presentation state only.

### Key implementation files

- `src/app/actions/auth.actions.ts` — login/logout server actions and cookie writes
- `src/app/api/lib/backend.ts` — server-side API forwarding and token refresh
- `src/app/api/[...path]/allowlist.ts` — proxy allowlist and `auth/*` deny rule
- `src/proxy.ts` — local JWT check for protected pages
- `src/app/login` and `src/app/auth`-related UI — user-facing auth flows only

---

## Environment variables

### Backend

Required:

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `BFF_INTERNAL_SECRET` in production
- `CORS_ORIGIN`

Optional:

- `PORT`
- `NODE_ENV`
- `THROTTLE_TTL`
- `THROTTLE_LIMIT`

### Frontend

Required:

- `API_URL` — server-only, not public
- `JWT_SECRET` — used by `proxy.ts`
- `BFF_INTERNAL_SECRET` — must match the backend in production

Optional:

- `NEXT_PUBLIC_CLINIC_TIMEZONE`

This value configures the fixed clinic timezone used across the app; users do
not change timezones in the UI.

Do not use public client-exposed API URLs for auth flows. Server actions and route handlers must use `API_URL`.

---

## API reference

### Backend endpoints

#### `POST /auth/login`

Authenticates the user and returns tokens plus user data.

#### `POST /auth/refresh`

Rotates tokens using the refresh token cookie. This is BFF-only when `BFF_INTERNAL_SECRET` is enabled.

#### `POST /auth/logout`

Revokes the refresh token and ends the session.

#### `GET /auth/me`

Returns the current authenticated user.

### Frontend server actions

#### `loginAction(credentials)`

Submits credentials, stores cookies, and redirects on success.

#### `logoutAction()`

Clears session cookies and redirects to `/login`.

#### `getCurrentUser()`

Returns the current user or `null`.

#### `isAuthenticated()`

Returns whether a valid session exists.

---

## Practical usage

### Read auth state in components

```typescript
import { useAuthContext } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please login</div>;

  return <div>Hello {user.name}!</div>;
}
```

### Fetch protected data

Use same-origin requests:

```typescript
const response = await fetch("/api/patients");
const data = await response.json();
```

The BFF handles authentication and refresh transparently.

---

## Troubleshooting

| Problem                               | Likely cause                            | Fix                                                          |
| ------------------------------------- | --------------------------------------- | ------------------------------------------------------------ |
| `JWT_SECRET is not defined`           | Missing environment variable            | Set `JWT_SECRET` and `JWT_REFRESH_SECRET` in the backend env |
| Login fails silently                  | Misconfigured API URL or CORS           | Verify `API_URL` and `CORS_ORIGIN`                           |
| `401 Unauthorized` on API calls       | Cookies not being sent or token expired | Use `/api/*` routes and confirm the BFF refresh flow         |
| Backend cannot read cookies           | `cookie-parser` missing                 | Register `cookie-parser` in `main.ts`                        |
| Users are redirected too aggressively | Invalid `JWT_SECRET` in frontend        | Match frontend `JWT_SECRET` with backend                     |

### Quick checks

- Confirm the browser talks to `/api/*`, not directly to the backend
- Confirm `BFF_INTERNAL_SECRET` matches on both sides in production
- Confirm the database has auth tables

### Debugging checklist

- If login works locally but fails in production, verify `API_URL`, `CORS_ORIGIN`, and `BFF_INTERNAL_SECRET`
- If the browser loops back to `/login`, check `JWT_SECRET` in the frontend and confirm the access token still verifies in `proxy.ts`
- If API calls return `401`, confirm cookies are being sent to the frontend origin and that the BFF refresh path is active
- If backend requests fail during refresh or logout, verify `x-bff-secret` is being sent from the server action

---

## Deployment checklist

- Generate and store all secrets securely
- Run database migrations or reset scripts
- Create the first admin account
- Set `CORS_ORIGIN` to the production frontend URL
- Configure frontend `API_URL`, `JWT_SECRET`, and `BFF_INTERNAL_SECRET`
- Ensure the frontend browser only uses same-origin `/api/*` routes
- Confirm `auth/*` is not exposed through the catch-all proxy
- Verify login, refresh, logout, and protected route access

### Recommended production checks

- Security headers are enabled
- Rate limiting is working
- Account lockout works after repeated failed logins
- Token refresh succeeds after access token expiry

### Production verification steps

1. Log in with a valid user and confirm the cookies are set as HTTP-only.
2. Refresh the page and confirm protected routes still render.
3. Trigger logout and confirm both cookies are cleared.
4. Wait for the access token to expire or simulate a 401 and confirm the BFF refreshes it server-side.
5. Confirm the browser never calls the backend directly and only uses `/api/*`.
6. Confirm the first admin was created by the bootstrap script and not from a seeded default account.

### Important notes for new engineers

- The backend is the source of truth for auth decisions; `proxy.ts` is only a UX gate.
- Refresh token rotation happens server-side and the old token is revoked in the database.
- The login page should not depend on local JWT signature alone because stale cookies can survive database resets.
- Do not expose public API URLs in auth flows; server-only code should use `API_URL`.

---

## Related documentation

- [Backend authentication documentation](../../hms-backend/docs/AUTHENTICATION.md)
- [Local development setup](./SETUP.md)
- [Manual testing checklist](./TESTING_CHECKLIST.md)
- [Project overview](../README.md)
