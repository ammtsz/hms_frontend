/**
 * Schedule React Query Hooks
 *
 * Server state management for schedule data using React Query.
 */

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAttendancesForSchedule,
  deleteAttendance,
  createAttendance,
} from "@/api/attendances";
import {
  AttendanceScheduleDto,
  AttendanceStatus,
  AttendanceType,
  CreateAttendanceRequest,
} from "@/api/types";
import { Schedule, CalendarSchedule, Priority } from "@/types/types";
import { transformAttendanceType } from "@/utils/apiTransformers";
import { isValidDateString } from "@/utils/timezoneDate";

// Transform backend data to frontend schedule format
const transformToSchedule = (
  attendances: AttendanceScheduleDto[],
): CalendarSchedule => {
  const assessment: Schedule["assessment"] = [];
  const physiotherapy: Schedule["physiotherapy"] = [];

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

import { scheduleKeys, type ScheduleApiFilters } from '@/api/query/keys/scheduleKeys';

export type { ScheduleApiFilters };

/**
 * Hook to fetch schedule attendances with optional filters
 */
export const useScheduleAttendances = (filters?: ScheduleApiFilters) => {
  const hasDateRange = Boolean(filters?.fromDate || filters?.toDate);
  const datesValid =
    !hasDateRange ||
    (isValidDateString(filters?.fromDate ?? "") &&
      isValidDateString(filters?.toDate ?? ""));

  return useQuery({
    queryKey: scheduleKeys.list(filters),
    queryFn: async (): Promise<AttendanceScheduleDto[]> => {
      const result = await getAttendancesForSchedule(
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
  const query = useScheduleAttendances(filters);

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
  return useSchedule({ statuses: [AttendanceStatus.SCHEDULED] });
};

/**
 * Mutation to remove patient from schedule
 */
export const useRemovePatientFromSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attendanceId: number) => {
      const result = await deleteAttendance(attendanceId.toString());
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
    mutationFn: async (attendanceData: CreateAttendanceRequest) => {
      const result = await createAttendance(attendanceData);
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
