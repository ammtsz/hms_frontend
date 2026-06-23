import { useCallback } from 'react';
import {
  useCheckInAppointment,
  useCompleteAppointment,
  useUpdateAppointment,
  useMarkAppointmentAsMissed,
} from '@/api/query/hooks/useAppointmentQueries';
import { AppointmentStatus as ApiAppointmentStatus } from '@/api/types';
import type { AppointmentProgression } from '@/types/types';

export type UpdateAppointmentStatusFn = (
  appointmentId: number,
  newStatus: AppointmentProgression | 'missed' | 'cancelled',
) => Promise<{ success: boolean; error?: string }>;

export function useDragDropStatusUpdater(): UpdateAppointmentStatusFn {
  const checkInMutation = useCheckInAppointment();
  const completeMutation = useCompleteAppointment();
  const updateMutation = useUpdateAppointment();
  const markMissedMutation = useMarkAppointmentAsMissed();

  return useCallback(
    async (
      appointmentId: number,
      newStatus: AppointmentProgression | 'missed' | 'cancelled',
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        switch (newStatus) {
          case 'checkedIn':
            await checkInMutation.mutateAsync({
              appointmentId,
              patientName: '',
            });
            break;
          case 'onGoing':
            await updateMutation.mutateAsync({
              id: appointmentId.toString(),
              status: ApiAppointmentStatus.IN_PROGRESS,
            });
            break;
          case 'completed':
            await completeMutation.mutateAsync({
              id: appointmentId.toString(),
            });
            break;
          case 'scheduled':
            await updateMutation.mutateAsync({
              id: appointmentId.toString(),
              status: ApiAppointmentStatus.SCHEDULED,
            });
            break;
          case 'cancelled':
            await updateMutation.mutateAsync({
              id: appointmentId.toString(),
              status: ApiAppointmentStatus.CANCELLED,
            });
            break;
          case 'missed':
            await markMissedMutation.mutateAsync({
              id: appointmentId.toString(),
              justified: false,
              notes: '',
            });
            break;
          default:
            return { success: false, error: 'Invalid status' };
        }
        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to update appointment status';
        return { success: false, error: errorMessage };
      }
    },
    [checkInMutation, completeMutation, updateMutation, markMissedMutation],
  );
}
