import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkUpdatePatientsPriority,
  deactivatePriorityOption,
  getPriorities,
  updatePriorityOption,
} from "@/api/settings/priorities";
import type { Priority } from "@/types/types";
import type { DeactivatePriorityResponse } from "@/api/settings/priorities";
import { patientKeys } from "@/api/query/keys/patientKeys";
import type { SystemOption } from "@/types/systemOptions";

import { priorityKeys } from "@/api/query/keys/priorityKeys";

export function usePriorities(includeInactive = false) {
  return useQuery({
    queryKey: [...priorityKeys.all, includeInactive],
    queryFn: async () => {
      const result = await getPriorities(includeInactive);
      if (!result.success || !result.value) {
        throw new Error(result.error || "Falha ao carregar prioridades");
      }
      return result.value;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePriorityOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<Pick<SystemOption, "label" | "isActive" | "sortOrder">>;
    }) => {
      const result = await updatePriorityOption(id, updates);
      if (!result.success || !result.value) {
        throw new Error(result.error || "Falha ao atualizar prioridade");
      }
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priorityKeys.all });
    },
  });
}

export function useDeactivatePriorityOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<DeactivatePriorityResponse> => {
      return deactivatePriorityOption(id);
    },
    onSuccess: (data) => {
      if (!data.success) return;
      queryClient.invalidateQueries({ queryKey: priorityKeys.all });
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
    },
  });
}

export function useBulkUpdatePatientsPriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      patientIds: number[];
      priority: Priority;
    }) => {
      const result = await bulkUpdatePatientsPriority(params);
      if (!result.success || !result.value) {
        throw new Error(result.error || "Falha ao atualizar prioridades dos pacientes");
      }
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priorityKeys.all });
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
    },
  });
}

