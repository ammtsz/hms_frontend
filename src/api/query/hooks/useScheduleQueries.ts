/**
 * Schedule React Query Hooks
 *
 * Server state management for schedule data using React Query.
 */

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAppointmentsForSchedule,
  deleteAppointment,
  createAppointment,
} from "@/api/appointments";
import {
  AppointmentScheduleDto,
  AppointmentStatus,
  AppointmentType,
  CreateAppointmentRequest,
} from "@/api/types";
import { Schedule, CalendarSchedule, Priority } from "@/types/types";
import { transformAppointmentType } from "@/utils/apiTransformers";
import { isValidDateString } from "@/utils/timezoneDate";

// Transform backend data to frontend schedule format
const transformToSchedule = (
  appointments: AppointmentScheduleDto[],
): CalendarSchedule => {
  const assessment: Schedule["assessment"] = [];
  const physiotherapy: Schedule["physiotherapy"] = [];

  const grouped = appointments.reduce(
    (acc, appointment) => {
      const dateKey = appointment.scheduledDate;
      const type =
        appointment.type === AppointmentType.ASSESSMENT ? "assessment" : "physiotherapy";

      if (!acc[type]) acc[type] = {};
      if (!acc[type][dateKey]) acc[type][dateKey] = [];

      acc[type][dateKey].push({
        id: appointment.patientId.toString(),
        name: appointment.patientName,
        priority: appointment.patientPriority as Priority,
        appointmentId: appointment.id,
        type: appointment.type,
        status: appointment.status,
      });
      return acc;
    },
    {} as Record<
      string,
      Record<
        string,
        Array<{
          id: string;
          name: string;
          priority: Priority;
          appointmentId: number;
          type: AppointmentType;
          status: AppointmentStatus;
        }>
      >
    >,
  );

  Object.entries(grouped.assessment || {}).forEach(([date, patients]) => {
    assessment.push({
      date,
      patients: patients.map((p) => ({
        id: p.id,
        name: p.name,
        priority: p.priority,
        appointmentId: p.appointmentId,
        appointmentType: transformAppointmentType(p.type),
        appointmentStatus: p.status,
      })),
    });
  });

  Object.entries(grouped.physiotherapy || {}).forEach(([date, patients]) => {
    physiotherapy.push({
      date,
      patients: patients.map((p) => ({
        id: p.id,
        name: p.name,
        priority: p.priority,
        appointmentId: p.appointmentId,
        appointmentType: transformAppointmentType(p.type),
        appointmentStatus: p.status,
      })),
    });
  });

  return { assessment, physiotherapy };
};

import { scheduleKeys, type ScheduleApiFilters } from '@/api/query/keys/scheduleKeys';

export type { ScheduleApiFilters };

/**
 * Hook to fetch schedule appointments with optional filters
 */
export const useScheduleAppointments = (filters?: ScheduleApiFilters) => {
  const hasDateRange = Boolean(filters?.fromDate || filters?.toDate);
  const datesValid =
    !hasDateRange ||
    (isValidDateString(filters?.fromDate ?? "") &&
      isValidDateString(filters?.toDate ?? ""));

  return useQuery({
    queryKey: scheduleKeys.list(filters),
    queryFn: async (): Promise<AppointmentScheduleDto[]> => {
      const result = await getAppointmentsForSchedule(
        filters
          ? {
              statuses: filters.statuses,
              fromDate: filters.fromDate,
              toDate: filters.toDate,
              type: filters.type,
              limit: filters.limit,
            }
          : undefined,
      );
      if (result.success && result.value) {
        return result.value;
      } else {
        throw new Error(result.error || "Failed to load schedule");
      }
    },
    enabled: datesValid,
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
};

/**
 * Hook to fetch transformed schedule data (calendar format)
 */
export const useSchedule = (filters?: ScheduleApiFilters) => {
  const query = useScheduleAppointments(filters);

  return {
    ...query,
    data: query.data ? transformToSchedule(query.data) : undefined,
    schedule: query.data
      ? transformToSchedule(query.data)
      : { assessment: [], physiotherapy: [] },
  };
};

/**
 * Scheduled-only schedule (no date range) — for legacy callers.
 */
export const useScheduled = () => {
  return useSchedule({ statuses: [AppointmentStatus.SCHEDULED] });
};

/**
 * Mutation to remove patient from schedule
 */
export const useRemovePatientFromSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: number) => {
      const result = await deleteAppointment(appointmentId.toString());
      if (result.success) {
        return result.value;
      } else {
        throw new Error(result.error || "Failed to remove patient from schedule");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
    onError: (error) => {
      console.error("Error removing patient from schedule:", error);
    },
  });
};

/**
 * Mutation to add patient to schedule
 */
export const useAddPatientToSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentData: CreateAppointmentRequest) => {
      const result = await createAppointment(appointmentData);
      if (result.success) {
        return result.value;
      } else {
        throw new Error(result.error || "Failed to add patient to schedule");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
    onError: (error) => {
      console.error("Error adding patient to schedule:", error);
    },
  });
};

/**
 * Utility hook for manual schedule refresh
 */
export const useRefreshSchedule = () => {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
  }, [queryClient]);
};

/**
 * Hook that returns an imperative invalidation callback.
 * Use this instead of importing useQueryClient directly in feature hooks.
 */
export const useInvalidateSchedule = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
  }, [queryClient]);
};
