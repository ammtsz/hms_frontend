import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createTreatment,
  bulkCreateTreatments,
} from '@/api/treatments';
import type {
  TreatmentResponseDto,
  CreateTreatmentRequest,
  BulkCreateTreatmentsRequest,
  BulkCreateTreatmentsResponse,
} from '@/api/types';

import { treatmentTrackingKeys } from '@/api/query/keys/treatmentTrackingKeys';

/**
 * Mutation hook for creating a treatment plan row (`POST /treatments`).
 */
export function useCreateTreatment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTreatmentRequest): Promise<TreatmentResponseDto> => {
      const response = await createTreatment(payload);

      if (!response.success) {
        throw new Error(response.error || 'Erro ao criar tratamento');
      }

      return response.value!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentTrackingKeys.treatments() });
    },
  });
}

/**
 * Mutation hook for bulk creating treatments atomically
 * This eliminates race conditions by creating all treatment rows in a single request
 */
export function useBulkCreateTreatments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bulkData: BulkCreateTreatmentsRequest): Promise<BulkCreateTreatmentsResponse> => {
      const response = await bulkCreateTreatments(bulkData);

      if (!response.success) {
        throw new Error(response.error || 'Erro ao criar tratamentos');
      }

      return response.value!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentTrackingKeys.treatments() });
    },
  });
}