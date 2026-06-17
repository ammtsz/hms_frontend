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
  const url = process.env.API_URL;
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'API_URL environment variable must be set in production. ' +
          'It should point to the backend service (e.g., https://api.example.com). ' +
          'Do NOT use NEXT_PUBLIC_API_URL for server-side code.',
      );
    }
    return 'http://localhost:3002';
  }
  return url;
}
