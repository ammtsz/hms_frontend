/**
 * Timezone-aware date utilities for the assessment center calendar.
 *
 * Use getTodayClinic() / formatDateClinic() for business dates (clinic timezone from env).
 * For React components, prefer useDateHelpers() which uses the same clinic timezone.
 */

import { CLINIC_TIMEZONE } from '@/config/clinicTimezone';

/**
 * Get today's date in YYYY-MM-DD format in a specific timezone
 * @param timezone - IANA timezone identifier (e.g., "America/Vancouver", "America/Los_Angeles")
 * @returns Date string in YYYY-MM-DD format
 */
export function getTodayInTimezone(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // en-CA locale gives us YYYY-MM-DD format directly
  return formatter.format(now);
}

/**
 * Get today's date in YYYY-MM-DD format in the clinic timezone (from NEXT_PUBLIC_CLINIC_TIMEZONE).
 */
export function getTodayClinic(): string {
  return getTodayInTimezone(CLINIC_TIMEZONE);
}

/**
 * Format any date in YYYY-MM-DD format in a specific timezone
 * @param date - Date string, Date object, or null/undefined (defaults to today)
 * @param timezone - IANA timezone identifier
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateInTimezone(
  date: string | Date | null | undefined,
  timezone: string
): string {
  if (!date) {
    return getTodayInTimezone(timezone);
  }

  // Handle string dates
  if (typeof date === 'string') {
    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Parse and format
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.warn('Invalid date string provided, returning today:', date);
      return getTodayInTimezone(timezone);
    }
    date = parsedDate;
  }

  // Format Date object in specified timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}

/**
 * Format any date in YYYY-MM-DD format in the clinic timezone.
 */
export function formatDateClinic(date?: string | Date | null): string {
  return formatDateInTimezone(date, CLINIC_TIMEZONE);
}

/**
 * Normalize API or stored values to YYYY-MM-DD without timezone conversion.
 * Use for PostgreSQL DATE values returned as ISO midnight UTC (e.g. 2026-06-06T00:00:00.000Z).
 * Prefer over formatDateClinic when the calendar day must not shift across timezones.
 */
export function toCalendarDateString(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const datePart = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }
  return value;
}

/**
 * Format a date string for HTML date input (YYYY-MM-DD)
 * Since we use strings exclusively for calendar dates, this validates the format
 * @param date - Date string (YYYY-MM-DD) or null/undefined
 * @returns Formatted date string (YYYY-MM-DD) or empty string
 */
export function formatDateForInput(date: string | null | undefined): string {
  if (!date) {
    return '';
  }

  if (isValidDateString(date)) {
    return date;
  }
  return '';
}

/** True when value is a real calendar date in YYYY-MM-DD form. */
export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Add calendar days to a YYYY-MM-DD string using local date arithmetic (no UTC shift for calendar dates).
 */
export function addCalendarDaysToLocalYmd(
  ymd: string,
  daysToAdd: number,
): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!match) {
    return getTodayClinic();
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + daysToAdd);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

