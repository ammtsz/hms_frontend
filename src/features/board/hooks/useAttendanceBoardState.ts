/**
 * useAttendanceBoardState - Hybrid Hook
 *
 * Composes date URL sync, React Query server sync, and end-of-day workflow.
 */

export type {
  AbsenceJustification,
  EndOfDayData,
  EndOfDayResult,
  UseAttendanceBoardStateReturn,
} from './attendanceBoardTypes';

import type { UseAttendanceBoardStateReturn } from './attendanceBoardTypes';
import { useAttendanceDateState } from './useAttendanceDateState';
import { useAttendanceServerSync } from './useAttendanceServerSync';
import { useEndOfDayBridge } from './useEndOfDayBridge';

export function useAttendanceBoardState(): UseAttendanceBoardStateReturn {
  const {
    selectedDate,
    loading,
    setSelectedDate,
    initializeSelectedDate,
  } = useAttendanceDateState();

  const {
    attendancesByDate,
    dataLoading,
    error,
    setAttendancesByDate,
    loadAttendancesByDate,
    refreshCurrentDate,
  } = useAttendanceServerSync(selectedDate, setSelectedDate);

  const {
    dayFinalized,
    endOfDayStatus,
    checkEndOfDayStatus,
    handleIncompleteAttendances,
    handleAbsenceJustifications,
  } = useEndOfDayBridge(attendancesByDate);

  return {
    attendancesByDate,
    selectedDate,
    loading,
    dataLoading,
    error,
    dayFinalized,
    endOfDayStatus,
    setSelectedDate,
    setAttendancesByDate,
    loadAttendancesByDate,
    initializeSelectedDate,
    refreshCurrentDate,
    checkEndOfDayStatus,
    handleIncompleteAttendances,
    handleAbsenceJustifications,
  };
}
