import {
  formatDateBR,
  formatDateWithDayOfWeekBR,
  getDefaultSchedulingDate,
  getDaysOverdue,
  getDaysUntil,
} from '../dateUtils';

// Mock the getNextAttendanceDate API function
jest.mock('@/api/attendances', () => ({
  getNextAttendanceDate: jest.fn(),
}));

import { getNextAttendanceDate } from '@/api/attendances';
const mockGetNextAttendanceDate = getNextAttendanceDate as jest.MockedFunction<typeof getNextAttendanceDate>;

describe('dateUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('formatDateBR', () => {
    it('should format date strings correctly in Brazilian format', () => {
      expect(formatDateBR('2025-08-12')).toBe('12/08/2025');
      expect(formatDateBR('2025-01-01')).toBe('01/01/2025');
      expect(formatDateBR('2025-12-31')).toBe('31/12/2025');
    });

    it('should handle ISO datetime strings correctly', () => {
      expect(formatDateBR('2025-08-12T00:00:00')).toBe('12/08/2025');
      expect(formatDateBR('2025-08-12T10:30:00Z')).toBe('12/08/2025');
    });

    it('should treat ISO strings with Z as calendar date (e.g. PostgreSQL DATE)', () => {
      // Midnight UTC on March 10 = March 9 evening in São Paulo; we display calendar date
      expect(formatDateBR('2026-03-10T00:00:00.000Z')).toBe('10/03/2026');
      expect(formatDateBR('2026-01-01T00:00:00.000Z')).toBe('01/01/2026');
    });

    it('should handle empty strings', () => {
      expect(formatDateBR('')).toBe('');
    });

    it('should handle invalid dates by returning the original string', () => {
      expect(formatDateBR('invalid-date')).toBe('invalid-date');
    });

    it('should be timezone-safe for date-only strings', () => {
      // This test ensures our fix prevents timezone issues
      const dateStr = '2025-08-12';
      const result = formatDateBR(dateStr);
      expect(result).toBe('12/08/2025');
      
      // The date should be consistent regardless of timezone
      const testDate = new Date(dateStr + 'T00:00:00');
      expect(testDate.getDate()).toBe(12);
      expect(testDate.getMonth() + 1).toBe(8);
      expect(testDate.getFullYear()).toBe(2025);
    });
  });

  describe('formatDateWithDayOfWeekBR', () => {
    it('should format date strings with day of week in Brazilian format', () => {
      // August 12, 2025 is a Tuesday
      expect(formatDateWithDayOfWeekBR('2025-08-12')).toBe('Terça-feira, 12 de Agosto de 2025');
      
      // January 1, 2025 is a Wednesday
      expect(formatDateWithDayOfWeekBR('2025-01-01')).toBe('Quarta-feira, 01 de Janeiro de 2025');
      
      // December 31, 2025 is a Wednesday
      expect(formatDateWithDayOfWeekBR('2025-12-31')).toBe('Quarta-feira, 31 de Dezembro de 2025');
    });

    it('should handle ISO datetime strings correctly', () => {
      expect(formatDateWithDayOfWeekBR('2025-08-12T00:00:00')).toBe('Terça-feira, 12 de Agosto de 2025');
      expect(formatDateWithDayOfWeekBR('2025-08-12T10:30:00Z')).toBe('Terça-feira, 12 de Agosto de 2025');
    });

    it('should treat ISO strings with Z as calendar date (e.g. PostgreSQL DATE)', () => {
      // Use a fixed past date so "HOJE" is not returned; Aug 12, 2024 is a Monday
      expect(formatDateWithDayOfWeekBR('2024-08-12T00:00:00.000Z')).toBe('Segunda-feira, 12 de Agosto de 2024');
    });

    it('should handle empty strings', () => {
      expect(formatDateWithDayOfWeekBR('')).toBe('');
    });

    it('should handle invalid dates by returning the original string', () => {
      expect(formatDateWithDayOfWeekBR('invalid-date')).toBe('invalid-date');
    });

    it('should correctly identify all days of the week', () => {
      // Test a week starting Monday, August 11, 2025
      expect(formatDateWithDayOfWeekBR('2025-08-11')).toBe('Segunda-feira, 11 de Agosto de 2025');
      expect(formatDateWithDayOfWeekBR('2025-08-12')).toBe('Terça-feira, 12 de Agosto de 2025');
      expect(formatDateWithDayOfWeekBR('2025-08-13')).toBe('Quarta-feira, 13 de Agosto de 2025');
      expect(formatDateWithDayOfWeekBR('2025-08-14')).toBe('Quinta-feira, 14 de Agosto de 2025');
      expect(formatDateWithDayOfWeekBR('2025-08-15')).toBe('Sexta-feira, 15 de Agosto de 2025');
      expect(formatDateWithDayOfWeekBR('2025-08-16')).toBe('Sábado, 16 de Agosto de 2025');
      expect(formatDateWithDayOfWeekBR('2025-08-17')).toBe('Domingo, 17 de Agosto de 2025');
    });

    it('should be timezone-safe for date-only strings', () => {
      const dateStr = '2025-08-12';
      const result = formatDateWithDayOfWeekBR(dateStr);
      expect(result).toBe('Terça-feira, 12 de Agosto de 2025');
      
      // The date should be consistent regardless of timezone
      const testDate = new Date(dateStr + 'T00:00:00');
      expect(testDate.getDate()).toBe(12);
      expect(testDate.getMonth() + 1).toBe(8);
      expect(testDate.getFullYear()).toBe(2025);
      expect(testDate.getDay()).toBe(2); // Tuesday
    });
  });

  describe('getDefaultSchedulingDate', () => {
    it('should return API result when successful', async () => {
      const testDate = "2024-01-15";
      mockGetNextAttendanceDate.mockResolvedValue({
        success: true,
        value: { nextDate: testDate }
      });

      const result = await getDefaultSchedulingDate();
      expect(result).toBe(testDate);
      expect(mockGetNextAttendanceDate).toHaveBeenCalledTimes(1);
    });

    it('should fallback to next Tuesday when API fails', async () => {
      mockGetNextAttendanceDate.mockRejectedValue(new Error('API Error'));

      const result = await getDefaultSchedulingDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should fallback when API returns unsuccessful response', async () => {
      mockGetNextAttendanceDate.mockResolvedValue({
        success: false,
        value: undefined
      });

      const result = await getDefaultSchedulingDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should fallback when API returns no next_date', async () => {
      mockGetNextAttendanceDate.mockResolvedValue({
        success: true,
        value: undefined
      });

      const result = await getDefaultSchedulingDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getDaysOverdue', () => {
    it('should return 0 for future dates', () => {
      expect(getDaysOverdue('2030-08-15')).toBe(0);
      expect(getDaysOverdue('2030-09-12')).toBe(0);
    });

    it('should return positive days for past dates', () => {
      expect(getDaysOverdue('2020-08-10')).toBeGreaterThan(0);
      expect(getDaysOverdue('2020-07-01')).toBeGreaterThan(0);
    });

    it('should handle invalid dates by returning 0', () => {
      expect(getDaysOverdue('invalid-date')).toBe(0);
      expect(getDaysOverdue('not-a-date')).toBe(0);
    });

    it('should handle invalid date format by returning 0', () => {
      expect(getDaysOverdue('2025-13-45')).toBe(0);
    });
  });

  describe('getDaysUntil', () => {
    it('should calculate days until future dates correctly', () => {
      expect(getDaysUntil('2030-08-15')).toBeGreaterThan(0);
      expect(getDaysUntil('2030-09-12')).toBeGreaterThan(0);
    });

    it('should return 0 for past dates', () => {
      expect(getDaysUntil('2020-08-10')).toBe(0);
      expect(getDaysUntil('2020-07-01')).toBe(0);
    });

    it('should handle Date objects correctly', () => {
      const futureDate = new Date('2030-08-15T10:30:00');
      expect(getDaysUntil(futureDate)).toBeGreaterThan(0);
      
      const pastDate = new Date('2020-08-10T10:30:00');
      expect(getDaysUntil(pastDate)).toBe(0);
    });

    it('should handle invalid dates by returning 0', () => {
      expect(getDaysUntil('invalid-date')).toBe(0);
      expect(getDaysUntil('not-a-date')).toBe(0);
      expect(getDaysUntil('')).toBe(0);
    });

    it('should handle invalid Date objects by returning 0', () => {
      const invalidDate = new Date('invalid');
      expect(getDaysUntil(invalidDate)).toBe(0);
    });

    it('should handle exceptions during calculation', () => {
      expect(getDaysUntil('2025-13-45')).toBe(0);
    });

    it('should test Math.max behavior for negative values', () => {
      expect(getDaysUntil('2020-08-01')).toBe(0);
      expect(getDaysUntil('2030-08-20')).toBeGreaterThan(0);
    });
  });
});
