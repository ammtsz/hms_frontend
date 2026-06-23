import { QueryClient } from "@tanstack/react-query";
import { sessionsQueryKeys } from "@/api/query/keys/sessionsQueryKeys";
import { treatmentsQueryKeys } from "@/api/query/keys/treatmentsQueryKeys";
import { invalidateAppointmentTreatmentCaches } from "../invalidateAppointmentTreatmentCaches";

describe("invalidateAppointmentTreatmentCaches", () => {
  it("invalidates treatments, sessions, and refetches appointment-scoped treatment queries", () => {
    const queryClient = new QueryClient();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const refetchSpy = jest.spyOn(queryClient, "refetchQueries");

    invalidateAppointmentTreatmentCaches(queryClient);

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: treatmentsQueryKeys.all,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: sessionsQueryKeys.all,
    });
    expect(refetchSpy).toHaveBeenCalledWith({
      queryKey: ["treatmentsByAppointment"],
    });
  });
});
