import { useState, useCallback, useEffect, useMemo } from "react";
import { useAttendanceBoardState } from "@/features/attendance/hooks/useAttendanceBoardState";
import {
  useCompleteAttendance,
  useUpdateAttendance
} from "@/api/query/hooks/useAttendanceQueries";
import { useDayFinalizationStatus } from "@/api/query/hooks/useDayFinalizationQueries";
import { AttendanceStatus as ApiAttendanceStatus } from "@/api/types";
import { getIncompleteAttendances, getDefaultCollapsedForDate } from "../utils/attendanceDataUtils";
import type { AttendanceType } from "@/types/types";

export const useAttendanceWorkflow = (
  options: { hasSlotsForDay?: boolean } = {},
) => {
  const { hasSlotsForDay = false } = options;
  const { attendancesByDate, refreshCurrentDate, selectedDate } = useAttendanceBoardState();
  const completeAttendanceMutation = useCompleteAttendance();
  const updateAttendanceMutation = useUpdateAttendance();

  // Fetch finalization status from database
  const { data: finalizationStatus, isLoading: isCheckingFinalization } =
    useDayFinalizationStatus(selectedDate);

  const isDayFinalized = finalizationStatus?.isFinalized ?? false;

  const defaultCollapsedForDate = useMemo(
    () => getDefaultCollapsedForDate(attendancesByDate, hasSlotsForDay),
    [attendancesByDate, hasSlotsForDay],
  );

  // Collapsed state for attendance sections; reset to default when date changes (first time per date)
  const [collapsed, setCollapsed] = useState<Record<AttendanceType, boolean>>(
    defaultCollapsedForDate,
  );

  useEffect(() => {
    setCollapsed(defaultCollapsedForDate);
  }, [selectedDate, defaultCollapsedForDate]);

  // Toggle collapsed state for attendance sections
  const toggleCollapsed = useCallback((type: AttendanceType) => {
    setCollapsed((prev) => ({ ...prev, [type]: !prev[type] }));
  }, []);

  // Handle attendance completion
  const handleAttendanceCompletion = useCallback(
    async (attendanceId: number) => {
      if (!attendancesByDate) {
        console.error("No attendance data available");
        return;
      }

      // Find the attendance in incomplete attendances
      const incompleteAttendances = getIncompleteAttendances(attendancesByDate);
      const attendance = incompleteAttendances.find(
        (att) => att.attendanceId === attendanceId
      );

      if (!attendance) {
        console.error("Attendance not found:", attendanceId);
        return;
      }

      // Use React Query mutation for completing attendance
      // Automatically handles cache invalidation
      try {
        await completeAttendanceMutation.mutateAsync({
          id: attendanceId.toString(),
        });
        // Refresh the data to show the updated status
        refreshCurrentDate();
      } catch (error) {
        console.error("Error completing attendance:", error);
        throw error;
      }
    },
    [attendancesByDate, refreshCurrentDate, completeAttendanceMutation]
  );

  // Handle attendance rescheduling
  const handleAttendanceReschedule = useCallback(
    async (attendanceId: number) => {
      if (!attendancesByDate) {
        console.error("No attendance data available");
        return;
      }

      // Find the attendance in incomplete attendances
      const incompleteAttendances = getIncompleteAttendances(attendancesByDate);
      const attendance = incompleteAttendances.find(
        (att) => att.attendanceId === attendanceId
      );

      if (!attendance) {
        console.error("Attendance not found:", attendanceId);
        return;
      }

      // Use React Query mutation to move attendance back to scheduled
      // Automatically handles cache invalidation
      try {
        await updateAttendanceMutation.mutateAsync({
          id: attendanceId.toString(),
          status: ApiAttendanceStatus.SCHEDULED,
        });
        // Refresh the data to show the updated status
        refreshCurrentDate();
      } catch (error) {
        console.error("Error rescheduling attendance:", error);
        throw error;
      }
    },
    [attendancesByDate, refreshCurrentDate, updateAttendanceMutation]
  );

  return {
    // State
    collapsed,
    isDayFinalized,
    isCheckingFinalization, // New: loading state for finalization check

    // Actions
    toggleCollapsed,
    handleAttendanceCompletion,
    handleAttendanceReschedule,
  };
};

export default useAttendanceWorkflow;
