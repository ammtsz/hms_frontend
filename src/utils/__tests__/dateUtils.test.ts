import {
  formatDisplayDate,
  formatDisplayDateWithDayOfWeek,
  getDefaultSchedulingDate,
  getDaysOverdue,
  getDaysUntil,
} from '../dateUtils';

jest.mock('@/api/appointments', () => ({
  getNextAppointmentDate: jest.fn(),
}));

import { getNextAppointmentDate } from '@/api/appointments';
const mockGetNextAppointmentDate = getNextAppointmentDate as jest.MockedFunction<typeof getNextAppointmentDate>;

describe('dateUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatDisplayDate', () => {
    it('should format date strings correctly in US format', () => {
      expect(formatDisplayDate('2025-08-12')).toBe('08/12/2025');
      expect(formatDisplayDate('2025-01-01')).toBe('01/01/2025');
      expect(formatDisplayDate('2025-12-31')).toBe('12/31/2025');
    });

    it('should handle ISO datetime strings correctly', () => {
      expect(formatDisplayDate('2025-08-12T00:00:00')).toBe('08/12/2025');
      expect(formatDisplayDate('2025-08-12T10:30:00Z')).toBe('08/12/2025');
    });

    it('should treat ISO strings with Z as calendar date (e.g. PostgreSQL DATE)', () => {
      expect(formatDisplayDate('2026-03-10T00:00:00.000Z')).toBe('03/10/2026');
      expect(formatDisplayDate('2026-01-01T00:00:00.000Z')).toBe('01/01/2026');
    });

    it('should handle empty strings', () => {
      expect(formatDisplayDate('')).toBe('');
    });

    it('should handle invalid dates by returning the original string', () => {
      expect(formatDisplayDate('invalid-date')).toBe('invalid-date');
    });

    it('should be timezone-safe for date-only strings', () => {
      const dateStr = '2025-08-12';
      const result = formatDisplayDate(dateStr);
      expect(result).toBe('08/12/2025');

      const testDate = new Date(dateStr + 'T00:00:00');
      expect(testDate.getDate()).toBe(12);
      expect(testDate.getMonth() + 1).toBe(8);
      expect(testDate.getFullYear()).toBe(2025);
    });
  });

  describe('formatDisplayDateWithDayOfWeek', () => {
    it('should format date strings with day of week in US long format', () => {
      expect(formatDisplayDateWithDayOfWeek('2025-08-12')).toMatch(/Tuesday, August 12, 2025/);
      expect(formatDisplayDateWithDayOfWeek('2025-01-01')).toMatch(/Wednesday, January 1, 2025/);
      expect(formatDisplayDateWithDayOfWeek('2025-12-31')).toMatch(/Wednesday, December 31, 2025/);
    });

    it('should handle ISO datetime strings correctly', () => {
      expect(formatDisplayDateWithDayOfWeek('2025-08-12T00:00:00')).toMatch(/Tuesday, August 12, 2025/);
      expect(formatDisplayDateWithDayOfWeek('2025-08-12T10:30:00Z')).toMatch(/Tuesday, August 12, 2025/);
    });

    it('should treat ISO strings with Z as calendar date (e.g. PostgreSQL DATE)', () => {
      expect(formatDisplayDateWithDayOfWeek('2024-08-12T00:00:00.000Z')).toMatch(/Monday, August 12, 2024/);
    });

    it('should handle empty strings', () => {
      expect(formatDisplayDateWithDayOfWeek('')).toBe('');
    });

    it('should handle invalid dates by returning the original string', () => {
      expect(formatDisplayDateWithDayOfWeek('invalid-date')).toBe('invalid-date');
    });

    it('should correctly identify all days of the week', () => {
      expect(formatDisplayDateWithDayOfWeek('2025-08-11')).toMatch(/Monday, August 11, 2025/);
      expect(formatDisplayDateWithDayOfWeek('2025-08-12')).toMatch(/Tuesday, August 12, 2025/);
      expect(formatDisplayDateWithDayOfWeek('2025-08-13')).toMatch(/Wednesday, August 13, 2025/);
      expect(formatDisplayDateWithDayOfWeek('2025-08-14')).toMatch(/Thursday, August 14, 2025/);
      expect(formatDisplayDateWithDayOfWeek('2025-08-15')).toMatch(/Friday, August 15, 2025/);
      expect(formatDisplayDateWithDayOfWeek('2025-08-16')).toMatch(/Saturday, August 16, 2025/);
      expect(formatDisplayDateWithDayOfWeek('2025-08-17')).toMatch(/Sunday, August 17, 2025/);
    });

    it('should be timezone-safe for date-only strings', () => {
      const dateStr = '2025-08-12';
      const result = formatDisplayDateWithDayOfWeek(dateStr);
      expect(result).toMatch(/Tuesday, August 12, 2025/);

      const testDate = new Date(dateStr + 'T00:00:00');
      expect(testDate.getDate()).toBe(12);
      expect(testDate.getMonth() + 1).toBe(8);
      expect(testDate.getFullYear()).toBe(2025);
      expect(testDate.getDay()).toBe(2);
    });
  });

  describe('getDefaultSchedulingDate', () => {
    it('should return API result when successful', async () => {
      const testDate = "2024-01-15";
      mockGetNextAppointmentDate.mockResolvedValue({
        success: true,
        value: { nextDate: testDate },
      });

      const result = await getDefaultSchedulingDate();
      expect(result).toBe(testDate);
    });

    it('should fallback to next Tuesday when API fails', async () => {
      mockGetNextAppointmentDate.mockRejectedValue(new Error('API Error'));

      const result = await getDefaultSchedulingDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getDaysOverdue', () => {
    it('should return 0 for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      expect(getDaysOverdue(futureDateStr)).toBe(0);
    });

    it('should return 0 for invalid dates', () => {
      expect(getDaysOverdue('invalid')).toBe(0);
    });
  });

  describe('getDaysUntil', () => {
    it('should return 0 for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      expect(getDaysUntil(pastDate)).toBe(0);
    });

    it('should return 0 for invalid dates', () => {
      expect(getDaysUntil('invalid')).toBe(0);
    });
  });
});
