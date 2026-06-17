/**
 * Clinic timezone from deployment env (must match backend CLINIC_TIMEZONE).
 */
export const DEFAULT_CLINIC_TIMEZONE = 'America/Sao_Paulo';

function resolveClinicTimezoneFromEnv(): string {
  const raw = process.env.NEXT_PUBLIC_CLINIC_TIMEZONE?.trim();
  if (!raw) {
    return DEFAULT_CLINIC_TIMEZONE;
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: raw });
    return raw;
  } catch {
    console.warn(
      `Invalid NEXT_PUBLIC_CLINIC_TIMEZONE "${raw}", falling back to ${DEFAULT_CLINIC_TIMEZONE}`,
    );
    return DEFAULT_CLINIC_TIMEZONE;
  }
}

/** IANA timezone for the clinic (build-time from env). */
export const CLINIC_TIMEZONE = resolveClinicTimezoneFromEnv();
