/**
 * AppointmentSelectors Tests
 * 
 * Tests for the appointment store selector hooks
 */

import { renderHook } from '@testing-library/react';
import { useBoardStore } from '../boardStore';
import {
  useAppointmentActions,
  useBoardDateState,
  useAppointmentDragState,
  useAppointmentEndOfDayState,
  useDraggedItem,
  useIsDragging,
  useSetDraggedItem,
  useSetIsDragging,
  useSelectedDate,
  useSetSelectedDate,
  useAppointmentLoading,
  useAppointmentError,
  useDayFinalized,
  useSetDayFinalized,
  useCheckEndOfDayStatus,
  useFinalizeEndOfDay,
  useEndOfDayStatus,
  useBoardDataLoading,
  useSetAppointmentLoading,
  useSetAppointmentDataLoading,
  useSetAppointmentError
} from '../boardSelectors';

// Mock the boardStore
jest.mock('../boardStore', () => ({
  useBoardStore: jest.fn()
}));

const mockUseAppointmentStore = useBoardStore as jest.MockedFunction<typeof useBoardStore>;

describe('boardSelectors', () => {
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

  describe('useAppointmentActions', () => {
    it('should return all action functions', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useAppointmentActions());
      
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

  describe('useBoardDateState', () => {
    it('should return date-related state', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useBoardDateState());
      
      expect(result.current).toEqual({
        selectedDate: mockState.selectedDate,
        loading: mockState.loading,
        dataLoading: mockState.dataLoading,
        error: mockState.error,
      });
    });
  });

  describe('useAppointmentDragState', () => {
    it('should return drag-related state', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useAppointmentDragState());
      
      expect(result.current).toEqual({
        draggedItem: mockState.draggedItem,
        isDragging: mockState.isDragging,
      });
    });
  });

  describe('useAppointmentEndOfDayState', () => {
    it('should return endOfDay related state', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useAppointmentEndOfDayState());
      
      expect(result.current).toEqual({
        dayFinalized: mockState.dayFinalized,
        endOfDayStatus: mockState.endOfDayStatus,
      });
    });
  });

  describe('Individual state selectors', () => {
    it('useDraggedItem should return dragged item', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useDraggedItem());
      
      expect(result.current).toBe(mockState.draggedItem);
    });

    it('useIsDragging should return isDragging state', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useIsDragging());
      
      expect(result.current).toBe(mockState.isDragging);
    });

    it('useSelectedDate should return selected date', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useSelectedDate());
      
      expect(result.current).toBe(mockState.selectedDate);
    });

    it('useAppointmentLoading should return loading state', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useAppointmentLoading());
      
      expect(result.current).toBe(mockState.loading);
    });

    it('useAppointmentError should return error state', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useAppointmentError());
      
      expect(result.current).toBe(mockState.error);
    });

    it('useDayFinalized should return dayFinalized state', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useDayFinalized());
      
      expect(result.current).toBe(mockState.dayFinalized);
    });

    it('useEndOfDayStatus should return endOfDayStatus', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useEndOfDayStatus());
      
      expect(result.current).toBe(mockState.endOfDayStatus);
    });

    it('useBoardDataLoading should return dataLoading state', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useBoardDataLoading());
      
      expect(result.current).toBe(mockState.dataLoading);
    });
  });

  describe('Individual action selectors', () => {
    it('useSetDraggedItem should return setDraggedItem action', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useSetDraggedItem());
      
      expect(result.current).toBe(mockState.setDraggedItem);
    });

    it('useSetIsDragging should return setIsDragging action', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useSetIsDragging());
      
      expect(result.current).toBe(mockState.setIsDragging);
    });

    it('useSetSelectedDate should return setSelectedDate action', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useSetSelectedDate());
      
      expect(result.current).toBe(mockState.setSelectedDate);
    });

    it('useSetDayFinalized should return setDayFinalized action', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useSetDayFinalized());
      
      expect(result.current).toBe(mockState.setDayFinalized);
    });

    it('useCheckEndOfDayStatus should return checkEndOfDayStatus action', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useCheckEndOfDayStatus());
      
      expect(result.current).toBe(mockState.checkEndOfDayStatus);
    });

    it('useFinalizeEndOfDay should return finalizeEndOfDay action', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useFinalizeEndOfDay());
      
      expect(result.current).toBe(mockState.finalizeEndOfDay);
    });

    it('useSetAppointmentLoading should return setLoading action', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useSetAppointmentLoading());
      
      expect(result.current).toBe(mockState.setLoading);
    });

    it('useSetAppointmentDataLoading should return setDataLoading action', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useSetAppointmentDataLoading());
      
      expect(result.current).toBe(mockState.setDataLoading);
    });

    it('useSetAppointmentError should return setError action', () => {
      mockUseAppointmentStore.mockImplementation((selector) => selector(mockState));
      
      const { result } = renderHook(() => useSetAppointmentError());
      
      expect(result.current).toBe(mockState.setError);
    });
  });
});