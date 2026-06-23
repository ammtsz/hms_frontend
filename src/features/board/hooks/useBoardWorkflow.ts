import { useState, useCallback, useEffect, useMemo } from "react";
import { useBoardState } from "@/features/board/hooks/useBoardState";
import {
  useCompleteAppointment,
  useUpdateAppointment
} from "@/api/query/hooks/useAppointmentQueries";
import { useDayFinalizationStatus } from "@/api/query/hooks/useDayFinalizationQueries";
import { AppointmentStatus as ApiAppointmentStatus } from "@/api/types";
import { getIncompleteAppointments, getDefaultCollapsedForDate } from "../utils/appointmentDataUtils";
import type { AppointmentType } from "@/types/types";

export const useBoardWorkflow = (
  options: { hasSlotsForDay?: boolean } = {},
) => {
  const { hasSlotsForDay = false } = options;
  const { appointmentsByDate, refreshCurrentDate, selectedDate } = useBoardState();
  const completeAppointmentMutation = useCompleteAppointment();
  const updateAppointmentMutation = useUpdateAppointment();

  // Fetch finalization status from database
  const { data: finalizationStatus, isLoading: isCheckingFinalization } =
    useDayFinalizationStatus(selectedDate);

  const isDayFinalized = finalizationStatus?.isFinalized ?? false;

  const defaultCollapsedForDate = useMemo(
    () => getDefaultCollapsedForDate(appointmentsByDate, hasSlotsForDay),
    [appointmentsByDate, hasSlotsForDay],
  );

  // Collapsed state for appointment sections; reset to default when date changes (first time per date)
  const [collapsed, setCollapsed] = useState<Record<AppointmentType, boolean>>(
    defaultCollapsedForDate,
  );

  useEffect(() => {
    setCollapsed(defaultCollapsedForDate);
  }, [selectedDate, defaultCollapsedForDate]);

  // Toggle collapsed state for appointment sections
  const toggleCollapsed = useCallback((type: AppointmentType) => {
    setCollapsed((prev) => ({ ...prev, [type]: !prev[type] }));
  }, []);

  // Handle appointment completion
  const handleAppointmentCompletion = useCallback(
    async (appointmentId: number) => {
      if (!appointmentsByDate) {
        console.error("No appointment data available");
        return;
      }

      // Find the appointment in incomplete appointments
      const incompleteAppointments = getIncompleteAppointments(appointmentsByDate);
      const appointment = incompleteAppointments.find(
        (att) => att.appointmentId === appointmentId
      );

      if (!appointment) {
        console.error("Appointment not found:", appointmentId);
        return;
      }

      // Use React Query mutation for completing appointment
      // Automatically handles cache invalidation
      try {
        await completeAppointmentMutation.mutateAsync({
          id: appointmentId.toString(),
        });
        // Refresh the data to show the updated status
        refreshCurrentDate();
      } catch (error) {
        console.error("Error completing appointment:", error);
        throw error;
      }
    },
    [appointmentsByDate, refreshCurrentDate, completeAppointmentMutation]
  );

  // Handle appointment rescheduling
  const handleAppointmentReschedule = useCallback(
    async (appointmentId: number) => {
      if (!appointmentsByDate) {
        console.error("No appointment data available");
        return;
      }

      // Find the appointment in incomplete appointments
      const incompleteAppointments = getIncompleteAppointments(appointmentsByDate);
      const appointment = incompleteAppointments.find(
        (att) => att.appointmentId === appointmentId
      );

      if (!appointment) {
        console.error("Appointment not found:", appointmentId);
        return;
      }

      // Use React Query mutation to move appointment back to scheduled
      // Automatically handles cache invalidation
      try {
        await updateAppointmentMutation.mutateAsync({
          id: appointmentId.toString(),
          status: ApiAppointmentStatus.SCHEDULED,
        });
        // Refresh the data to show the updated status
        refreshCurrentDate();
      } catch (error) {
        console.error("Error rescheduling appointment:", error);
        throw error;
      }
    },
    [appointmentsByDate, refreshCurrentDate, updateAppointmentMutation]
  );

  return {
    // State
    collapsed,
    isDayFinalized,
    isCheckingFinalization, // New: loading state for finalization check

    // Actions
    toggleCollapsed,
    handleAppointmentCompletion,
    handleAppointmentReschedule,
  };
};

export default useBoardWorkflow;
