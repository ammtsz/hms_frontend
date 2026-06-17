import type { Priority } from "@/types/types";
import type { SystemOption } from "@/types/systemOptions";

export type PriorityFallbackPosition = "first" | "last";

/**
 * Stable ordering for priority dropdowns: sortOrder asc, then value string.
 * Does not mutate the input array.
 */
export function sortPriorityOptionsBySortOrder(
  options: SystemOption[] | undefined | null,
): SystemOption[] {
  return (options ?? [])
    .slice()
    .sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        a.value.localeCompare(b.value),
    );
}

export function filterActivePriorityOptions(
  options: SystemOption[] | undefined | null,
): SystemOption[] {
  return sortPriorityOptionsBySortOrder(
    (options ?? []).filter((p) => p.isActive),
  );
}

export function pickFallbackPriorityValue(
  sorted: SystemOption[],
  position: PriorityFallbackPosition,
): Priority | undefined {
  if (sorted.length === 0) return undefined;
  const option =
    position === "first" ? sorted[0]! : sorted[sorted.length - 1]!;
  return option.value as Priority;
}

export function defaultPriorityFromSorted(
  sorted: SystemOption[],
  position: PriorityFallbackPosition = "last",
  whenEmpty: Priority = "1",
): Priority {
  return pickFallbackPriorityValue(sorted, position) ?? whenEmpty;
}
