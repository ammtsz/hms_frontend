import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBodyLocations,
  createBodyLocation,
  updateBodyLocation,
  deleteBodyLocation,
  checkSimilarBodyLocations,
} from '@/api/settings/body-locations';
import type { UpdateSystemOptionRequest } from '@/types/systemOptions';

import { systemOptionKeys } from '@/api/query/keys/systemOptionKeys';

export function useBodyLocations(includeInactive = false) {
  return useQuery({
    queryKey: [...systemOptionKeys.bodyLocations, includeInactive],
    queryFn: async () => {
      const result = await getBodyLocations(includeInactive);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to load body locations');
      }
      return result.value;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBodyLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: string) => {
      const result = await createBodyLocation(value);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to create body location');
      }
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemOptionKeys.bodyLocations });
      queryClient.invalidateQueries({ queryKey: systemOptionKeys.similarBodyLocations });
    },
  });
}

export function useUpdateBodyLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number;
      updates: UpdateSystemOptionRequest;
    }) => {
      const result = await updateBodyLocation(id, updates);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to update body location');
      }
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemOptionKeys.bodyLocations });
      queryClient.invalidateQueries({ queryKey: systemOptionKeys.similarBodyLocations });
    },
  });
}

export function useDeleteBodyLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteBodyLocation(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete body location');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemOptionKeys.bodyLocations });
      queryClient.invalidateQueries({ queryKey: systemOptionKeys.similarBodyLocations });
    },
  });
}

export function useCheckSimilarOptions() {
  const queryClient = useQueryClient();

  return useCallback(
    (_type: unknown, value: string) =>
      queryClient.fetchQuery({
        queryKey: [...systemOptionKeys.similarBodyLocations, value],
        queryFn: () => checkSimilarBodyLocations(value),
        staleTime: 60 * 1000,
      }),
    [queryClient],
  );
}
