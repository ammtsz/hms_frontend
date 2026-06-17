/** Must match backend `bff-secret.guard.ts` header name. */
export const BFF_SECRET_HEADER = 'x-bff-secret';

/**
 * Headers required for backend token-issuing auth routes (login, refresh).
 * Server-only: BFF_INTERNAL_SECRET must never use NEXT_PUBLIC_ prefix.
 */
export function getBffSecretHeaders(): Record<string, string> {
  const secret = process.env.BFF_INTERNAL_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'BFF_INTERNAL_SECRET environment variable must be set in production. ' +
          'It must match the value configured on the backend (Railway). ' +
          'Generate with: openssl rand -base64 32',
      );
    }
    return {};
  }
  return { [BFF_SECRET_HEADER]: secret };
}
