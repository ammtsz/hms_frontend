import { useCallback } from 'react';
import {
  useCheckInAttendance,
  useCompleteAttendance,
  useUpdateAttendance,
  useMarkAttendanceAsMissed,
} from '@/api/query/hooks/useAttendanceQueries';
import { AttendanceStatus as ApiAttendanceStatus } from '@/api/types';
import type { AttendanceProgression } from '@/types/types';

export type UpdateAttendanceStatusFn = (
  attendanceId: number,
  newStatus: AttendanceProgression | 'missed' | 'cancelled',
) => Promise<{ success: boolean; error?: string }>;

export function useDragDropStatusUpdater(): UpdateAttendanceStatusFn {
  const checkInMutation = useCheckInAttendance();
  const completeMutation = useCompleteAttendance();
  const updateMutation = useUpdateAttendance();
  const markMissedMutation = useMarkAttendanceAsMissed();

  return useCallback(
    async (
      attendanceId: number,
      newStatus: AttendanceProgression | 'missed' | 'cancelled',
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        switch (newStatus) {
          case 'checkedIn':
            await checkInMutation.mutateAsync({
              attendanceId,
              patientName: '',
            });
            break;
          case 'onGoing':
            await updateMutation.mutateAsync({
              id: attendanceId.toString(),
              status: ApiAttendanceStatus.IN_PROGRESS,
            });
            break;
          case 'completed':
            await completeMutation.mutateAsync({
              id: attendanceId.toString(),
            });
            break;
          case 'scheduled':
            await updateMutation.mutateAsync({
              id: attendanceId.toString(),
              status: ApiAttendanceStatus.SCHEDULED,
            });
            break;
          case 'cancelled':
            await updateMutation.mutateAsync({
              id: attendanceId.toString(),
              status: ApiAttendanceStatus.CANCELLED,
            });
            break;
          case 'missed':
            await markMissedMutation.mutateAsync({
              id: attendanceId.toString(),
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
            : 'Failed to update attendance status';
        return { success: false, error: errorMessage };
      }
    },
    [checkInMutation, completeMutation, updateMutation, markMissedMutation],
  );
}
