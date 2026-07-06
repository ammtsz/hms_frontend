/**
 * App branding from deployment env. Override per environment (portfolio vs production).
 */
export const DEFAULT_APP_TITLE = "Treatment & Scheduling Platform";

export const DEFAULT_APP_TAGLINE =
  "Appointments, treatments, and daily operations";

function resolveBrandingFromEnv(
  envValue: string | undefined,
  fallback: string,
): string {
  const trimmed = envValue?.trim();
  return trimmed ? trimmed : fallback;
}

/** Product name — browser tab, nav, login heading. */
export const APP_TITLE = resolveBrandingFromEnv(
  process.env.NEXT_PUBLIC_APP_TITLE,
  DEFAULT_APP_TITLE,
);

/** Short description under the product name. */
export const APP_TAGLINE = resolveBrandingFromEnv(
  process.env.NEXT_PUBLIC_APP_TAGLINE,
  DEFAULT_APP_TAGLINE,
);

/**
 * Optional login-only label (e.g. portfolio demo). Empty when unset.
 * Set NEXT_PUBLIC_APP_DEMO_LABEL on demo deployments only.
 */
export const APP_DEMO_LABEL = process.env.NEXT_PUBLIC_APP_DEMO_LABEL?.trim() ?? "";
