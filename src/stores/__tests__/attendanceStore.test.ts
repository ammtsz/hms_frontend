/**
 * Attendance Store Tests
 */

import { act, renderHook } from '@testing-library/react';
import { useAttendanceStore } from '../attendanceStore';
import { getTodayClinic } from '@/utils/timezoneDate';

describe('useAttendanceStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAttendanceStore.getState().resetState();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAttendanceStore());
      
      expect(result.current.selectedDate).toBe(getTodayClinic());
      expect(result.current.loading).toBe(true);
      expect(result.current.dataLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.draggedItem).toBe(null);
      expect(result.current.isDragging).toBe(false);
      expect(result.current.dayFinalized).toBe(false);
      expect(result.current.endOfDayStatus).toBe(null);
    });
  });

  describe('Date Management', () => {
    it('should update selected date', () => {
      const { result } = renderHook(() => useAttendanceStore());
      
      act(() => {
        result.current.setSelectedDate('2025-12-25');
      });
      
      expect(result.current.selectedDate).toBe('2025-12-25');
    });

    it('should update loading states', () => {
      const { result } = renderHook(() => useAttendanceStore());
      
      act(() => {
        result.current.setLoading(false);
        result.current.setDataLoading(true);
      });
      
      expect(result.current.loading).toBe(false);
      expect(result.current.dataLoading).toBe(true);
    });

    it('should set and clear errors', () => {
      const { result } = renderHook(() => useAttendanceStore());
      
      act(() => {
        result.current.setError('Test error');
      });
      
      expect(result.current.error).toBe('Test error');
      
      act(() => {
        result.current.setError(null);
      });
      
      expect(result.current.error).toBe(null);
    });
  });

  describe('Drag & Drop Management', () => {
    it('should manage drag state', () => {
      const { result } = renderHook(() => useAttendanceStore());
      
      const mockDragItem = {
        type: 'assessment' as const,
        status: 'scheduled' as const,
        idx: 0,
        patientId: 1,
      };
      
      act(() => {
        result.current.setDraggedItem(mockDragItem);
        result.current.setIsDragging(true);
      });
      
      expect(result.current.draggedItem).toEqual(mockDragItem);
      expect(result.current.isDragging).toBe(true);
      
      act(() => {
        result.current.setDraggedItem(null);
        result.current.setIsDragging(false);
      });
      
      expect(result.current.draggedItem).toBe(null);
      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('End-of-day Workflow', () => {
    it('should manage day finalization state', () => {
      const { result } = renderHook(() => useAttendanceStore());
      
      act(() => {
        result.current.setDayFinalized(true);
      });
      
      expect(result.current.dayFinalized).toBe(true);
      
      act(() => {
        result.current.setDayFinalized(false);
      });
      
      expect(result.current.dayFinalized).toBe(false);
    });

    it('should check endOfDay status with no data', () => {
      const { result } = renderHook(() => useAttendanceStore());
      
      const status = result.current.checkEndOfDayStatus(null);
      
      expect(status).toEqual({
        type: 'incomplete',
        incompleteAttendances: []
      });
    });

    it('should check endOfDay status with completed day', () => {
      const { result } = renderHook(() => useAttendanceStore());
      
      const emptyAttendanceData = {
        date: getTodayClinic(),
        assessment: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: []
        },
        physiotherapy: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: []
        },
        tens: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: []
        },
        combined: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: []
        }
      };
      
      const status = result.current.checkEndOfDayStatus(emptyAttendanceData);
      
      expect(status.type).toBe('completed');
    });
  });

  describe('State Reset', () => {
    it('should reset state to initial values', () => {
      const { result } = renderHook(() => useAttendanceStore());
      
      // Modify state
      act(() => {
        result.current.setSelectedDate('2025-12-25');
        result.current.setLoading(false);
        result.current.setError('Test error');
        result.current.setIsDragging(true);
        result.current.setDayFinalized(true);
      });
      
      // Reset state
      act(() => {
        result.current.resetState();
      });
      
      // Check initial values are restored
      expect(result.current.selectedDate).toBe(getTodayClinic());
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.isDragging).toBe(false);
      expect(result.current.dayFinalized).toBe(false);
    });
  });
});