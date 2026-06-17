/**
 * useAttendanceQueries - React Query hooks for attendance server state
 * 
 * Manages all server state operations for attendance management including:
 * - Fetching attendances by date
 * - CRUD operations for attendances  
 * - End-of-day workflow operations
 * - Real-time synchronization with backend
 */

import { useCallback } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getAttendancesByDate,
  getAttendanceById,
  getNextAttendanceDate,
  updateAttendance,
  markAttendanceAsMissed,
  completeAttendance,
  createAttendance,
  deleteAttendance,
  postponeAttendance,
  bulkCancelAttendances,
  bulkPostponeAttendances,
  getNextRescheduleDates,
  getUnresolvedPastAttendances,
  rescheduleAttendances,
  getEligibleParentOptions,
  recomputeReturnForEpisode,
  type RecomputeReturnResult,
} from '@/api/attendances';
import {
  AttendanceByDate,
  AttendanceStatusDetail
} from '@/types/types';
import { AttendanceType } from '@/api/types';
import { AttendanceStatus as ApiAttendanceStatus } from '@/api/types';
import { transformAttendanceWithPatientByDate } from '@/utils/apiTransformers';
import { getTodayClinic, isValidDateString } from '@/utils/timezoneDate';
import { invalidateAttendanceTreatmentCaches } from '@/api/query/invalidation/invalidateAttendanceTreatmentCaches';
import { attendanceKeys } from '@/api/query/keys/attendanceKeys';

// Interfaces for mutations
interface CreateAttendanceParams {
  patientId: number;
  attendanceType: AttendanceType;
  scheduledDate?: string;
  scheduledTime?: string; // HH:mm format
  parentAttendanceId?: number; // Optional: Link to original consultation for follow-ups
  status?: ApiAttendanceStatus; // Optional: Initial status (defaults to scheduled)
}

export interface UpdateAttendanceParams {
  id: string;
  status?: ApiAttendanceStatus;
  absence_justified?: boolean;
  absence_notes?: string;
  parent_attendance_id?: number; // Optional: Link to original consultation
}

export interface CompleteAttendanceParams {
  id: string;
}

export interface CheckInAttendanceParams {
  attendanceId: number;
  patientName: string;
}

export interface MarkMissedParams {
  id: string;
  justified: boolean;
  notes?: string;
}

// End-of-day workflow interfaces
interface AbsenceJustification {
  attendanceId: number;
  patientName: string;
  justified: boolean;
  notes: string;
}

interface EndOfDayData {
  incompleteAttendances: AttendanceStatusDetail[];
  scheduledAbsences: AttendanceStatusDetail[];
  absenceJustifications: Array<{
    patientId: number;
    patientName: string;
    justified: boolean;
    notes: string;
  }>;
}

interface EndOfDayResult {
  type: "incomplete" | "scheduled_absences" | "completed";
  incompleteAttendances?: AttendanceStatusDetail[];
  scheduledAbsences?: AttendanceStatusDetail[];
  completionData?: {
    totalPatients: number;
    completedPatients: number;
    missedPatients: number;
    completionTime: Date;
  };
}

const attendanceDetailQueryFn = async (attendanceId: number) => {
  const result = await getAttendanceById(String(attendanceId));
  if (!result.success || !result.value) {
    throw new Error(
      result.error || "Falha ao carregar dados do atendimento selecionado.",
    );
  }
  return result.value;
};

/**
 * Fetch a single attendance by ID
 */
export function useAttendanceQuery(id: number | null) {
  return useQuery({
    queryKey: attendanceKeys.detail(id ?? 0),
    queryFn: () => attendanceDetailQueryFn(id!),
    enabled: id != null && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook that returns an imperative function for fetching the patient ID for a given
 * attendance ID on demand. Backed by React Query's cache so callers don't need to
 * import useQueryClient or QueryClient directly.
 */
export function useFetchAttendancePatientId() {
  const queryClient = useQueryClient();

  return useCallback(
    async (attendanceId: number): Promise<{ patientId: number }> => {
      const attendance = await queryClient.fetchQuery({
        queryKey: attendanceKeys.detail(attendanceId),
        queryFn: () => attendanceDetailQueryFn(attendanceId),
      });
      return { patientId: attendance.patientId };
    },
    [queryClient],
  );
}

/**
 * Fetch attendances by date with automatic caching and background refetch
 */
export function useAttendancesByDate(date: string) {
  return useQuery({
    queryKey: attendanceKeys.byDate(date),
    queryFn: async (): Promise<AttendanceByDate | null> => {
      try {
        const response = await getAttendancesByDate(date);
        if (!response.success) {
          throw new Error(response.error || "Failed to fetch attendances");
        }

        return transformAttendanceWithPatientByDate(
          response.value || [],
          date
        );
      } catch (error) {
        console.error("Error fetching attendances by date:", error);
        throw error;
      }
    },
    enabled: isValidDateString(date),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

/**
 * Get next available attendance date
 */
export function useNextAttendanceDate() {
  return useQuery({
    queryKey: attendanceKeys.nextDate(),
    queryFn: async (): Promise<string | null> => {
      try {
        const response = await getNextAttendanceDate();
        if (response.success && response.value?.nextDate) {
          return response.value.nextDate;
        }
        return getTodayClinic();
      } catch (error) {
        console.error("Error fetching next attendance date:", error);
        return getTodayClinic();
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Create new attendance
 */
export function useCreateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateAttendanceParams) => {
      const response = await createAttendance({
        patientId: params.patientId,
        type: params.attendanceType,
        scheduledDate: params.scheduledDate || getTodayClinic(),
        scheduledTime: params.scheduledTime || "09:00", // Use provided time or default
        parentAttendanceId: params.parentAttendanceId, // Optional parent link for follow-ups
        status: params.status, // Optional initial status
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to create attendance");
      }

      return response.value;
    },
    onSuccess: (_, variables) => {
      // Invalidate attendance queries for the scheduled date
      const targetDate = variables.scheduledDate || getTodayClinic();
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.byDate(targetDate)
      });

      // Also invalidate next date query
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.nextDate()
      });

      // Invalidate agenda queries so agenda page refreshes automatically
      queryClient.invalidateQueries({
        queryKey: ['agenda']
      });
    },
    onError: (error) => {
      console.error("Error creating attendance:", error);
    },
  });
}

/**
 * Update attendance (general update)
 */
export function useUpdateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateAttendanceParams) => {
      const response = await updateAttendance(params.id, {
        status: params.status,
        absenceJustified: params.absence_justified,
        absenceNotes: params.absence_notes,
        parentAttendanceId: params.parent_attendance_id, // Optional parent link
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to update attendance");
      }

      return response.value;
    },
    onSuccess: () => {
      // Invalidate all attendance queries as we don't know which date was affected
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.all
      });

      // Also invalidate agenda queries since attendance updates can affect agenda view
      queryClient.invalidateQueries({
        queryKey: ['agenda']
      });
    },
    onError: (error) => {
      console.error("Error updating attendance:", error);
    },
  });
}

/**
 * Complete attendance
 */
export function useCompleteAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CompleteAttendanceParams) => {
      const response = await completeAttendance(params.id);

      if (!response.success) {
        throw new Error(response.error || "Failed to complete attendance");
      }

      return response.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.all
      });
    },
    onError: (error) => {
      console.error("Error completing attendance:", error);
    },
  });
}

/**
 * Mark attendance as missed
 */
export function useMarkAttendanceAsMissed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: MarkMissedParams) => {
      const response = await markAttendanceAsMissed(
        params.id,
        params.justified,
        params.notes
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to mark attendance as missed");
      }

      return response.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.all
      });
    },
    onError: (error) => {
      console.error("Error marking attendance as missed:", error);
    },
  });
}

/**
 * Delete attendance
 */
export function useDeleteAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { attendanceId: number; cancellationReason?: string }) => {
      const response = await deleteAttendance(params.attendanceId.toString(), params.cancellationReason);

      if (!response.success) {
        throw new Error(response.error || "Failed to delete attendance");
      }

      return response.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.all
      });

      // Also invalidate agenda queries since deleting attendances affects agenda view
      queryClient.invalidateQueries({
        queryKey: ['agenda']
      });

      invalidateAttendanceTreatmentCaches(queryClient);
    },
    onError: (error) => {
      console.error("Error deleting attendance:", error);
    },
  });
}

/**
 * Postpone attendance to a specific date
 */
export function usePostponeAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { attendanceId: number; newDate: string }) => {
      const response = await postponeAttendance(params.attendanceId.toString(), params.newDate);

      if (!response.success) {
        throw new Error(response.error || "Failed to postpone attendance");
      }

      return response.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.all
      });

      // Also invalidate agenda queries since postponing affects agenda view
      queryClient.invalidateQueries({
        queryKey: ['agenda']
      });

      invalidateAttendanceTreatmentCaches(queryClient);
    },
    onError: (error) => {
      console.error("Error postponing attendance:", error);
    },
  });
}

/**
 * Check in attendance (alias for status update to checked_in)
 */
export function useCheckInAttendance() {
  const updateMutation = useUpdateAttendance();

  return useMutation({
    mutationFn: async (params: CheckInAttendanceParams) => {
      return updateMutation.mutateAsync({
        id: params.attendanceId.toString(),
        status: ApiAttendanceStatus.CHECKED_IN,
      });
    },
    onSuccess: () => {
      // Success handled by updateMutation
    },
    onError: (error) => {
      console.error("Error checking in attendance:", error);
    },
  });
}

/**
 * Refresh attendances for current date
 */
export function useRefreshAttendances() {
  const queryClient = useQueryClient();

  return (date?: string) => {
    if (date) {
      return queryClient.invalidateQueries({
        queryKey: attendanceKeys.byDate(date)
      });
    } else {
      return queryClient.invalidateQueries({
        queryKey: attendanceKeys.all
      });
    }
  };
}

/**
 * Handle incomplete attendances (batch operation)
 */
export function useHandleIncompleteAttendances() {
  const completeMutation = useCompleteAttendance();
  const updateMutation = useUpdateAttendance();

  return useMutation({
    mutationFn: async (params: {
      attendances: AttendanceStatusDetail[];
      action: "complete" | "reschedule";
    }) => {
      const promises = params.attendances.map(async (attendance) => {
        if (!attendance.attendanceId) return;

        if (params.action === "complete") {
          return completeMutation.mutateAsync({
            id: attendance.attendanceId.toString(),
          });
        } else if (params.action === "reschedule") {
          return updateMutation.mutateAsync({
            id: attendance.attendanceId.toString(),
            status: ApiAttendanceStatus.SCHEDULED,
          });
        }
      });

      await Promise.all(promises.filter(Boolean));
      return { success: true };
    },
    onError: (error) => {
      console.error("Error handling incomplete attendances:", error);
    },
  });
}

/**
 * Handle absence justifications (batch operation)
 */
export function useHandleAbsenceJustifications() {
  const updateMutation = useUpdateAttendance();
  const markMissedMutation = useMarkAttendanceAsMissed();

  return useMutation({
    mutationFn: async (justifications: AbsenceJustification[]) => {
      const promises = justifications.map(async (justification) => {
        if (justification.justified) {
          return updateMutation.mutateAsync({
            id: justification.attendanceId.toString(),
            absence_justified: true,
            absence_notes: justification.notes,
            status: ApiAttendanceStatus.MISSED,
          });
        } else {
          return markMissedMutation.mutateAsync({
            id: justification.attendanceId.toString(),
            justified: false,
            notes: justification.notes,
          });
        }
      });

      await Promise.all(promises);
      return { success: true };
    },
    onError: (error) => {
      console.error("Error handling absence justifications:", error);
    },
  });
}

/**
 * Bulk cancel multiple attendances
 */
export function useBulkCancelAttendances() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { attendanceIds: number[]; cancellationReason?: string }) => {
      const response = await bulkCancelAttendances(
        params.attendanceIds,
        params.cancellationReason,
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to cancel attendances");
      }

      return response.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.all
      });

      queryClient.invalidateQueries({
        queryKey: ['agenda']
      });
    },
    onError: (error) => {
      console.error("Error bulk cancelling attendances:", error);
    },
  });
}

/**
 * Bulk postpone (reschedule) multiple attendances to a specific date.
 */
export function useBulkPostponeAttendances() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      attendanceIds: number[];
      newDate: string;
      rescheduleReturnAssessment?: boolean;
    }) => {
      const response = await bulkPostponeAttendances(
        params.attendanceIds,
        params.newDate,
        {
          rescheduleReturnAssessment: params.rescheduleReturnAssessment,
        },
      );

      if (!response.success) {
        throw new Error(response.error || "Erro ao reagendar os atendimentos");
      }

      return response.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.all
      });

      queryClient.invalidateQueries({
        queryKey: ['agenda']
      });

      invalidateAttendanceTreatmentCaches(queryClient);
    },
    onError: (error) => {
      console.error("Error bulk postponing attendances:", error);
    },
  });
}

/**
 * Fetch next available reschedule date per attendance (same weekday), for manage-attendance modal preview.
 */
export function useNextAvailableDate(attendanceIds: number[] | null) {
  return useQuery({
    queryKey: attendanceKeys.nextAvailableDate(attendanceIds ?? []),
    queryFn: async () => {
      if (!attendanceIds?.length) return {};
      const response = await getNextRescheduleDates(attendanceIds);
      if (!response.success) throw new Error(response.error);
      return response.value ?? {};
    },
    enabled: Boolean(attendanceIds?.length),
  });
}

/**
 * Reschedule cancelled or missed attendances to a new date.
 * Creates new attendances with same params; for physiotherapy/tens copies linked treatment sessions.
 */
export function useRescheduleAttendances() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      attendanceIds: number[];
      newScheduledDate: string;
    }) => {
      const response = await rescheduleAttendances(
        params.attendanceIds,
        params.newScheduledDate,
      );
      if (!response.success) {
        throw new Error(response.error ?? 'Falha ao reagendar');
      }
      return response.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({ queryKey: ['attendances', 'patient'] });
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
      invalidateAttendanceTreatmentCaches(queryClient);
    },
    onError: (error) => {
      console.error('Error rescheduling attendances:', error);
    },
  });
}

/**
 * Recompute the return consultation date for the episode containing the given treatment attendance.
 * Use this once after all treatment postpones in next-available mode are committed, so the return
 * date is anchored to the real max session date across all consultation treatments.
 */
export function useRecomputeReturnForEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attendanceId: number): Promise<RecomputeReturnResult> => {
      const response = await recomputeReturnForEpisode(attendanceId);
      if (!response.success) {
        throw new Error(response.error ?? 'Falha ao recomputar data de retorno');
      }
      return response.value ?? { rescheduled: false };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
      invalidateAttendanceTreatmentCaches(queryClient);
    },
    onError: (error) => {
      console.error('Error recomputing return for episode:', error);
    },
  });
}

/**
 * Get unresolved past attendances (dates before today with incomplete/in-progress statuses)
 */
export function useUnresolvedPastAttendances() {
  return useQuery({
    queryKey: attendanceKeys.unresolvedPast(),
    queryFn: async () => {
      try {
        const response = await getUnresolvedPastAttendances();
        if (!response.success) {
          throw new Error(response.error || "Failed to fetch unresolved past attendances");
        }
        return response.value;
      } catch (error) {
        console.error("Error fetching unresolved past attendances:", error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter - user might resolve)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

/**
 * Query hook for fetching eligible parent attendance options for a patient.
 * Parent attendances are past consultations a new follow-up can link to.
 *
 * @param patientId Patient ID string, or null/undefined to skip the query.
 */
export function useEligibleParentOptions(patientId: string | null | undefined) {
  return useQuery({
    queryKey: attendanceKeys.eligibleParentOptions(patientId ?? ''),
    queryFn: async () => {
      if (!patientId) return { options: [] };
      const result = await getEligibleParentOptions(patientId);
      if (!result.success || !result.value) return { options: [] };
      return result.value;
    },
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Export types for convenience (interfaces already exported above)
export type {
  CreateAttendanceParams,
  AbsenceJustification,
  EndOfDayData,
  EndOfDayResult,
};