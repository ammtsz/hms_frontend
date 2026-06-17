/**
 * AttendanceSelectors Tests
 * 
 * Tests for the attendance store selector hooks
 */

import { renderHook } from '@testing-library/react';
import { useAttendanceStore } from '../attendanceStore';
import {
  useAttendanceActions,
  useAttendanceDateState,
  useAttendanceDragState,
  useAttendanceEndOfDayState,
  useDraggedItem,
  useIsDragging,
  useSetDraggedItem,
  useSetIsDragging,
  useSelectedDate,
  useSetSelectedDate,
  useAttendanceLoading,
  useAttendanceError,
  useDayFinalized,
  useSetDayFinalized,
  useCheckEndOfDayStatus,
  useFinalizeEndOfDay,
  useEndOfDayStatus,
  useAttendanceDataLoading,
  useSetAttendanceLoading,
  useSetAttendanceDataLoading,
  useSetAttendanceError
} from '../attendanceSelectors';

// Mock the attendanceStore
jest.mock('../attendanceStore', () => ({
  useAttendanceStore: jest.fn()
}));

const mockUseAttendanceStore = useAttendanceStore as jest.MockedFunction<typeof useAttendanceStore>;

describe('attendanceSelectors', () => {
  const mockState = {
    selectedDate: '2025-01-15',
    loading: false,
    dataLoading: true,
    error: 'Test error',
    draggedItem: {
      type: 'assessment' as const,
      status: 'scheduled' as const,
      idx: 0,
      patientId: 123
    },
    isDragging: true,
    dayFinalized: false,
    endOfDayStatus: null,
    setSelectedDate: jest.fn(),
    setLoading: jest.fn(),
    setDataLoading: jest.fn(),
    setError: jest.fn(),
    setDraggedItem: jest.fn(),
    setIsDragging: jest.fn(),
    setDayFinalized: jest.fn(),
    checkEndOfDayStatus: jest.fn(),
    finalizeEndOfDay: jest.fn(),
    resetState: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAttendanceActions', () => {
    it('should return all action functions', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useAttendanceActions());
      
      expect(result.current).toHaveProperty('setSelectedDate');
      expect(result.current).toHaveProperty('setLoading');
      expect(result.current).toHaveProperty('setDataLoading');
      expect(result.current).toHaveProperty('setError');
      expect(result.current).toHaveProperty('setDraggedItem');
      expect(result.current).toHaveProperty('setIsDragging');
      expect(result.current).toHaveProperty('setDayFinalized');
      expect(result.current).toHaveProperty('checkEndOfDayStatus');
      expect(result.current).toHaveProperty('finalizeEndOfDay');
      expect(result.current).toHaveProperty('resetState');
    });
  });

  describe('useAttendanceDateState', () => {
    it('should return date-related state', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useAttendanceDateState());
      
      expect(result.current).toEqual({
        selectedDate: mockState.selectedDate,
        loading: mockState.loading,
        dataLoading: mockState.dataLoading,
        error: mockState.error,
      });
    });
  });

  describe('useAttendanceDragState', () => {
    it('should return drag-related state', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useAttendanceDragState());
      
      expect(result.current).toEqual({
        draggedItem: mockState.draggedItem,
        isDragging: mockState.isDragging,
      });
    });
  });

  describe('useAttendanceEndOfDayState', () => {
    it('should return endOfDay related state', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useAttendanceEndOfDayState());
      
      expect(result.current).toEqual({
        dayFinalized: mockState.dayFinalized,
        endOfDayStatus: mockState.endOfDayStatus,
      });
    });
  });

  describe('Individual state selectors', () => {
    it('useDraggedItem should return dragged item', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useDraggedItem());
      
      expect(result.current).toBe(mockState.draggedItem);
    });

    it('useIsDragging should return isDragging state', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useIsDragging());
      
      expect(result.current).toBe(mockState.isDragging);
    });

    it('useSelectedDate should return selected date', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useSelectedDate());
      
      expect(result.current).toBe(mockState.selectedDate);
    });

    it('useAttendanceLoading should return loading state', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useAttendanceLoading());
      
      expect(result.current).toBe(mockState.loading);
    });

    it('useAttendanceError should return error state', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useAttendanceError());
      
      expect(result.current).toBe(mockState.error);
    });

    it('useDayFinalized should return dayFinalized state', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useDayFinalized());
      
      expect(result.current).toBe(mockState.dayFinalized);
    });

    it('useEndOfDayStatus should return endOfDayStatus', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useEndOfDayStatus());
      
      expect(result.current).toBe(mockState.endOfDayStatus);
    });

    it('useAttendanceDataLoading should return dataLoading state', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useAttendanceDataLoading());
      
      expect(result.current).toBe(mockState.dataLoading);
    });
  });

  describe('Individual action selectors', () => {
    it('useSetDraggedItem should return setDraggedItem action', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useSetDraggedItem());
      
      expect(result.current).toBe(mockState.setDraggedItem);
    });

    it('useSetIsDragging should return setIsDragging action', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useSetIsDragging());
      
      expect(result.current).toBe(mockState.setIsDragging);
    });

    it('useSetSelectedDate should return setSelectedDate action', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useSetSelectedDate());
      
      expect(result.current).toBe(mockState.setSelectedDate);
    });

    it('useSetDayFinalized should return setDayFinalized action', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useSetDayFinalized());
      
      expect(result.current).toBe(mockState.setDayFinalized);
    });

    it('useCheckEndOfDayStatus should return checkEndOfDayStatus action', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useCheckEndOfDayStatus());
      
      expect(result.current).toBe(mockState.checkEndOfDayStatus);
    });

    it('useFinalizeEndOfDay should return finalizeEndOfDay action', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useFinalizeEndOfDay());
      
      expect(result.current).toBe(mockState.finalizeEndOfDay);
    });

    it('useSetAttendanceLoading should return setLoading action', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useSetAttendanceLoading());
      
      expect(result.current).toBe(mockState.setLoading);
    });

    it('useSetAttendanceDataLoading should return setDataLoading action', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useSetAttendanceDataLoading());
      
      expect(result.current).toBe(mockState.setDataLoading);
    });

    it('useSetAttendanceError should return setError action', () => {
      mockUseAttendanceStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useSetAttendanceError());
      
      expect(result.current).toBe(mockState.setError);
    });
  });
});