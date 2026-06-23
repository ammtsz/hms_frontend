/**
 * Appointment Store Selectors
 * 
 * Optimized selectors for the appointment store to prevent unnecessary re-renders
 * and provide cleaner component interfaces for drag & drop operations.
 */

import { useBoardStore } from './boardStore';

// Action selectors (stable references)
export const useAppointmentActions = () => useBoardStore(state => ({
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
export const useBoardDateState = () => ({
  selectedDate: useBoardStore(state => state.selectedDate),
  loading: useBoardStore(state => state.loading),
  dataLoading: useBoardStore(state => state.dataLoading),
  error: useBoardStore(state => state.error),
});

export const useAppointmentDragState = () => ({
  draggedItem: useBoardStore(state => state.draggedItem),
  isDragging: useBoardStore(state => state.isDragging),
});

export const useAppointmentEndOfDayState = () => ({
  dayFinalized: useBoardStore(state => state.dayFinalized),
  endOfDayStatus: useBoardStore(state => state.endOfDayStatus),
});

// Drag & drop specific selectors (for components that only need drag state)
export const useDraggedItem = () => useBoardStore(state => state.draggedItem);
export const useIsDragging = () => useBoardStore(state => state.isDragging);
export const useSetDraggedItem = () => useBoardStore(state => state.setDraggedItem);
export const useSetIsDragging = () => useBoardStore(state => state.setIsDragging);

// Date selectors (for components that only need date state)
export const useSelectedDate = () => useBoardStore(state => state.selectedDate);
export const useSetSelectedDate = () => useBoardStore(state => state.setSelectedDate);
export const useAppointmentLoading = () => useBoardStore(state => state.loading);
export const useAppointmentError = () => useBoardStore(state => state.error);

// End-of-day selectors (for workflow components)
export const useDayFinalized = () => useBoardStore(state => state.dayFinalized);
export const useSetDayFinalized = () => useBoardStore(state => state.setDayFinalized);
export const useCheckEndOfDayStatus = () => useBoardStore(state => state.checkEndOfDayStatus);
export const useFinalizeEndOfDay = () => useBoardStore(state => state.finalizeEndOfDay);
export const useEndOfDayStatus = () => useBoardStore(state => state.endOfDayStatus);

// Additional action selectors for the hybrid hook
export const useBoardDataLoading = () => useBoardStore(state => state.dataLoading);
export const useSetAppointmentLoading = () => useBoardStore(state => state.setLoading);
export const useSetAppointmentDataLoading = () => useBoardStore(state => state.setDataLoading);
export const useSetAppointmentError = () => useBoardStore(state => state.setError);