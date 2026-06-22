/**
 * Stores Barrel Export
 * 
 * Centralized exports for all Zustand stores
 */

// Attendance Store - Core drag & drop and workflow management
export { useAttendanceStore } from './attendanceStore';

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
  useShowNewAttendance,
  useOpenAssessmentIdx,
  useOpenPhysiotherapyIdx,
  
  // Individual action selectors
  useSetSelectedDateString,
  useSetScheduleDayWindowDays,
  useSetScheduleStatusFilters,
  useSetPatientFilter,
  useSetConfirmRemove,
  useSetShowNewAttendance,
  useSetOpenAssessmentIdx,
  useSetOpenPhysiotherapyIdx,
  
  // Combined selectors (use sparingly)
  useScheduleActions,
} from './scheduleSelectors';

// Attendance Selectors - Optimized selectors for drag & drop performance
export {
  useAttendanceActions,
  
  // Composite selectors (when you need multiple related values)
  useAttendanceDateState,
  useAttendanceDragState,
  useAttendanceEndOfDayState,
  
  // Individual state selectors (optimal performance)
  useSelectedDate,
  useAttendanceLoading,
  useAttendanceDataLoading,
  useAttendanceError,
  useDraggedItem,
  useIsDragging,
  useDayFinalized,
  useEndOfDayStatus,
  
  // Individual action selectors (stable references)
  useSetSelectedDate,
  useSetAttendanceLoading,
  useSetAttendanceDataLoading,
  useSetAttendanceError,
  useSetDraggedItem,
  useSetIsDragging,
  useSetDayFinalized,
  useCheckEndOfDayStatus,
  useFinalizeEndOfDay,
} from './attendanceSelectors';

// Export store types for convenience
export type { AttendanceStore } from './attendanceStore';
export type { ScheduleStore } from './scheduleStore';