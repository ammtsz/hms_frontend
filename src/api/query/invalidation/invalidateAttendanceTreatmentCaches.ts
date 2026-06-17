import type { QueryClient } from "@tanstack/react-query";
import { sessionsQueryKeys } from "@/api/query/keys/sessionsQueryKeys";
import { treatmentsQueryKeys } from "@/api/query/keys/treatmentsQueryKeys";

/**
 * Keeps attendance-board badge counts + expanded treatment card sessions in sync
 * after anything that changes session rows or which attendances exist on a date
 * (postpone, bulk postpone, consultation reschedule, etc.).
 */
export function invalidateAttendanceTreatmentCaches(
  queryClient: QueryClient,
): void {
  queryClient.invalidateQueries({ queryKey: treatmentsQueryKeys.all });
  queryClient.invalidateQueries({ queryKey: sessionsQueryKeys.all });
  queryClient.refetchQueries({ queryKey: ["treatmentsByAttendance"] });
}

