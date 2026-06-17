import { useQuery } from '@tanstack/react-query';
import { getSessionsByAttendance } from '@/api/sessions';
import { getTreatmentById } from '@/api/treatments';
import type { TreatmentResponseDto, SessionResponseDto } from '@/api/types';

/** One session row (`hms_session`) with its parent treatment plan (`hms_treatment`). */
export interface TreatmentPlanWithSessionRow {
  sessionRow: SessionResponseDto;
  treatment: TreatmentResponseDto;
}

/**
 * Fetches session rows for the given attendances and hydrates each with the parent treatment.
 *
 * @param attendanceIds - Attendance IDs (e.g. grouped card) to load session rows for
 */
export const useTreatmentsWithSessionRows = (attendanceIds: number[] | null) => {
  const query = useQuery({
    queryKey: ['treatmentsByAttendance', attendanceIds],
    queryFn: async () => {
      if (!attendanceIds || attendanceIds.length === 0) return [];

      const sessionFetchPromises = attendanceIds.map((id) => getSessionsByAttendance(id));
      const sessionFetchResults = await Promise.all(sessionFetchPromises);

      const allSessionRows: SessionResponseDto[] = [];
      sessionFetchResults.forEach((result) => {
        if (result.success && result.value) {
          allSessionRows.push(...result.value);
        }
      });

      if (allSessionRows.length === 0) {
        return [];
      }

      const treatmentIds = [...new Set(allSessionRows.map((row) => row.treatmentId))];

      const treatmentsPromises = treatmentIds.map((id) => getTreatmentById(String(id)));
      const treatmentsResults = await Promise.all(treatmentsPromises);

      const treatmentsMap = new Map<number, TreatmentResponseDto>();
      treatmentsResults.forEach((result) => {
        if (result.success && result.value) {
          treatmentsMap.set(result.value.id, result.value);
        }
      });

      const combinedData: TreatmentPlanWithSessionRow[] = [];
      allSessionRows.forEach((sessionRow) => {
        const treatment = treatmentsMap.get(sessionRow.treatmentId);
        if (treatment) {
          combinedData.push({ sessionRow, treatment });
        }
      });

      return combinedData;
    },
    enabled: !!attendanceIds && attendanceIds.length > 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  return {
    treatmentsWithSessionRows: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
};
