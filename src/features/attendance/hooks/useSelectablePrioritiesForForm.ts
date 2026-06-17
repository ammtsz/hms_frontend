import { useEffect, useMemo, useRef } from "react";
import type { Priority } from "@/types/types";
import {
  pickFallbackPriorityValue,
  sortPriorityOptionsBySortOrder,
} from "@/utils/priorityOptions";
import { usePriorities } from "@/api/query/hooks/usePriorityOptionsQueries";

export interface UseSelectablePrioritiesForFormParams {
  /** When false, the sync effect does not run (e.g. existing patient, not editing priority context). */
  enabled: boolean;
  currentPriority: Priority;
  onInvalidPriority: (next: Priority) => void;
}

/**
 * Loads active priorities from the API, sorts them consistently, and keeps
 * `currentPriority` valid when admins deactivate options (via onInvalidPriority).
 * Invalid values fall back to the last sorted option (default / least-urgent slot).
 */
export function useSelectablePrioritiesForForm({
  enabled,
  currentPriority,
  onInvalidPriority,
}: UseSelectablePrioritiesForFormParams) {
  const query = usePriorities();
  const sortedPriorities = useMemo(
    () => sortPriorityOptionsBySortOrder(query.data),
    [query.data],
  );

  const onInvalidRef = useRef(onInvalidPriority);
  onInvalidRef.current = onInvalidPriority;

  useEffect(() => {
    if (!enabled) return;
    if (query.isLoading) return;
    if (sortedPriorities.length === 0) return;

    const isValid = sortedPriorities.some((p) => p.value === currentPriority);
    if (!isValid) {
      const next = pickFallbackPriorityValue(sortedPriorities, "last");
      if (next !== undefined) {
        onInvalidRef.current(next);
      }
    }
  }, [enabled, query.isLoading, sortedPriorities, currentPriority]);

  return {
    sortedPriorities,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
