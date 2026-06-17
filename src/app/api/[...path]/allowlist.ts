/**
 * Allowlist of first path segments that the catch-all proxy may forward.
 *
 * H1 remediation: the proxy must not be an open relay. Only explicitly listed
 * path segments are forwarded; everything else returns 404 to avoid disclosing
 * internal route structure.
 *
 * auth/* is intentionally excluded — auth flows use Server Actions directly
 * (loginAction, logoutAction) or the dedicated /api/auth/me route. Exposing
 * auth/* through the catch-all would allow browsers to receive raw tokens,
 * bypassing the BFF pattern (see C4 in AUTHENTICATION.md).
 */
export const PROXY_ALLOWED_SEGMENTS = new Set([
  'patients',
  'attendances',
  'consultations',
  'treatments',
  'sessions',
  'schedule-settings',
  'day-finalization',
  'holidays',
  'holiday-templates',
  'settings',
  'users',
]);

/**
 * Returns true when the path segments are allowed through the proxy.
 * auth/* is always denied regardless of allowlist contents.
 */
export function isProxyPathAllowed(pathSegments: string[]): boolean {
  if (pathSegments.length === 0) return false;
  const first = pathSegments[0].toLowerCase();
  // Explicitly deny auth/* even if it were accidentally added to the allowlist
  if (first === 'auth') return false;
  return PROXY_ALLOWED_SEGMENTS.has(first);
}
