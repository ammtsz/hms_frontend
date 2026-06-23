import { useQueries } from "@tanstack/react-query";
import { checkIfHolidayForTreatmentType } from "@/api/holidays";

const TREATMENT_TYPES = [
  { api: "assessment", label: "Assessment Consultation" },
  { api: "physiotherapy", label: "Physiotherapy" },
  { api: "tens", label: "TENS" },
] as const;

type TreatmentLabel = (typeof TREATMENT_TYPES)[number]["label"];

/**
 * Returns holiday status for a date across all appointment types (assessment, physiotherapy, tens).
 * Used to disable the day and show "Holiday for [treatment types]" in appointment management.
 */
export function useBoardHolidayForDate(selectedDate: string | null) {
  const results = useQueries({
    queries: TREATMENT_TYPES.map(({ api }) => ({
      queryKey: ["holidayCheck", selectedDate, api] as const,
      queryFn: async () => {
        if (!selectedDate) return { isHoliday: false };
        const result = await checkIfHolidayForTreatmentType(selectedDate, api);
        if (!result.success) throw new Error(result.error || 'Error checking holiday');
        return { isHoliday: result.value };
      },
      enabled: !!selectedDate,
      staleTime: 2 * 60 * 1000,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const hasError = results.some((r) => r.isError);
  const blockedLabels = results
    .map((r, i) => (r.data?.isHoliday ? TREATMENT_TYPES[i].label : null))
    .filter((label): label is TreatmentLabel => label !== null);
  const isHolidayForAll =
    results.length === 3 &&
    results.every((r) => r.data?.isHoliday === true);

  return {
    isLoading,
    hasError,
    blockedLabels,
    isHolidayForAll,
    /** Human-readable message: "Holiday for Assessment Consultation, Physiotherapy, TENS" (or subset) */
    holidayMessage:
      blockedLabels.length > 0
        ? `Holiday for ${blockedLabels.join(", ")}`
        : null,
  };
}
