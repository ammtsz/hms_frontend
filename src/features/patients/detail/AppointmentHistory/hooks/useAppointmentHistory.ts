import { useMemo, useState, useCallback } from "react";
import { Patient } from "@/types/types";
import { usePatientAppointments } from "@/api/query/hooks/usePatientQueries";
import { useTreatmentsByPatient } from "@/api/query/hooks/useTreatmentsQueries";
import { useConsultations } from "@/api/query/hooks/useConsultationQueries";
import { transformAppointmentToPrevious } from "@/utils/apiTransformers";
import { groupHistoryAppointmentsByDate } from "@/utils/appointmentHistoryUtils";

export type StatusFilter = "all" | "completed" | "missed" | "cancelled";

interface UseAppointmentHistoryParams {
  patient: Patient;
  statusFilter: StatusFilter;
}

/**
 * Custom hook for managing appointment history data and operations
 * Handles data fetching, filtering, transformation, and grouping
 */
export const useAppointmentHistory = ({
  patient,
  statusFilter,
}: UseAppointmentHistoryParams) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch appointments data
  const {
    data: appointmentsData,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    refetch: refetchAppointments,
  } = usePatientAppointments(patient.id);

  // Treatment plans for this patient (`GET /treatments/patient/:id`)
  const {
    treatments,
    loading: treatmentsLoading,
    error: treatmentsError,
    refetch: refetchTreatments,
  } = useTreatmentsByPatient(parseInt(patient.id));

  // Consultations list (assessment recommendations on history)
  const { data: consultations = [] } = useConsultations();

  // Transform and filter appointment data
  const enhancedPreviousAppointments = useMemo(() => {
    if (!appointmentsData) return patient.previousAppointments;
    // Transform all appointments and apply user status filter
    const allAppointments = appointmentsData
      .filter((appointment) => {
        // Apply status filter (groupHistoryAppointmentsByDate will handle date/status filtering)
        if (statusFilter === "completed")
          return appointment.status === "completed";
        if (statusFilter === "missed") return appointment.status === "missed";
        if (statusFilter === "cancelled")
          return appointment.status === "cancelled";

        return true; // 'all' - show all statuses
      })
      .sort(
        (a, b) =>
          new Date(b.scheduledDate + "T00:00:00").getTime() -
          new Date(a.scheduledDate + "T00:00:00").getTime(),
      )
      .map(transformAppointmentToPrevious);

    return allAppointments;
  }, [appointmentsData, patient.previousAppointments, statusFilter]);

  // Group appointments with treatment plans + consultations
  const groupedAppointments = useMemo(() => {
    return groupHistoryAppointmentsByDate(
      enhancedPreviousAppointments,
      treatments,
      consultations,
    );
  }, [enhancedPreviousAppointments, treatments, consultations]);

  // Handle refresh with visual feedback
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refetchAppointments();
    refetchTreatments();
    // Reset animation after it completes
    setTimeout(() => setIsRefreshing(false), 200);
  }, [refetchAppointments, refetchTreatments]);

  const loading = appointmentsLoading || treatmentsLoading;
  const error = appointmentsError?.message || treatmentsError || null;

  return {
    groupedAppointments,
    treatments,
    consultations,
    loading,
    error,
    isRefreshing,
    handleRefresh,
    refetchAppointments,
    refetchTreatments,
  };
};
