import {
  groupCreatedTreatmentsForDisplay,
} from "../CreatedTreatmentGroup.utils";
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
    color: "Azul",
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
      createSession({ id: 1, bodyLocation: "Cabeça" }),
      createSession({ id: 2, bodyLocation: "Pescoço" }),
      createSession({ id: 3, bodyLocation: "Ombro" }),
    ];

    const result = groupCreatedTreatmentsForDisplay(sessions);

    expect(result).toHaveLength(1);
    expect(result[0].treatments).toHaveLength(3);
    expect(result[0].bodyLocations).toEqual(["Cabeça", "Ombro", "Pescoço"]);
    expect(result[0].representativeSession.bodyLocation).toBe("Cabeça");
    expect(result[0].representativeSession.color).toBe("Azul");
    expect(result[0].representativeSession.durationMinutes).toBe(3);
    expect(result[0].representativeSession.plannedSessions).toBe(5);
  });

  it("returns separate groups when color or duration or plannedSessions or startDate differ", () => {
    const sessions: CreatedTreatment[] = [
      createSession({ id: 1, bodyLocation: "Cabeça", color: "Azul" }),
      createSession({ id: 2, bodyLocation: "Pescoço", color: "Vermelho" }),
      createSession({
        id: 3,
        bodyLocation: "Ombro",
        color: "Azul",
        durationMinutes: 5,
      }),
      createSession({
        id: 4,
        bodyLocation: "Coluna",
        color: "Azul",
        durationMinutes: 3,
        plannedSessions: 3,
      }),
      createSession({
        id: 5,
        bodyLocation: "Costas",
        color: "Azul",
        durationMinutes: 3,
        plannedSessions: 5,
        startDate: "2025-09-23",
      }),
    ];

    const result = groupCreatedTreatmentsForDisplay(sessions);

    expect(result).toHaveLength(5);
    // Group 1: Azul, 3, 5, 2025-09-16 -> Cabeça
    expect(result[0].bodyLocations).toEqual(["Cabeça"]);
    // Group 2: Vermelho, 3, 5, 2025-09-16 -> Pescoço
    expect(result[1].bodyLocations).toEqual(["Pescoço"]);
    // Group 3: Azul, 5, 5, 2025-09-16 -> Ombro
    expect(result[2].bodyLocations).toEqual(["Ombro"]);
    // Group 4: Azul, 3, 3, 2025-09-16 -> Coluna
    expect(result[3].bodyLocations).toEqual(["Coluna"]);
    // Group 5: Azul, 3, 5, 2025-09-23 -> Costas (different startDate)
    expect(result[4].bodyLocations).toEqual(["Costas"]);
  });

  it("sorts body locations by locale pt-BR", () => {
    const sessions: CreatedTreatment[] = [
      createSession({ id: 1, bodyLocation: "Pescoço" }),
      createSession({ id: 2, bodyLocation: "Cabeça" }),
      createSession({ id: 3, bodyLocation: "Área lombar" }),
    ];

    const result = groupCreatedTreatmentsForDisplay(sessions);

    expect(result).toHaveLength(1);
    expect(result[0].bodyLocations).toEqual(["Área lombar", "Cabeça", "Pescoço"]);
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
        bodyLocation: "Coluna",
        color: undefined,
        durationMinutes: undefined,
      }),
      createSession({
        id: 2,
        treatmentType: "tens",
        bodyLocation: "Costas",
        color: undefined,
        durationMinutes: undefined,
      }),
    ];

    const result = groupCreatedTreatmentsForDisplay(sessions);

    expect(result).toHaveLength(1);
    expect(result[0].treatments).toHaveLength(2);
    expect(result[0].bodyLocations).toEqual(["Coluna", "Costas"]);
  });

  it("handles empty array", () => {
    const result = groupCreatedTreatmentsForDisplay([]);
    expect(result).toHaveLength(0);
  });
});
