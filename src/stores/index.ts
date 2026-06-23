/**
 * Stores Barrel Export
 * 
 * Centralized exports for all Zustand stores
 */

// Board Store - Core drag & drop and workflow UI state
export { useBoardStore } from './boardStore';

// Calendar store - scheduling UI state  
export {
  useScheduleStore,
  SCHEDULE_DAY_WINDOW_OPTIONS,
  type ScheduleDayWindowDays,
  defaultScheduleCalendarStatusFilters,
} from './scheduleStore';

// Calendar selectors - optimized selectors for performance
export {
  // State selectors
  useSelectedDateString,
  useScheduleDayWindowDays,
  useScheduleStatusFilters,
  usePatientFilter,
  useConfirmRemove,
  useShowNewAppointment,
  useOpenAssessmentIdx,
  useOpenPhysiotherapyIdx,
  
  // Individual action selectors
  useSetSelectedDateString,
  useSetScheduleDayWindowDays,
  useSetScheduleStatusFilters,
  useSetPatientFilter,
  useSetConfirmRemove,
  useSetShowNewAppointment,
  useSetOpenAssessmentIdx,
  useSetOpenPhysiotherapyIdx,
  
  // Combined selectors (use sparingly)
  useScheduleActions,
} from './scheduleSelectors';

// Appointment Selectors - Optimized selectors for drag & drop performance
export {
  useAppointmentActions,
  
  // Composite selectors (when you need multiple related values)
  useBoardDateState,
  useAppointmentDragState,
  useAppointmentEndOfDayState,
  
  // Individual state selectors (optimal performance)
  useSelectedDate,
  useAppointmentLoading,
  useBoardDataLoading,
  useAppointmentError,
  useDraggedItem,
  useIsDragging,
  useDayFinalized,
  useEndOfDayStatus,
  
  // Individual action selectors (stable references)
  useSetSelectedDate,
  useSetAppointmentLoading,
  useSetAppointmentDataLoading,
  useSetAppointmentError,
  useSetDraggedItem,
  useSetIsDragging,
  useSetDayFinalized,
  useCheckEndOfDayStatus,
  useFinalizeEndOfDay,
} from './boardSelectors';

// Export store types for convenience
export type { BoardStore } from './boardStore';
export type { ScheduleStore } from './scheduleStore';