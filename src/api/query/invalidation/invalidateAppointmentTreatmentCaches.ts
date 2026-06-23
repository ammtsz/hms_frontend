import type { QueryClient } from "@tanstack/react-query";
import { sessionsQueryKeys } from "@/api/query/keys/sessionsQueryKeys";
import { treatmentsQueryKeys } from "@/api/query/keys/treatmentsQueryKeys";

/**
 * Keeps appointment-board badge counts + expanded treatment card sessions in sync
 * after anything that changes session rows or which appointments exist on a date
 * (postpone, bulk postpone, consultation reschedule, etc.).
 */
export function invalidateAppointmentTreatmentCaches(
  queryClient: QueryClient,
): void {
  queryClient.invalidateQueries({ queryKey: treatmentsQueryKeys.all });
  queryClient.invalidateQueries({ queryKey: sessionsQueryKeys.all });
  queryClient.refetchQueries({ queryKey: ["treatmentsByAppointment"] });
}

