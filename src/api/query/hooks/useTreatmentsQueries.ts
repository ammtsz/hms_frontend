import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTreatmentsByPatient,
  deleteTreatment,
  bulkCancelTreatments,
  updateTreatment,
  createTreatment,
} from '@/api/treatments';
import type { TreatmentResponseDto } from '@/api/types';
import type { PhysiotherapyLocationTreatment, TensLocationTreatment } from '@/types/treatment';
import { treatmentsQueryKeys } from '@/api/query/keys/treatmentsQueryKeys';

interface UseTreatmentsByPatientResult {
  treatments: TreatmentResponseDto[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Treatment plans for a patient (`GET /treatments/patient/:id`).
 */
export const useTreatmentsByPatient = (patientId: number): UseTreatmentsByPatientResult => {
  const {
    data: treatments = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: treatmentsQueryKeys.byPatient(patientId.toString()),
    queryFn: async () => {
      const response = await getTreatmentsByPatient(patientId.toString());

      if (!response.success) {
        throw new Error(response.error || 'Erro ao carregar tratamentos');
      }

      return response.value || [];
    },
    enabled: patientId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  return {
    treatments,
    loading,
    error: error?.message || null,
    refetch: async () => {
      await refetch();
    },
  };
};

/**
 * Bulk-cancel treatment plans (`POST /treatments/bulk-cancel`).
 */
export const useCancelTreatments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      treatmentIds,
      cancellationReason,
    }: {
      treatmentIds: number[];
      cancellationReason?: string;
    }) => {
      const response = await bulkCancelTreatments(treatmentIds, cancellationReason);

      if (!response.success) {
        throw new Error(response.error || 'Erro ao cancelar tratamentos');
      }

      return response.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentsQueryKeys.all });
    },
  });
};

/**
 * Deletes a treatment plan row (`DELETE /treatments/:id`).
 */
export const useDeleteTreatment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (treatmentId: string) => {
      const response = await deleteTreatment(treatmentId);

      if (!response.success) {
        throw new Error(response.error || 'Erro ao remover tratamento');
      }

      return response.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentsQueryKeys.all });
    },
  });
};

/**
 * Imperative invalidation for treatment queries and attendance-scoped treatment fetches.
 */
export const useInvalidateTreatments = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: treatmentsQueryKeys.all });
    queryClient.refetchQueries({ queryKey: ['treatmentsByAttendance'] });
  }, [queryClient]);
};

interface UseEditTreatmentsOptions {
  treatmentType: 'physiotherapy' | 'tens';
  firstSession: TreatmentResponseDto | undefined;
  patientId: number;
  /**
   * Visit attendance ID from the session row (`hms_session`), so the first created
   * row links to this card’s attendance. Differs from `firstSession.attendanceId`
   * (prescription attendance on the treatment plan).
   */
  currentAttendanceId?: number;
  onSuccess?: () => void;
  onClose: () => void;
  setSubmitError: (error: string | null) => void;
}

/**
 * Edit treatment body locations: update existing treatment rows or create new ones.
 */
export function useEditTreatments({
  treatmentType,
  firstSession,
  patientId,
  currentAttendanceId,
  onSuccess,
  onClose,
  setSubmitError,
}: UseEditTreatmentsOptions) {
  const invalidateTreatments = useInvalidateTreatments();

  return useMutation({
    mutationFn: async ({
      treatments: rows,
      editSessionIds: treatmentIds,
    }: {
      treatments: (PhysiotherapyLocationTreatment | TensLocationTreatment)[];
      editSessionIds: (number | undefined)[];
    }) => {
      if (!firstSession) throw new Error('No session data');

      for (let i = 0; i < rows.length; i++) {
        const t = rows[i];
        const bodyLocation = t.locations.length > 0 ? t.locations[0].trim() : '';
        const treatmentId = treatmentIds[i];

        if (treatmentId !== undefined) {
          const updatePayload: Parameters<typeof updateTreatment>[1] = {
            bodyLocation,
          };
          if (treatmentType === 'physiotherapy') {
            const lb = t as PhysiotherapyLocationTreatment;
            updatePayload.color = lb.color ?? '';
            updatePayload.durationMinutes = lb.duration ?? 1;
          }
          const res = await updateTreatment(String(treatmentId), updatePayload);
          if (!res.success) {
            throw new Error(res.error ?? 'Erro ao atualizar tratamento.');
          }
        } else {
          const createPayload = {
            consultationId: firstSession.consultationId,
            attendanceId: firstSession.attendanceId,
            patientId,
            treatmentType:
              treatmentType === 'physiotherapy' ? ('physiotherapy' as const) : ('tens' as const),
            bodyLocation,
            startDate: firstSession.startDate,
            plannedSessions: firstSession.plannedSessions,
            reuseAttendanceForFirstSession: true,
            ...(currentAttendanceId !== undefined && {
              firstSessionAttendanceId: currentAttendanceId,
            }),
          };
          if (treatmentType === 'physiotherapy') {
            const lb = t as PhysiotherapyLocationTreatment;
            (createPayload as Record<string, unknown>).durationMinutes = lb.duration ?? 1;
            (createPayload as Record<string, unknown>).color = lb.color ?? '';
          }
          const res = await createTreatment(createPayload);
          if (!res.success) {
            throw new Error(res.error ?? 'Erro ao criar tratamento.');
          }
        }
      }
    },
    onSuccess: () => {
      invalidateTreatments();
      onSuccess?.();
      onClose();
    },
    onError: (e) => {
      setSubmitError(e instanceof Error ? e.message : 'Erro ao salvar alterações.');
    },
  });
}
