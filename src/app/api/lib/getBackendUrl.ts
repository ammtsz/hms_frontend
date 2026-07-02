/**
 * Strict URL rules apply only when serving production traffic, not during
 * `next build` (NODE_ENV is production there too, but NEXT_PHASE is
 * `phase-production-build`).
 */
function shouldEnforceProductionUrlRules(): boolean {
  return (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PHASE === 'phase-production-server'
  );
}

/**
 * Server-only helper to resolve the backend base URL.
 *
 * Priority:
 *   1. API_URL (private runtime env — for server-side code only)
 *   2. http://localhost:3002 (development fallback)
 *
 * NEVER use NEXT_PUBLIC_API_URL in server-side code; that variable is baked
 * into the client bundle at build time and is intended for browser usage only
 * (H3 remediation).
 */
export function getBackendUrl(): string {
  const raw = process.env.API_URL?.trim();
  if (!raw) {
    if (shouldEnforceProductionUrlRules()) {
      throw new Error(
        'API_URL environment variable must be set in production. ' +
          'It should point to the backend service (e.g., https://api.example.com). ' +
          'Do NOT use NEXT_PUBLIC_API_URL for server-side code.',
      );
    }
    return 'http://localhost:3002';
  }

  if (shouldEnforceProductionUrlRules()) {
    if (raw.includes('.railway.internal')) {
      throw new Error(
        'API_URL must be the public Railway backend URL (https://*.up.railway.app), ' +
          'not postgres.railway.internal or another internal hostname.',
      );
    }
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(raw)) {
      throw new Error(
        'API_URL cannot point to localhost in production. ' +
          'Set it to your public Railway backend URL on Vercel.',
      );
    }
    if (!raw.startsWith('https://')) {
      throw new Error(
        'API_URL must use https:// in production (e.g. https://your-backend.up.railway.app).',
      );
    }
  }

  return raw.replace(/\/+$/, '');
}
