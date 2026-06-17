/**
 * useDateHelpers - Timezone-aware date utilities
 * 
 * Provides date helpers using the clinic timezone (from env).
 * Use this instead of new Date().toISOString() for calendar dates.
 * 
 * For non-React code, use getTodayClinic() / formatDateClinic() from @/utils/timezoneDate.
 */

import { useCallback } from 'react';
import { useClinicTimezone } from '@/contexts/ClinicTimezoneContext';
import {
  getTodayInTimezone,
  formatDateInTimezone as formatDateInTz,
} from '@/utils/timezoneDate';

export interface UseDateHelpersReturn {
  /**
   * Get today's date in YYYY-MM-DD format in the user's timezone
   * @returns Date string in YYYY-MM-DD format
   */
  getTodayDate: () => string;

  /**
   * Format any date in the user's timezone
   * @param date - Optional date string, Date object, or null. Defaults to today if not provided
   * @returns Date string in YYYY-MM-DD format
   */
  formatDate: (date?: string | Date | null) => string;

  /**
   * Get the current date/time in the user's timezone
   * @returns Date object representing current time in user's timezone
   */
  getNow: () => Date;

  /**
   * Format a date in a specific timezone
   * @param date - Date string or Date object
   * @param timezone - Target timezone (defaults to user's timezone)
   * @returns Date string in YYYY-MM-DD format
   */
  formatDateInTimezone: (date: string | Date, timezone?: string) => string;

  /**
   * Format any date in the user's timezone to DD-MM-YYYY format
   * @param date - Optional date string, Date object, or null. Defaults to today if not provided
   * @returns Date string in DD-MM-YYYY format
   */
  formatDateToDDMMYYYY: (date?: string | Date | null) => string;
}

/**
 * Custom hook providing timezone-aware date utilities
 * 
 * @example
 * ```tsx
 * const { getTodayDate, formatDate } = useDateHelpers();
 * 
 * // Get today's date in user's timezone
 * const today = getTodayDate(); // "2026-01-21"
 * 
 * // Format any date
 * const formatted = formatDate("2026-01-22"); // "2026-01-22"
 * const todayFormatted = formatDate(); // "2026-01-21" (defaults to today)
 * ```
 */
export function useDateHelpers(): UseDateHelpersReturn {
  const { clinicTimezone } = useClinicTimezone();

  /**
   * Get today's date in YYYY-MM-DD format in the clinic timezone
   */
  const getTodayDate = useCallback((): string => {
    return getTodayInTimezone(clinicTimezone);
  }, [clinicTimezone]);

  /**
   * Format any date in the user's timezone
   */
  const formatDate = useCallback((date?: string | Date | null): string => {
    if (!date) {
      return getTodayDate();
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
        return getTodayDate();
      }
      date = parsedDate;
    }

    // Format Date object in user's timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: clinicTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    return formatter.format(date);
  }, [clinicTimezone, getTodayDate]);

  /**
   * Format any date to "DD MMMM de YYYY" format (e.g., "28 Janeiro de 2026")
   */
  const formatDateToDDMMYYYY = useCallback((date?: string | Date | null): string => {
    const dateToFormat = date || getTodayDate();
    let targetDate: string;

    // Convert to YYYY-MM-DD format first
    if (typeof dateToFormat === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateToFormat)) {
        targetDate = dateToFormat;
      } else {
        // Try to parse other date formats
        const parsed = new Date(dateToFormat);
        if (isNaN(parsed.getTime())) {
          console.warn('Invalid date string provided, using today:', dateToFormat);
          targetDate = getTodayDate();
        } else {
          targetDate = formatDate(parsed);
        }
      }
    } else {
      targetDate = formatDate(dateToFormat);
    }

    // Parse YYYY-MM-DD components
    const [year, month, day] = targetDate.split('-').map(num => parseInt(num, 10));
    
    // Get Portuguese month name
    const localDate = new Date(year, month - 1, day);
    const monthName = localDate.toLocaleDateString('pt-BR', { month: 'long' });
    const monthCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    return `${day} ${monthCapitalized} de ${year}`;
  }, [getTodayDate, formatDate]);

  /**
   * Get current Date object (note: Date objects are always in local time)
   */
  const getNow = useCallback((): Date => {
    return new Date();
  }, []);

  /**
   * Format a date in a specific timezone
   */
  const formatDateInTimezone = useCallback((
    date: string | Date,
    timezone?: string
  ): string => {
    const targetTimezone = timezone || clinicTimezone;
    return formatDateInTz(date, targetTimezone);
  }, [clinicTimezone]);

  return {
    getTodayDate,
    formatDate,
    getNow,
    formatDateInTimezone,
    formatDateToDDMMYYYY,
  };
}
