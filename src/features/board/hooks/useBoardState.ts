/**
 * useBoardState - Hybrid Hook
 *
 * Composes date URL sync, React Query server sync, and end-of-day workflow.
 */

export type {
  AbsenceJustification,
  EndOfDayData,
  EndOfDayResult,
  UseAppointmentsBoardStateReturn,
} from './boardTypes';

import type { UseAppointmentsBoardStateReturn } from './boardTypes';
import { useBoardDateState } from './useBoardDateState';
import { useBoardServerSync } from './useBoardServerSync';
import { useEndOfDayBridge } from './useEndOfDayBridge';

export function useBoardState(): UseAppointmentsBoardStateReturn {
  const {
    selectedDate,
    loading,
    setSelectedDate,
    initializeSelectedDate,
  } = useBoardDateState();

  const {
    appointmentsByDate,
    dataLoading,
    error,
    setAppointmentsByDate,
    loadAppointmentsByDate,
    refreshCurrentDate,
  } = useBoardServerSync(selectedDate, setSelectedDate);

  const {
    dayFinalized,
    endOfDayStatus,
    checkEndOfDayStatus,
    handleIncompleteAppointments,
    handleAbsenceJustifications,
  } = useEndOfDayBridge(appointmentsByDate);

  return {
    appointmentsByDate,
    selectedDate,
    loading,
    dataLoading,
    error,
    dayFinalized,
    endOfDayStatus,
    setSelectedDate,
    setAppointmentsByDate,
    loadAppointmentsByDate,
    initializeSelectedDate,
    refreshCurrentDate,
    checkEndOfDayStatus,
    handleIncompleteAppointments,
    handleAbsenceJustifications,
  };
}
