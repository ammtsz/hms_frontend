/**
 * useAppointmentQueries - React Query hooks for appointment server state
 * 
 * Manages all server state operations for appointment management including:
 * - Fetching appointments by date
 * - CRUD operations for appointments  
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
  getAppointmentsByDate,
  getAppointmentById,
  getNextAppointmentDate,
  updateAppointment,
  markAppointmentAsMissed,
  completeAppointment,
  createAppointment,
  deleteAppointment,
  postponeAppointment,
  bulkCancelAppointments,
  bulkPostponeAppointments,
  getNextRescheduleDates,
  getUnresolvedPastAppointments,
  rescheduleAppointments,
  getEligibleParentOptions,
  recomputeReturnForEpisode,
  type RecomputeReturnResult,
} from '@/api/appointments';
import {
  AppointmentByDate,
  AppointmentStatusDetail
} from '@/types/types';
import { AppointmentType } from '@/api/types';
import { AppointmentStatus as ApiAppointmentStatus } from '@/api/types';
import { transformAppointmentWithPatientByDate } from '@/utils/apiTransformers';
import { getTodayClinic, isValidDateString } from '@/utils/timezoneDate';
import { invalidateAppointmentTreatmentCaches } from '@/api/query/invalidation/invalidateAppointmentTreatmentCaches';
import { appointmentKeys } from '@/api/query/keys/appointmentKeys';

// Interfaces for mutations
interface CreateAppointmentParams {
  patientId: number;
  appointmentType: AppointmentType;
  scheduledDate?: string;
  scheduledTime?: string; // HH:mm format
  parentAppointmentId?: number; // Optional: Link to original consultation for follow-ups
  status?: ApiAppointmentStatus; // Optional: Initial status (defaults to scheduled)
}

export interface UpdateAppointmentParams {
  id: string;
  status?: ApiAppointmentStatus;
  absence_justified?: boolean;
  absence_notes?: string;
  parent_appointment_id?: number; // Optional: Link to original consultation
}

export interface CompleteAppointmentParams {
  id: string;
}

export interface CheckInAppointmentParams {
  appointmentId: number;
  patientName: string;
}

export interface MarkMissedParams {
  id: string;
  justified: boolean;
  notes?: string;
}

// End-of-day workflow interfaces
interface AbsenceJustification {
  appointmentId: number;
  patientName: string;
  justified: boolean;
  notes: string;
}

interface EndOfDayData {
  incompleteAppointments: AppointmentStatusDetail[];
  scheduledAbsences: AppointmentStatusDetail[];
  absenceJustifications: Array<{
    patientId: number;
    patientName: string;
    justified: boolean;
    notes: string;
  }>;
}

interface EndOfDayResult {
  type: "incomplete" | "scheduled_absences" | "completed";
  incompleteAppointments?: AppointmentStatusDetail[];
  scheduledAbsences?: AppointmentStatusDetail[];
  completionData?: {
    totalPatients: number;
    completedPatients: number;
    missedPatients: number;
    completionTime: Date;
  };
}

const appointmentDetailQueryFn = async (appointmentId: number) => {
  const result = await getAppointmentById(String(appointmentId));
  if (!result.success || !result.value) {
    throw new Error(
      result.error || "Failed to load selected appointment data.",
    );
  }
  return result.value;
};

/**
 * Fetch a single appointment by ID
 */
export function useAppointmentQuery(id: number | null) {
  return useQuery({
    queryKey: appointmentKeys.detail(id ?? 0),
    queryFn: () => appointmentDetailQueryFn(id!),
    enabled: id != null && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook that returns an imperative function for fetching the patient ID for a given
 * appointment ID on demand. Backed by React Query's cache so callers don't need to
 * import useQueryClient or QueryClient directly.
 */
export function useFetchAppointmentPatientId() {
  const queryClient = useQueryClient();

  return useCallback(
    async (appointmentId: number): Promise<{ patientId: number }> => {
      const appointment = await queryClient.fetchQuery({
        queryKey: appointmentKeys.detail(appointmentId),
        queryFn: () => appointmentDetailQueryFn(appointmentId),
      });
      return { patientId: appointment.patientId };
    },
    [queryClient],
  );
}

/**
 * Fetch appointments by date with automatic caching and background refetch
 */
export function useAppointmentsByDate(date: string) {
  return useQuery({
    queryKey: appointmentKeys.byDate(date),
    queryFn: async (): Promise<AppointmentByDate | null> => {
      try {
        const response = await getAppointmentsByDate(date);
        if (!response.success) {
          throw new Error(response.error || "Failed to fetch appointments");
        }

        return transformAppointmentWithPatientByDate(
          response.value || [],
          date
        );
      } catch (error) {
        console.error("Error fetching appointments by date:", error);
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
 * Get next available appointment date
 */
export function useNextAppointmentDate() {
  return useQuery({
    queryKey: appointmentKeys.nextDate(),
    queryFn: async (): Promise<string | null> => {
      try {
        const response = await getNextAppointmentDate();
        if (response.success && response.value?.nextDate) {
          return response.value.nextDate;
        }
        return getTodayClinic();
      } catch (error) {
        console.error("Error fetching next appointment date:", error);
        return getTodayClinic();
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Create new appointment
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateAppointmentParams) => {
      const response = await createAppointment({
        patientId: params.patientId,
        type: params.appointmentType,
        scheduledDate: params.scheduledDate || getTodayClinic(),
        scheduledTime: params.scheduledTime || "09:00", // Use provided time or default
        parentAppointmentId: params.parentAppointmentId, // Optional parent link for follow-ups
        status: params.status, // Optional initial status
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to create appointment");
      }

      return response.value;
    },
    onSuccess: (_, variables) => {
      // Invalidate appointment queries for the scheduled date
      const targetDate = variables.scheduledDate || getTodayClinic();
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.byDate(targetDate)
      });

      // Also invalidate next date query
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.nextDate()
      });

      // Invalidate schedule queries so schedule page refreshes automatically
      queryClient.invalidateQueries({
        queryKey: ['schedule']
      });
    },
    onError: (error) => {
      console.error("Error creating appointment:", error);
    },
  });
}

/**
 * Update appointment (general update)
 */
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateAppointmentParams) => {
      const response = await updateAppointment(params.id, {
        status: params.status,
        absenceJustified: params.absence_justified,
        absenceNotes: params.absence_notes,
        parentAppointmentId: params.parent_appointment_id, // Optional parent link
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to update appointment");
      }

      return response.value;
    },
    onSuccess: () => {
      // Invalidate all appointment queries as we don't know which date was affected
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.all
      });

      // Also invalidate schedule queries since appointment updates can affect schedule view
      queryClient.invalidateQueries({
        queryKey: ['schedule']
      });
    },
    onError: (error) => {
      console.error("Error updating appointment:", error);
    },
  });
}

/**
 * Complete appointment
 */
export function useCompleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CompleteAppointmentParams) => {
      const response = await completeAppointment(params.id);

      if (!response.success) {
        throw new Error(response.error || "Failed to complete appointment");
      }

      return response.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.all
      });
    },
    onError: (error) => {
      console.error("Error completing appointment:", error);
    },
  });
}

/**
 * Mark appointment as missed
 */
export function useMarkAppointmentAsMissed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: MarkMissedParams) => {
      const response = await markAppointmentAsMissed(
        params.id,
        params.justified,
        params.notes
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to mark appointment as missed");
      }

      return response.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.all
      });
    },
    onError: (error) => {
      console.error("Error marking appointment as missed:", error);
    },
  });
}

/**
 * Delete appointment
 */
export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { appointmentId: number; cancellationReason?: string }) => {
      const response = await deleteAppointment(params.appointmentId.toString(), params.cancellationReason);

      if (!response.success) {
        throw new Error(response.error || "Failed to delete appointment");
      }

      return response.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.all
      });

      // Also invalidate schedule queries since deleting appointments affects schedule view
      queryClient.invalidateQueries({
        queryKey: ['schedule']
      });

      invalidateAppointmentTreatmentCaches(queryClient);
    },
    onError: (error) => {
      console.error("Error deleting appointment:", error);
    },
  });
}

/**
 * Postpone appointment to a specific date
 */
export function usePostponeAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { appointmentId: number; newDate: string }) => {
      const response = await postponeAppointment(params.appointmentId.toString(), params.newDate);

      if (!response.success) {
        throw new Error(response.error || "Failed to postpone appointment");
      }

      return response.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.all
      });

      // Also invalidate schedule queries since postponing affects schedule view
      queryClient.invalidateQueries({
        queryKey: ['schedule']
      });

      invalidateAppointmentTreatmentCaches(queryClient);
    },
    onError: (error) => {
      console.error("Error postponing appointment:", error);
    },
  });
}

/**
 * Check in appointment (alias for status update to checked_in)
 */
export function useCheckInAppointment() {
  const updateMutation = useUpdateAppointment();

  return useMutation({
    mutationFn: async (params: CheckInAppointmentParams) => {
      return updateMutation.mutateAsync({
        id: params.appointmentId.toString(),
        status: ApiAppointmentStatus.CHECKED_IN,
      });
    },
    onSuccess: () => {
      // Success handled by updateMutation
    },
    onError: (error) => {
      console.error("Error checking in appointment:", error);
    },
  });
}

/**
 * Refresh appointments for current date
 */
export function useRefreshAppointments() {
  const queryClient = useQueryClient();

  return (date?: string) => {
    if (date) {
      return queryClient.invalidateQueries({
        queryKey: appointmentKeys.byDate(date)
      });
    } else {
      return queryClient.invalidateQueries({
        queryKey: appointmentKeys.all
      });
    }
  };
}

/**
 * Handle incomplete appointments (batch operation)
 */
export function useHandleIncompleteAppointments() {
  const completeMutation = useCompleteAppointment();
  const updateMutation = useUpdateAppointment();

  return useMutation({
    mutationFn: async (params: {
      appointments: AppointmentStatusDetail[];
      action: "complete" | "reschedule";
    }) => {
      const promises = params.appointments.map(async (appointment) => {
        if (!appointment.appointmentId) return;

        if (params.action === "complete") {
          return completeMutation.mutateAsync({
            id: appointment.appointmentId.toString(),
          });
        } else if (params.action === "reschedule") {
          return updateMutation.mutateAsync({
            id: appointment.appointmentId.toString(),
            status: ApiAppointmentStatus.SCHEDULED,
          });
        }
      });

      await Promise.all(promises.filter(Boolean));
      return { success: true };
    },
    onError: (error) => {
      console.error("Error handling incomplete appointments:", error);
    },
  });
}

/**
 * Handle absence justifications (batch operation)
 */
export function useHandleAbsenceJustifications() {
  const updateMutation = useUpdateAppointment();
  const markMissedMutation = useMarkAppointmentAsMissed();

  return useMutation({
    mutationFn: async (justifications: AbsenceJustification[]) => {
      const promises = justifications.map(async (justification) => {
        if (justification.justified) {
          return updateMutation.mutateAsync({
            id: justification.appointmentId.toString(),
            absence_justified: true,
            absence_notes: justification.notes,
            status: ApiAppointmentStatus.MISSED,
          });
        } else {
          return markMissedMutation.mutateAsync({
            id: justification.appointmentId.toString(),
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
 * Bulk cancel multiple appointments
 */
export function useBulkCancelAppointments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { appointmentIds: number[]; cancellationReason?: string }) => {
      const response = await bulkCancelAppointments(
        params.appointmentIds,
        params.cancellationReason,
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to cancel appointments");
      }

      return response.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.all
      });

      queryClient.invalidateQueries({
        queryKey: ['schedule']
      });
    },
    onError: (error) => {
      console.error("Error bulk cancelling appointments:", error);
    },
  });
}

/**
 * Bulk postpone (reschedule) multiple appointments to a specific date.
 */
export function useBulkPostponeAppointments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      appointmentIds: number[];
      newDate: string;
      rescheduleReturnAssessment?: boolean;
    }) => {
      const response = await bulkPostponeAppointments(
        params.appointmentIds,
        params.newDate,
        {
          rescheduleReturnAssessment: params.rescheduleReturnAssessment,
        },
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to reschedule appointments");
      }

      return response.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.all
      });

      queryClient.invalidateQueries({
        queryKey: ['schedule']
      });

      invalidateAppointmentTreatmentCaches(queryClient);
    },
    onError: (error) => {
      console.error("Error bulk postponing appointments:", error);
    },
  });
}

/**
 * Fetch next available reschedule date per appointment (same weekday), for manage-appointment modal preview.
 */
export function useNextAvailableDate(appointmentIds: number[] | null) {
  return useQuery({
    queryKey: appointmentKeys.nextAvailableDate(appointmentIds ?? []),
    queryFn: async () => {
      if (!appointmentIds?.length) return {};
      const response = await getNextRescheduleDates(appointmentIds);
      if (!response.success) throw new Error(response.error);
      return response.value ?? {};
    },
    enabled: Boolean(appointmentIds?.length),
  });
}

/**
 * Reschedule cancelled or missed appointments to a new date.
 * Creates new appointments with same params; for physiotherapy/tens copies linked treatment sessions.
 */
export function useRescheduleAppointments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      appointmentIds: number[];
      newScheduledDate: string;
    }) => {
      const response = await rescheduleAppointments(
        params.appointmentIds,
        params.newScheduledDate,
      );
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to reschedule');
      }
      return response.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'patient'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      invalidateAppointmentTreatmentCaches(queryClient);
    },
    onError: (error) => {
      console.error('Error rescheduling appointments:', error);
    },
  });
}

/**
 * Recompute the return consultation date for the episode containing the given treatment appointment.
 * Use this once after all treatment postpones in next-available mode are committed, so the return
 * date is anchored to the real max session date across all consultation treatments.
 */
export function useRecomputeReturnForEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: number): Promise<RecomputeReturnResult> => {
      const response = await recomputeReturnForEpisode(appointmentId);
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to recompute return date');
      }
      return response.value ?? { rescheduled: false };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      invalidateAppointmentTreatmentCaches(queryClient);
    },
    onError: (error) => {
      console.error('Error recomputing return for episode:', error);
    },
  });
}

/**
 * Get unresolved past appointments (dates before today with incomplete/in-progress statuses)
 */
export function useUnresolvedPastAppointments() {
  return useQuery({
    queryKey: appointmentKeys.unresolvedPast(),
    queryFn: async () => {
      try {
        const response = await getUnresolvedPastAppointments();
        if (!response.success) {
          throw new Error(response.error || "Failed to fetch unresolved past appointments");
        }
        return response.value;
      } catch (error) {
        console.error("Error fetching unresolved past appointments:", error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter - user might resolve)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

/**
 * Query hook for fetching eligible parent appointment options for a patient.
 * Parent appointments are past consultations a new follow-up can link to.
 *
 * @param patientId Patient ID string, or null/undefined to skip the query.
 */
export function useEligibleParentOptions(patientId: string | null | undefined) {
  return useQuery({
    queryKey: appointmentKeys.eligibleParentOptions(patientId ?? ''),
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
  CreateAppointmentParams,
  AbsenceJustification,
  EndOfDayData,
  EndOfDayResult,
};