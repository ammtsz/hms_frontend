/**
 * useDateHelpers - Timezone-aware date utilities
 *
 * Provides date helpers using the clinic timezone (from env).
 * Use this instead of new Date().toISOString() for calendar dates.
 *
 * For non-React code, use getTodayClinic() / formatDateClinic() from @/utils/timezoneDate.
 */

import { useCallback } from "react";
import { useClinicTimezone } from "@/contexts/ClinicTimezoneContext";
import {
  getTodayInTimezone,
  formatDateInTimezone as formatDateInTz,
} from "@/utils/timezoneDate";

const DISPLAY_LOCALE = "en-US";

export interface UseDateHelpersReturn {
  getTodayDate: () => string;
  formatDate: (date?: string | Date | null) => string;
  getNow: () => Date;
  formatDateInTimezone: (date: string | Date, timezone?: string) => string;
  /** Format a calendar date as MM/DD/YYYY (en-US display). */
  formatDisplayDate: (date?: string | Date | null) => string;
}

export function useDateHelpers(): UseDateHelpersReturn {
  const { clinicTimezone } = useClinicTimezone();

  const getTodayDate = useCallback((): string => {
    return getTodayInTimezone(clinicTimezone);
  }, [clinicTimezone]);

  const formatDate = useCallback(
    (date?: string | Date | null): string => {
      if (!date) {
        return getTodayDate();
      }

      if (typeof date === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return date;
        }
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          console.warn("Invalid date string provided, returning today:", date);
          return getTodayDate();
        }
        date = parsedDate;
      }

      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: clinicTimezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      return formatter.format(date);
    },
    [clinicTimezone, getTodayDate],
  );

  const formatDisplayDate = useCallback(
    (date?: string | Date | null): string => {
      const isoDate = formatDate(date);
      const [year, month, day] = isoDate.split("-").map(Number);
      const localDate = new Date(year, month - 1, day);
      return localDate.toLocaleDateString(DISPLAY_LOCALE, {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    },
    [formatDate],
  );

  const getNow = useCallback((): Date => {
    return new Date();
  }, []);

  const formatDateInTimezone = useCallback(
    (date: string | Date, timezone?: string): string => {
      const targetTimezone = timezone || clinicTimezone;
      return formatDateInTz(date, targetTimezone);
    },
    [clinicTimezone],
  );

  return {
    getTodayDate,
    formatDate,
    getNow,
    formatDateInTimezone,
    formatDisplayDate,
  };
}
