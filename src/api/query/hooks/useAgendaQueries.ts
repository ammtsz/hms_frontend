/**
 * Agenda React Query Hooks
 *
 * Server state management for agenda data using React Query.
 */

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAttendancesForAgenda,
  deleteAttendance,
  createAttendance,
} from "@/api/attendances";
import {
  AttendanceAgendaDto,
  AttendanceStatus,
  AttendanceType,
  CreateAttendanceRequest,
} from "@/api/types";
import { Agenda, CalendarAgenda, Priority } from "@/types/types";
import { transformAttendanceType } from "@/utils/apiTransformers";
import { isValidDateString } from "@/utils/timezoneDate";

// Transform backend data to frontend agenda format
const transformToAgenda = (
  attendances: AttendanceAgendaDto[],
): CalendarAgenda => {
  const assessment: Agenda["assessment"] = [];
  const physiotherapy: Agenda["physiotherapy"] = [];

  const grouped = attendances.reduce(
    (acc, attendance) => {
      const dateKey = attendance.scheduledDate;
      const type =
        attendance.type === AttendanceType.ASSESSMENT ? "assessment" : "physiotherapy";

      if (!acc[type]) acc[type] = {};
      if (!acc[type][dateKey]) acc[type][dateKey] = [];

      acc[type][dateKey].push({
        id: attendance.patientId.toString(),
        name: attendance.patientName,
        priority: attendance.patientPriority as Priority,
        attendanceId: attendance.id,
        type: attendance.type,
        status: attendance.status,
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
          attendanceId: number;
          type: AttendanceType;
          status: AttendanceStatus;
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
        attendanceId: p.attendanceId,
        attendanceType: transformAttendanceType(p.type),
        attendanceStatus: p.status,
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
        attendanceId: p.attendanceId,
        attendanceType: transformAttendanceType(p.type),
        attendanceStatus: p.status,
      })),
    });
  });

  return { assessment, physiotherapy };
};

import { agendaKeys, type AgendaApiFilters } from '@/api/query/keys/agendaKeys';

export type { AgendaApiFilters };

/**
 * Hook to fetch agenda attendances with optional filters
 */
export const useAgendaAttendances = (filters?: AgendaApiFilters) => {
  const hasDateRange = Boolean(filters?.fromDate || filters?.toDate);
  const datesValid =
    !hasDateRange ||
    (isValidDateString(filters?.fromDate ?? "") &&
      isValidDateString(filters?.toDate ?? ""));

  return useQuery({
    queryKey: agendaKeys.list(filters),
    queryFn: async (): Promise<AttendanceAgendaDto[]> => {
      const result = await getAttendancesForAgenda(
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
 * Hook to fetch transformed agenda data (calendar format)
 */
export const useAgenda = (filters?: AgendaApiFilters) => {
  const query = useAgendaAttendances(filters);

  return {
    ...query,
    data: query.data ? transformToAgenda(query.data) : undefined,
    agenda: query.data
      ? transformToAgenda(query.data)
      : { assessment: [], physiotherapy: [] },
  };
};

/**
 * Scheduled-only agenda (no date range) — for legacy callers.
 */
export const useScheduledAgenda = () => {
  return useAgenda({ statuses: [AttendanceStatus.SCHEDULED] });
};

/**
 * Mutation to remove patient from agenda
 */
export const useRemovePatientFromAgenda = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attendanceId: number) => {
      const result = await deleteAttendance(attendanceId.toString());
      if (result.success) {
        return result.value;
      } else {
        throw new Error(result.error || "Failed to remove patient from agenda");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.all });
    },
    onError: (error) => {
      console.error("Error removing patient from agenda:", error);
    },
  });
};

/**
 * Mutation to add patient to agenda
 */
export const useAddPatientToAgenda = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attendanceData: CreateAttendanceRequest) => {
      const result = await createAttendance(attendanceData);
      if (result.success) {
        return result.value;
      } else {
        throw new Error(result.error || "Failed to add patient to agenda");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.all });
    },
    onError: (error) => {
      console.error("Error adding patient to agenda:", error);
    },
  });
};

/**
 * Utility hook for manual agenda refresh
 */
export const useRefreshAgenda = () => {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: agendaKeys.all });
  }, [queryClient]);
};

/**
 * Hook that returns an imperative invalidation callback.
 * Use this instead of importing useQueryClient directly in feature hooks.
 */
export const useInvalidateAgenda = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: agendaKeys.all });
  }, [queryClient]);
};
