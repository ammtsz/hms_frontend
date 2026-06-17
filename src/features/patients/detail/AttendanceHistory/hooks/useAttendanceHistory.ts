import { useMemo, useState, useCallback } from "react";
import { Patient } from "@/types/types";
import { usePatientAttendances } from "@/api/query/hooks/usePatientQueries";
import { useTreatmentsByPatient } from "@/api/query/hooks/useTreatmentsQueries";
import { useConsultations } from "@/api/query/hooks/useConsultationQueries";
import { transformAttendanceToPrevious } from "@/utils/apiTransformers";
import { groupHistoryAttendancesByDate } from "@/utils/attendanceHistoryUtils";

export type StatusFilter = "all" | "completed" | "missed" | "cancelled";

interface UseAttendanceHistoryParams {
  patient: Patient;
  statusFilter: StatusFilter;
}

/**
 * Custom hook for managing attendance history data and operations
 * Handles data fetching, filtering, transformation, and grouping
 */
export const useAttendanceHistory = ({
  patient,
  statusFilter,
}: UseAttendanceHistoryParams) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch attendances data
  const {
    data: attendancesData,
    isLoading: attendancesLoading,
    error: attendancesError,
    refetch: refetchAttendances,
  } = usePatientAttendances(patient.id);

  // Treatment plans for this patient (`GET /treatments/patient/:id`)
  const {
    treatments,
    loading: treatmentsLoading,
    error: treatmentsError,
    refetch: refetchTreatments,
  } = useTreatmentsByPatient(parseInt(patient.id));

  // Consultations list (assessment recommendations on history)
  const { data: consultations = [] } = useConsultations();

  // Transform and filter attendance data
  const enhancedPreviousAttendances = useMemo(() => {
    if (!attendancesData) return patient.previousAttendances;
    // Transform all attendances and apply user status filter
    const allAttendances = attendancesData
      .filter((attendance) => {
        // Apply status filter (groupHistoryAttendancesByDate will handle date/status filtering)
        if (statusFilter === "completed")
          return attendance.status === "completed";
        if (statusFilter === "missed") return attendance.status === "missed";
        if (statusFilter === "cancelled")
          return attendance.status === "cancelled";

        return true; // 'all' - show all statuses
      })
      .sort(
        (a, b) =>
          new Date(b.scheduledDate + "T00:00:00").getTime() -
          new Date(a.scheduledDate + "T00:00:00").getTime(),
      )
      .map(transformAttendanceToPrevious);

    return allAttendances;
  }, [attendancesData, patient.previousAttendances, statusFilter]);

  // Group attendances with treatment plans + consultations
  const groupedAttendances = useMemo(() => {
    return groupHistoryAttendancesByDate(
      enhancedPreviousAttendances,
      treatments,
      consultations,
    );
  }, [enhancedPreviousAttendances, treatments, consultations]);

  // Handle refresh with visual feedback
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refetchAttendances();
    refetchTreatments();
    // Reset animation after it completes
    setTimeout(() => setIsRefreshing(false), 200);
  }, [refetchAttendances, refetchTreatments]);

  const loading = attendancesLoading || treatmentsLoading;
  const error = attendancesError?.message || treatmentsError || null;

  return {
    groupedAttendances,
    treatments,
    consultations,
    loading,
    error,
    isRefreshing,
    handleRefresh,
    refetchAttendances,
    refetchTreatments,
  };
};
