import { QueryClient } from "@tanstack/react-query";
import { sessionsQueryKeys } from "@/api/query/keys/sessionsQueryKeys";
import { treatmentsQueryKeys } from "@/api/query/keys/treatmentsQueryKeys";
import { invalidateAttendanceTreatmentCaches } from "../invalidateAttendanceTreatmentCaches";

describe("invalidateAttendanceTreatmentCaches", () => {
  it("invalidates treatments, sessions, and refetches attendance-scoped treatment queries", () => {
    const queryClient = new QueryClient();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const refetchSpy = jest.spyOn(queryClient, "refetchQueries");

    invalidateAttendanceTreatmentCaches(queryClient);

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: treatmentsQueryKeys.all,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: sessionsQueryKeys.all,
    });
    expect(refetchSpy).toHaveBeenCalledWith({
      queryKey: ["treatmentsByAttendance"],
    });
  });
});
