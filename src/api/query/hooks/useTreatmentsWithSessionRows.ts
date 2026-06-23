import { useQuery } from '@tanstack/react-query';
import { getSessionsByAppointment } from '@/api/sessions';
import { getTreatmentById } from '@/api/treatments';
import type { TreatmentResponseDto, SessionResponseDto } from '@/api/types';

/** One session row (`hms_session`) with its parent treatment plan (`hms_treatment`). */
export interface TreatmentPlanWithSessionRow {
  sessionRow: SessionResponseDto;
  treatment: TreatmentResponseDto;
}

/**
 * Fetches session rows for the given appointments and hydrates each with the parent treatment.
 *
 * @param appointmentIds - Appointment IDs (e.g. grouped card) to load session rows for
 */
export const useTreatmentsWithSessionRows = (appointmentIds: number[] | null) => {
  const query = useQuery({
    queryKey: ['treatmentsByAppointment', appointmentIds],
    queryFn: async () => {
      if (!appointmentIds || appointmentIds.length === 0) return [];

      const sessionFetchPromises = appointmentIds.map((id) => getSessionsByAppointment(id));
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
    enabled: !!appointmentIds && appointmentIds.length > 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  return {
    treatmentsWithSessionRows: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
};
