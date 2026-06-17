/**
 * Attendance Store Selectors
 * 
 * Optimized selectors for the attendance store to prevent unnecessary re-renders
 * and provide cleaner component interfaces for drag & drop operations.
 */

import { useAttendanceStore } from './attendanceStore';

// Action selectors (stable references)
export const useAttendanceActions = () => useAttendanceStore(state => ({
  setSelectedDate: state.setSelectedDate,
  setLoading: state.setLoading,
  setDataLoading: state.setDataLoading,
  setError: state.setError,
  setDraggedItem: state.setDraggedItem,
  setIsDragging: state.setIsDragging,
  setDayFinalized: state.setDayFinalized,
  checkEndOfDayStatus: state.checkEndOfDayStatus,
  finalizeEndOfDay: state.finalizeEndOfDay,
  resetState: state.resetState,
}));

// Performance-optimized composite selectors
export const useAttendanceDateState = () => ({
  selectedDate: useAttendanceStore(state => state.selectedDate),
  loading: useAttendanceStore(state => state.loading),
  dataLoading: useAttendanceStore(state => state.dataLoading),
  error: useAttendanceStore(state => state.error),
});

export const useAttendanceDragState = () => ({
  draggedItem: useAttendanceStore(state => state.draggedItem),
  isDragging: useAttendanceStore(state => state.isDragging),
});

export const useAttendanceEndOfDayState = () => ({
  dayFinalized: useAttendanceStore(state => state.dayFinalized),
  endOfDayStatus: useAttendanceStore(state => state.endOfDayStatus),
});

// Drag & drop specific selectors (for components that only need drag state)
export const useDraggedItem = () => useAttendanceStore(state => state.draggedItem);
export const useIsDragging = () => useAttendanceStore(state => state.isDragging);
export const useSetDraggedItem = () => useAttendanceStore(state => state.setDraggedItem);
export const useSetIsDragging = () => useAttendanceStore(state => state.setIsDragging);

// Date selectors (for components that only need date state)
export const useSelectedDate = () => useAttendanceStore(state => state.selectedDate);
export const useSetSelectedDate = () => useAttendanceStore(state => state.setSelectedDate);
export const useAttendanceLoading = () => useAttendanceStore(state => state.loading);
export const useAttendanceError = () => useAttendanceStore(state => state.error);

// End-of-day selectors (for workflow components)
export const useDayFinalized = () => useAttendanceStore(state => state.dayFinalized);
export const useSetDayFinalized = () => useAttendanceStore(state => state.setDayFinalized);
export const useCheckEndOfDayStatus = () => useAttendanceStore(state => state.checkEndOfDayStatus);
export const useFinalizeEndOfDay = () => useAttendanceStore(state => state.finalizeEndOfDay);
export const useEndOfDayStatus = () => useAttendanceStore(state => state.endOfDayStatus);

// Additional action selectors for the hybrid hook
export const useAttendanceDataLoading = () => useAttendanceStore(state => state.dataLoading);
export const useSetAttendanceLoading = () => useAttendanceStore(state => state.setLoading);
export const useSetAttendanceDataLoading = () => useAttendanceStore(state => state.setDataLoading);
export const useSetAttendanceError = () => useAttendanceStore(state => state.setError);