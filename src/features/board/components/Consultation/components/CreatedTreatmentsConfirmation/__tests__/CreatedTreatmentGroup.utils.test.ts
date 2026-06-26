import { groupCreatedTreatmentsForDisplay } from "../CreatedTreatmentGroup.utils";
import type { CreatedTreatment } from "../../CreatedTreatmentsConfirmation";

function createSession(
  overrides: Partial<CreatedTreatment> & { id: number; bodyLocation: string },
): CreatedTreatment {
  return {
    consultationId: 1,
    appointmentId: 1,
    patientId: 1,
    treatmentType: "physiotherapy",
    startDate: "2025-09-16",
    plannedSessions: 5,
    completedSessions: 0,
    status: "scheduled",
    durationMinutes: 45,
    notes: "",
    createdDate: "2025-09-16",
    createdTime: "10:00:00",
    updatedDate: "2025-09-16",
    updatedTime: "10:00:00",
    ...overrides,
  };
}

describe("groupCreatedTreatmentsForDisplay", () => {
  it("groups sessions that differ only by body location", () => {
    const sessions: CreatedTreatment[] = [
      createSession({ id: 1, bodyLocation: "Head" }),
      createSession({ id: 2, bodyLocation: "Neck" }),
      createSession({ id: 3, bodyLocation: "Shoulder" }),
    ];

    const result = groupCreatedTreatmentsForDisplay(sessions);

    expect(result).toHaveLength(1);
    expect(result[0].treatments).toHaveLength(3);
    expect(result[0].bodyLocations).toEqual(["Head", "Neck", "Shoulder"]);
    expect(result[0].representativeSession.bodyLocation).toBe("Head");
    expect(result[0].representativeSession.durationMinutes).toBe(45);
    expect(result[0].representativeSession.plannedSessions).toBe(5);
  });

  it("returns separate groups when duration or plannedSessions or startDate differ", () => {
    const sessions: CreatedTreatment[] = [
      createSession({ id: 1, bodyLocation: "Head", durationMinutes: 45 }),
      createSession({ id: 2, bodyLocation: "Neck", durationMinutes: 30 }),
      createSession({
        id: 3,
        bodyLocation: "Shoulder",
        durationMinutes: 45,
        plannedSessions: 3,
      }),
      createSession({
        id: 4,
        bodyLocation: "Back",
        durationMinutes: 45,
        plannedSessions: 5,
        startDate: "2025-09-23",
      }),
    ];

    const result = groupCreatedTreatmentsForDisplay(sessions);

    expect(result).toHaveLength(4);
    expect(result[0].bodyLocations).toEqual(["Head"]);
    expect(result[1].bodyLocations).toEqual(["Neck"]);
    expect(result[2].bodyLocations).toEqual(["Shoulder"]);
    expect(result[3].bodyLocations).toEqual(["Back"]);
  });

  it("sorts body locations by locale en-US", () => {
    const sessions: CreatedTreatment[] = [
      createSession({ id: 1, bodyLocation: "Neck" }),
      createSession({ id: 2, bodyLocation: "Head" }),
      createSession({ id: 3, bodyLocation: "Lumbar area" }),
    ];

    const result = groupCreatedTreatmentsForDisplay(sessions);

    expect(result).toHaveLength(1);
    expect(result[0].bodyLocations).toEqual(["Head", "Lumbar area", "Neck"]);
  });

  it("returns one group per session when all keys differ", () => {
    const sessions: CreatedTreatment[] = [
      createSession({ id: 1, bodyLocation: "A", startDate: "2025-09-16" }),
      createSession({ id: 2, bodyLocation: "B", startDate: "2025-09-23" }),
    ];

    const result = groupCreatedTreatmentsForDisplay(sessions);

    expect(result).toHaveLength(2);
    expect(result[0].bodyLocations).toEqual(["A"]);
    expect(result[1].bodyLocations).toEqual(["B"]);
  });

  it("handles tens treatment grouping by duration, plannedSessions and startDate", () => {
    const sessions: CreatedTreatment[] = [
      createSession({
        id: 1,
        treatmentType: "tens",
        bodyLocation: "Back",
        durationMinutes: 30,
      }),
      createSession({
        id: 2,
        treatmentType: "tens",
        bodyLocation: "Lumbar",
        durationMinutes: 30,
      }),
    ];

    const result = groupCreatedTreatmentsForDisplay(sessions);

    expect(result).toHaveLength(1);
    expect(result[0].treatments).toHaveLength(2);
    expect(result[0].bodyLocations).toEqual(["Back", "Lumbar"]);
  });

  it("handles empty array", () => {
    const result = groupCreatedTreatmentsForDisplay([]);
    expect(result).toHaveLength(0);
  });
});
