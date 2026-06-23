import {
  groupPatientSessionsByTreatmentPlan,
  resolveTreatmentPlanSessionHistory,
} from "../postTreatmentSession.utils";
import type { SessionResponseDto } from "@/api/types";

const baseSession = (
  overrides: Partial<SessionResponseDto>,
): SessionResponseDto => ({
  id: 1,
  treatmentId: 1,
  sessionNumber: 1,
  scheduledDate: "2026-05-21",
  status: "scheduled",
  createdDate: "2026-01-01",
  createdTime: "10:00:00",
  updatedDate: "2026-01-01",
  updatedTime: "10:00:00",
  ...overrides,
});

describe("postTreatmentSession.utils", () => {
  describe("groupPatientSessionsByTreatmentPlan", () => {
    it("indexes sessions by treatment plan id and sorts by session number", () => {
      const patientSessions = [
        baseSession({ id: 3, treatmentId: 7, sessionNumber: 3 }),
        baseSession({ id: 1, treatmentId: 7, sessionNumber: 1, status: "missed" }),
        baseSession({ id: 2, treatmentId: 7, sessionNumber: 2 }),
        baseSession({ id: 4, treatmentId: 8, sessionNumber: 1, status: "missed" }),
      ];

      const historyByPlan = groupPatientSessionsByTreatmentPlan(patientSessions);

      expect(historyByPlan.get(7)?.map((s) => s.sessionNumber)).toEqual([1, 2, 3]);
      expect(historyByPlan.get(7)?.[0].status).toBe("missed");
      expect(historyByPlan.get(8)?.[0].status).toBe("missed");
    });
  });

  describe("resolveTreatmentPlanSessionHistory", () => {
    it("returns the patient index entry when the plan exists", () => {
      const historyByPlan = groupPatientSessionsByTreatmentPlan([
        baseSession({ treatmentId: 9, sessionNumber: 1, status: "missed" }),
        baseSession({ id: 2, treatmentId: 9, sessionNumber: 3 }),
      ]);
      const attendanceScopedSessions = [
        baseSession({ treatmentId: 9, sessionNumber: 3, status: "scheduled" }),
      ];

      const result = resolveTreatmentPlanSessionHistory(
        historyByPlan,
        9,
        attendanceScopedSessions,
      );

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe("missed");
      expect(result[1].sessionNumber).toBe(3);
    });

    it("falls back to attendance-scoped sessions when the plan is not in the index", () => {
      const historyByPlan = groupPatientSessionsByTreatmentPlan([]);
      const attendanceScopedSessions = [
        baseSession({ id: 5, treatmentId: 9, sessionNumber: 3, status: "scheduled" }),
      ];

      const result = resolveTreatmentPlanSessionHistory(
        historyByPlan,
        9,
        attendanceScopedSessions,
      );

      expect(result).toEqual(attendanceScopedSessions);
    });
  });
});
