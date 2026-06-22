import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBodyLocations,
  createBodyLocation,
  updateBodyLocation,
  deleteBodyLocation,
  checkSimilarBodyLocations,
} from '@/api/settings/body-locations';
import {
  getColors,
  createColor,
  updateColor,
  deleteColor,
  checkSimilarColors,
} from '@/api/settings/colors';
import type { UpdateSystemOptionRequest } from '@/types/systemOptions';
import { SystemOptionType } from '@/types/systemOptions';

import { systemOptionKeys } from '@/api/query/keys/systemOptionKeys';

// Body Locations Hooks
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

// Colors Hooks
export function useColors(includeInactive = false) {
  return useQuery({
    queryKey: [...systemOptionKeys.colors, includeInactive],
    queryFn: async () => {
      const result = await getColors(includeInactive);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to load colors');
      }
      return result.value;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateColor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: string) => {
      const result = await createColor(value);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to create color');
      }
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemOptionKeys.colors });
      queryClient.invalidateQueries({ queryKey: systemOptionKeys.similarColors });
    },
  });
}

export function useUpdateColor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number;
      updates: UpdateSystemOptionRequest;
    }) => {
      const result = await updateColor(id, updates);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to update color');
      }
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemOptionKeys.colors });
      queryClient.invalidateQueries({ queryKey: systemOptionKeys.similarColors });
    },
  });
}

export function useDeleteColor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteColor(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete color');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemOptionKeys.colors });
      queryClient.invalidateQueries({ queryKey: systemOptionKeys.similarColors });
    },
  });
}

/**
 * Imperative hook for checking similar system options on demand.
 * Returns a callable async function backed by React Query's cache so callers
 * don't need to import useQueryClient directly.
 */
export function useCheckSimilarOptions() {
  const queryClient = useQueryClient();

  return useCallback(
    (type: SystemOptionType, value: string) => {
      const checkFn = type === SystemOptionType.BODY_LOCATION
        ? checkSimilarBodyLocations
        : checkSimilarColors;
      const queryKey = type === SystemOptionType.BODY_LOCATION
        ? [...systemOptionKeys.similarBodyLocations, value]
        : [...systemOptionKeys.similarColors, value];

      return queryClient.fetchQuery({
        queryKey,
        queryFn: () => checkFn(value),
        staleTime: 60 * 1000,
      });
    },
    [queryClient],
  );
}
