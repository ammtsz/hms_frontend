import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDayFinalizationStatus,
  processEndOfDay,
  type ProcessEndOfDayParams,
  type ProcessEndOfDayResponse,
} from '@/api/day-finalization';
import { invalidateAttendanceTreatmentCaches } from '@/api/query/invalidation/invalidateAttendanceTreatmentCaches';

import { dayFinalizationKeys } from '@/api/query/keys/dayFinalizationKeys';

/**
 * Fetch day finalization status for a specific date
 * 
 * @param date Date string in YYYY-MM-DD format
 * @returns Query result with isFinalized status and finalization details
 * 
 * @example
 * const { data, isLoading } = useDayFinalizationStatus('2026-01-15');
 * if (data?.isFinalized) {
 *   // Day is finalized
 * }
 */
export function useDayFinalizationStatus(date: string) {
  return useQuery({
    queryKey: dayFinalizationKeys.byDate(date),
    queryFn: async () => {
      const result = await getDayFinalizationStatus(date);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch finalization status');
      }
      return result.value;
    },
    enabled: !!date,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Imperative hook for fetching day finalization status on demand.
 * Returns a callable async function that leverages React Query's cache,
 * so callers don't need to import useQueryClient directly.
 */
export function useFetchDayFinalizationStatus() {
  const queryClient = useQueryClient();

  return useCallback(
    (date: string) =>
      queryClient.fetchQuery({
        queryKey: dayFinalizationKeys.byDate(date),
        queryFn: () => getDayFinalizationStatus(date),
        staleTime: 5 * 60 * 1000,
      }),
    [queryClient],
  );
}

/**
 * Mutation hook to process endOfDay (mark absences, reschedule/F+cancel, finalize)
 *
 * Replaces the previous flow of markMissed + handleAbsenceJustifications
 * with a single API call.
 *
 * @example
 * const processEndOfDayMutation = useProcessEndOfDay();
 *
 * await processEndOfDayMutation.mutateAsync({
 *   date: '2026-01-15',
 *   absenceJustifications: [
 *     { attendanceId: 1, justified: false, notes: '' },
 *   ],
 * });
 */
export function useProcessEndOfDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ProcessEndOfDayParams) => {
      const result = await processEndOfDay(params);
      if (!result.success) {
        throw new Error(result.error || 'Failed to process endOfDay');
      }
      return result.value as ProcessEndOfDayResponse;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: dayFinalizationKeys.byDate(variables.date),
      });
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: dayFinalizationKeys.all });
      invalidateAttendanceTreatmentCaches(queryClient);
    },
    onError: (error) => {
      console.error('Error processing endOfDay:', error);
    },
  });
}
