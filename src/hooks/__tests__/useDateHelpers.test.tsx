/**
 * Tests for useDateHelpers hook
 */

import { renderHook } from '@testing-library/react';
import { useDateHelpers } from '../useDateHelpers';
import { ClinicTimezoneProvider } from '@/contexts/ClinicTimezoneContext';
import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ClinicTimezoneProvider>{children}</ClinicTimezoneProvider>
);

describe('useDateHelpers', () => {
  describe('getTodayDate', () => {
    it('should return today in YYYY-MM-DD format', () => {
      const { result } = renderHook(() => useDateHelpers(), { wrapper });
      
      const today = result.current.getTodayDate();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should use user timezone from context', () => {
      const { result } = renderHook(() => useDateHelpers(), { wrapper });
      
      const today = result.current.getTodayDate();
      expect(typeof today).toBe('string');
      expect(today.length).toBe(10); // YYYY-MM-DD is 10 characters
    });
  });

  describe('formatDate', () => {
    it('should return today when no date provided', () => {
      const { result } = renderHook(() => useDateHelpers(), { wrapper });
      
      const formatted = result.current.formatDate();
      const today = result.current.getTodayDate();
      
      expect(formatted).toBe(today);
    });

    it('should return date as-is if already in YYYY-MM-DD format', () => {
      const { result } = renderHook(() => useDateHelpers(), { wrapper });
      
      const formatted = result.current.formatDate('2026-01-21');
      expect(formatted).toBe('2026-01-21');
    });

    it('should format Date objects', () => {
      const { result } = renderHook(() => useDateHelpers(), { wrapper });
      
      const date = new Date('2026-01-21T12:00:00Z');
      const formatted = result.current.formatDate(date);
      
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle null gracefully', () => {
      const { result } = renderHook(() => useDateHelpers(), { wrapper });
      
      const formatted = result.current.formatDate(null);
      const today = result.current.getTodayDate();
      
      expect(formatted).toBe(today);
    });

    it('should handle invalid date strings', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const { result } = renderHook(() => useDateHelpers(), { wrapper });
      
      const formatted = result.current.formatDate('invalid-date');
      const today = result.current.getTodayDate();
      
      expect(formatted).toBe(today);
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getNow', () => {
    it('should return a Date object', () => {
      const { result } = renderHook(() => useDateHelpers(), { wrapper });
      
      const now = result.current.getNow();
      expect(now).toBeInstanceOf(Date);
    });

    it('should return current time', () => {
      const { result } = renderHook(() => useDateHelpers(), { wrapper });
      
      const before = Date.now();
      const now = result.current.getNow();
      const after = Date.now();
      
      expect(now.getTime()).toBeGreaterThanOrEqual(before);
      expect(now.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe('formatDateInTimezone', () => {
    it('should format date in specified timezone', () => {
      const { result } = renderHook(() => useDateHelpers(), { wrapper });
      
      const date = new Date('2026-01-21T12:00:00Z');
      const formatted = result.current.formatDateInTimezone(date, 'America/Los_Angeles');
      
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should use user timezone if not specified', () => {
      const { result } = renderHook(() => useDateHelpers(), { wrapper });
      
      const date = new Date('2026-01-21T12:00:00Z');
      const formatted = result.current.formatDateInTimezone(date);
      
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle string dates', () => {
      const { result } = renderHook(() => useDateHelpers(), { wrapper });
      
      const formatted = result.current.formatDateInTimezone('2026-01-21', 'America/Sao_Paulo');
      expect(formatted).toBe('2026-01-21');
    });
  });

  describe('hook stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useDateHelpers(), { wrapper });
      
      const firstGetTodayDate = result.current.getTodayDate;
      const firstFormatDate = result.current.formatDate;
      
      rerender();
      
      // Functions should be stable (same reference) due to useCallback
      expect(result.current.getTodayDate).toBe(firstGetTodayDate);
      expect(result.current.formatDate).toBe(firstFormatDate);
    });
  });
});
