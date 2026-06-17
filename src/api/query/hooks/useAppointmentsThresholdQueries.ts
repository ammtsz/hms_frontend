import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAppointmentsThreshold,
  updateAppointmentsThreshold,
} from '@/api/appointments-threshold';

import { appointmentsThresholdKeys } from '@/api/query/keys/appointmentsThresholdKeys';

export function useAppointmentsThreshold() {
  return useQuery({
    queryKey: appointmentsThresholdKeys.all,
    queryFn: async () => {
      const result = await getAppointmentsThreshold();
      if (!result.success) {
        throw new Error(result.error || 'Falha ao carregar limite de faltas');
      }
      return result.value;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateAppointmentsThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (missingAppointmentsThreshold: number) => {
      const result = await updateAppointmentsThreshold(missingAppointmentsThreshold);
      if (!result.success) {
        throw new Error(result.error || 'Falha ao atualizar limite de faltas');
      }
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: appointmentsThresholdKeys.all,
      });
    },
  });
}
