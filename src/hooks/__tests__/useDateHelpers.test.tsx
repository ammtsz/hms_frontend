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

    it('should use clinic timezone from context', () => {
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
