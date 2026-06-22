import { useQuery } from "@tanstack/react-query";
import { HOLIDAY_QUERY_KEYS } from "@/api/query/keys/holidayKeys";
import { getAllHolidays } from "@/api/holidays";
import type { Holiday } from "@/types/holiday";
import { formatDateClinic } from "@/utils/timezoneDate";

/**
 * Hook to get holiday information for a specific date
 * Caches all holidays for the year to avoid multiple API calls
 */
export function useHolidayForDate(date: string): {
  holiday: Holiday | null;
  isLoading: boolean;
} {
  const dateStr = formatDateClinic(date);
  const year = Number(dateStr.slice(0, 4));

  // Fetch all holidays for the year (cached by React Query)
  const { data: holidays, isLoading } = useQuery({
    queryKey: HOLIDAY_QUERY_KEYS.list(year),
    queryFn: async () => {
      const result = await getAllHolidays(year);
      return result.success ? result.value : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
  });

  // Find holiday for this specific date
  const holiday = holidays?.find((h) => h.holidayDate === dateStr) || null;

  return {
    holiday,
    isLoading,
  };
}
