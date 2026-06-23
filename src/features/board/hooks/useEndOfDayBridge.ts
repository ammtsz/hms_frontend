import { useCallback } from 'react';
import {
  useHandleIncompleteAppointments,
  useHandleAbsenceJustifications,
} from '@/api/query/hooks/useAppointmentQueries';
import {
  useCheckEndOfDayStatus,
  useDayFinalized,
  useEndOfDayStatus,
} from '@/stores';
import type { AppointmentByDate, AppointmentStatusDetail } from '@/types/types';
import type { AbsenceJustification, EndOfDayResult } from './boardTypes';

export interface UseEndOfDayBridgeReturn {
  dayFinalized: boolean;
  endOfDayStatus: EndOfDayResult | null;
  checkEndOfDayStatus: () => EndOfDayResult;
  handleIncompleteAppointments: (
    appointments: AppointmentStatusDetail[],
    action: 'complete' | 'reschedule',
  ) => Promise<boolean>;
  handleAbsenceJustifications: (
    justifications: AbsenceJustification[],
  ) => Promise<boolean>;
}

export function useEndOfDayBridge(
  appointmentsByDate: AppointmentByDate | null,
): UseEndOfDayBridgeReturn {
  const dayFinalized = useDayFinalized();
  const endOfDayStatus = useEndOfDayStatus();
  const checkEndOfDayStatusAction = useCheckEndOfDayStatus();

  const handleIncompletesMutation = useHandleIncompleteAppointments();
  const handleAbsencesMutation = useHandleAbsenceJustifications();

  const checkEndOfDayStatus = useCallback((): EndOfDayResult => {
    return checkEndOfDayStatusAction(appointmentsByDate || null);
  }, [checkEndOfDayStatusAction, appointmentsByDate]);

  const handleIncompleteAppointments = useCallback(
    async (
      appointments: AppointmentStatusDetail[],
      action: 'complete' | 'reschedule',
    ): Promise<boolean> => {
      try {
        await handleIncompletesMutation.mutateAsync({ appointments, action });
        return true;
      } catch (err) {
        console.error('Error handling incomplete appointments:', err);
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
    handleIncompleteAppointments,
    handleAbsenceJustifications,
  };
}
