/**
 * Returns a safe redirect path for post-login redirect.
 * Only allows same-origin paths (starting with /, not //) to prevent open redirects.
 */
export function getSafeRedirectPath(
  returnUrl: string | null,
  defaultPath: string,
): string {
  if (!returnUrl || typeof returnUrl !== "string") return defaultPath;
  const decoded = decodeURIComponent(returnUrl.trim());
  if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  return defaultPath;
}
