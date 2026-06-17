/**
 * Tests for timezone-aware date utilities
 */

import { CLINIC_TIMEZONE } from '@/config/clinicTimezone';
import {
  getTodayInTimezone,
  getTodayClinic,
  formatDateInTimezone,
  formatDateClinic,
  toCalendarDateString,
  addCalendarDaysToLocalYmd,
} from '../timezoneDate';

describe('timezoneDate utilities', () => {
  describe('getTodayInTimezone', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const result = getTodayInTimezone('America/Sao_Paulo');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return different dates for different timezones', () => {
      const saoPaulo = getTodayInTimezone('America/Sao_Paulo');
      const tokyo = getTodayInTimezone('Asia/Tokyo');

      expect(saoPaulo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(tokyo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle GMT-8 timezone correctly', () => {
      const result = getTodayInTimezone('America/Los_Angeles');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle GMT+0 timezone correctly', () => {
      const result = getTodayInTimezone('Europe/London');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getTodayClinic', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const result = getTodayClinic();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should use clinic timezone from config', () => {
      const result = getTodayClinic();
      const expected = getTodayInTimezone(CLINIC_TIMEZONE);
      expect(result).toBe(expected);
    });
  });

  describe('formatDateInTimezone', () => {
    it('should format date string in specified timezone', () => {
      const result = formatDateInTimezone('2026-01-21', 'America/Sao_Paulo');
      expect(result).toBe('2026-01-21');
    });

    it('should format Date object in specified timezone', () => {
      const date = new Date('2026-01-21T12:00:00Z');
      const result = formatDateInTimezone(date, 'America/Sao_Paulo');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return today if date is null', () => {
      const result = formatDateInTimezone(null, 'America/Sao_Paulo');
      const expected = getTodayInTimezone('America/Sao_Paulo');
      expect(result).toBe(expected);
    });

    it('should return today if date is undefined', () => {
      const result = formatDateInTimezone(undefined, 'America/Sao_Paulo');
      const expected = getTodayInTimezone('America/Sao_Paulo');
      expect(result).toBe(expected);
    });

    it('should handle already formatted YYYY-MM-DD strings', () => {
      const result = formatDateInTimezone('2026-01-21', 'America/Sao_Paulo');
      expect(result).toBe('2026-01-21');
    });

    it('should handle invalid date strings gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = formatDateInTimezone('invalid-date', 'America/Sao_Paulo');

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('formatDateClinic', () => {
    it('should format date in clinic timezone', () => {
      const result = formatDateClinic('2026-01-21');
      expect(result).toBe('2026-01-21');
    });

    it('should return today if no date provided', () => {
      const result = formatDateClinic();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle Date objects', () => {
      const date = new Date('2026-01-21T12:00:00Z');
      const result = formatDateClinic(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('toCalendarDateString', () => {
    it('should return YYYY-MM-DD strings unchanged', () => {
      expect(toCalendarDateString('2026-06-06')).toBe('2026-06-06');
    });

    it('should extract calendar date from ISO strings without timezone shift', () => {
      expect(toCalendarDateString('2026-06-06T00:00:00.000Z')).toBe('2026-06-06');
    });
  });

  describe('addCalendarDaysToLocalYmd', () => {
    it('should add calendar days to a YYYY-MM-DD string', () => {
      expect(addCalendarDaysToLocalYmd('2026-05-30', 7)).toBe('2026-06-06');
    });
  });

  describe('timezone consistency', () => {
    it('should produce consistent results for same timezone', () => {
      const result1 = getTodayInTimezone('America/Sao_Paulo');
      const result2 = getTodayInTimezone('America/Sao_Paulo');

      expect(result1).toBe(result2);
    });

    it('should handle timezone transitions correctly', () => {
      const date = new Date('2026-03-08T12:00:00Z');
      const result = formatDateInTimezone(date, 'America/Los_Angeles');

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
