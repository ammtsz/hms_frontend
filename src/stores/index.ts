/**
 * Stores Barrel Export
 * 
 * Centralized exports for all Zustand stores
 */

// Attendance Store - Core drag & drop and workflow management
export { useAttendanceStore } from './attendanceStore';

// Agenda Store - Calendar and scheduling UI state  
export {
  useAgendaStore,
  AGENDA_DAY_WINDOW_OPTIONS,
  type AgendaDayWindowDays,
  defaultAgendaCalendarStatusFilters,
} from './agendaStore';

// Agenda Selectors - Optimized selectors for performance
export {
  // State selectors
  useSelectedDateString,
  useAgendaDayWindowDays,
  useAgendaStatusFilters,
  usePatientFilter,
  useConfirmRemove,
  useShowNewAttendance,
  useOpenAssessmentIdx,
  useOpenPhysiotherapyIdx,
  
  // Individual action selectors
  useSetSelectedDateString,
  useSetAgendaDayWindowDays,
  useSetAgendaStatusFilters,
  useSetPatientFilter,
  useSetConfirmRemove,
  useSetShowNewAttendance,
  useSetOpenAssessmentIdx,
  useSetOpenPhysiotherapyIdx,
  
  // Combined selectors (use sparingly)
  useAgendaActions,
} from './agendaSelectors';

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
export type { AgendaStore } from './agendaStore';