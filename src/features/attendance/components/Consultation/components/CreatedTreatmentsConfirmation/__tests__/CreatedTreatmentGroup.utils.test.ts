import { groupCreatedTreatmentsForDisplay } from "../CreatedTreatmentGroup.utils";
import type { CreatedTreatment } from "../../CreatedTreatmentsConfirmation";

function createSession(
  overrides: Partial<CreatedTreatment> & { id: number; bodyLocation: string },
): CreatedTreatment {
  return {
    consultationId: 1,
    attendanceId: 1,
    patientId: 1,
    treatmentType: "physiotherapy",
    startDate: "2025-09-16",
    plannedSessions: 5,
    completedSessions: 0,
    status: "scheduled",
    durationMinutes: 3,
    color: "Blue",
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
    expect(result[0].representativeSession.color).toBe("Blue");
    expect(result[0].representativeSession.durationMinutes).toBe(3);
    expect(result[0].representativeSession.plannedSessions).toBe(5);
  });

  it("returns separate groups when color or duration or plannedSessions or startDate differ", () => {
    const sessions: CreatedTreatment[] = [
      createSession({ id: 1, bodyLocation: "Head", color: "Blue" }),
      createSession({ id: 2, bodyLocation: "Neck", color: "Red" }),
      createSession({
        id: 3,
        bodyLocation: "Shoulder",
        color: "Blue",
        durationMinutes: 5,
      }),
      createSession({
        id: 4,
        bodyLocation: "Back",
        color: "Blue",
        durationMinutes: 3,
        plannedSessions: 3,
      }),
      createSession({
        id: 5,
        bodyLocation: "Lumbar",
        color: "Blue",
        durationMinutes: 3,
        plannedSessions: 5,
        startDate: "2025-09-23",
      }),
    ];

    const result = groupCreatedTreatmentsForDisplay(sessions);

    expect(result).toHaveLength(5);
    // Group 1: Blue, 3, 5, 2025-09-16 -> Head
    expect(result[0].bodyLocations).toEqual(["Head"]);
    // Group 2: Red, 3, 5, 2025-09-16 -> Neck
    expect(result[1].bodyLocations).toEqual(["Neck"]);
    // Group 3: Blue, 5, 5, 2025-09-16 -> Shoulder
    expect(result[2].bodyLocations).toEqual(["Shoulder"]);
    // Group 4: Blue, 3, 3, 2025-09-16 -> Back
    expect(result[3].bodyLocations).toEqual(["Back"]);
    // Group 5: Blue, 3, 5, 2025-09-23 -> Lumbar (different startDate)
    expect(result[4].bodyLocations).toEqual(["Lumbar"]);
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

  it("handles tens treatment (no color/duration) grouping by plannedSessions and startDate", () => {
    const sessions: CreatedTreatment[] = [
      createSession({
        id: 1,
        treatmentType: "tens",
        bodyLocation: "Back",
        color: undefined,
        durationMinutes: undefined,
      }),
      createSession({
        id: 2,
        treatmentType: "tens",
        bodyLocation: "Lumbar",
        color: undefined,
        durationMinutes: undefined,
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
