import { useCallback } from 'react';
import {
  useHandleIncompleteAttendances,
  useHandleAbsenceJustifications,
} from '@/api/query/hooks/useAttendanceQueries';
import {
  useCheckEndOfDayStatus,
  useDayFinalized,
  useEndOfDayStatus,
} from '@/stores';
import type { AttendanceByDate, AttendanceStatusDetail } from '@/types/types';
import type { AbsenceJustification, EndOfDayResult } from './attendanceBoardTypes';

export interface UseEndOfDayBridgeReturn {
  dayFinalized: boolean;
  endOfDayStatus: EndOfDayResult | null;
  checkEndOfDayStatus: () => EndOfDayResult;
  handleIncompleteAttendances: (
    attendances: AttendanceStatusDetail[],
    action: 'complete' | 'reschedule',
  ) => Promise<boolean>;
  handleAbsenceJustifications: (
    justifications: AbsenceJustification[],
  ) => Promise<boolean>;
}

export function useEndOfDayBridge(
  attendancesByDate: AttendanceByDate | null,
): UseEndOfDayBridgeReturn {
  const dayFinalized = useDayFinalized();
  const endOfDayStatus = useEndOfDayStatus();
  const checkEndOfDayStatusAction = useCheckEndOfDayStatus();

  const handleIncompletesMutation = useHandleIncompleteAttendances();
  const handleAbsencesMutation = useHandleAbsenceJustifications();

  const checkEndOfDayStatus = useCallback((): EndOfDayResult => {
    return checkEndOfDayStatusAction(attendancesByDate || null);
  }, [checkEndOfDayStatusAction, attendancesByDate]);

  const handleIncompleteAttendances = useCallback(
    async (
      attendances: AttendanceStatusDetail[],
      action: 'complete' | 'reschedule',
    ): Promise<boolean> => {
      try {
        await handleIncompletesMutation.mutateAsync({ attendances, action });
        return true;
      } catch (err) {
        console.error('Error handling incomplete attendances:', err);
        return false;
      }
    },
    [handleIncompletesMutation],
  );

  const handleAbsenceJustifications = useCallback(
    async (justifications: AbsenceJustification[]): Promise<boolean> => {
      try {
        await handleAbsencesMutation.mutateAsync(justifications);
        return true;
      } catch (err) {
        console.error('Error handling absence justifications:', err);
        return false;
      }
    },
    [handleAbsencesMutation],
  );

  return {
    dayFinalized,
    endOfDayStatus,
    checkEndOfDayStatus,
    handleIncompleteAttendances,
    handleAbsenceJustifications,
  };
}
