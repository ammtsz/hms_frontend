/**
 * ExpandedTreatmentDetails.utils unit tests
 */

import {
  getUniqueTreatmentPlans,
  groupTreatmentPlansForEdit,
  groupByTypeDuration,
  getEditEligibility,
  canAddNewTreatmentRow,
} from "../ExpandedTreatmentDetails.utils";
import type { TreatmentResponseDto } from "@/api/types";
import type { TreatmentPlanWithSessionRow } from "@/api/query/hooks/useTreatmentsWithSessionRows";

function createSession(
  overrides: Partial<TreatmentResponseDto> = {},
): TreatmentResponseDto {
  return {
    id: 1,
    consultationId: 1,
    appointmentId: 1,
    patientId: 1,
    treatmentType: "physiotherapy",
    bodyLocation: "Head",
    startDate: "2025-01-01",
    plannedSessions: 10,
    completedSessions: 0,
    status: "in_progress",
    durationMinutes: 30,
    notes: undefined,
    createdDate: "2025-01-01",
    createdTime: "10:00:00",
    updatedDate: "2025-01-01",
    updatedTime: "10:00:00",
    ...overrides,
  };
}

function createRecord(sessionNumber: number) {
  return {
    id: 1,
    treatmentId: 1,
    sessionNumber,
    scheduledDate: "2025-01-15",
    status: "scheduled" as const,
    createdDate: "2025-01-01",
    createdTime: "10:00:00",
    updatedDate: "2025-01-01",
    updatedTime: "10:00:00",
  };
}

function withRecord(
  session: TreatmentResponseDto,
  sessionNumber: number,
): TreatmentPlanWithSessionRow {
  return {
    treatment: session,
    sessionRow: createRecord(sessionNumber),
  };
}

describe("ExpandedTreatmentDetails.utils", () => {
  describe("getUniqueTreatmentPlans", () => {
    it("returns unique treatment plans by id from treatmentsWithSessionRows", () => {
      const s1 = createSession({ id: 1 });
      const s2 = createSession({ id: 2 });
      const items = [withRecord(s1, 1), withRecord(s1, 2), withRecord(s2, 1)];
      const result = getUniqueTreatmentPlans(items);
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.id).sort()).toEqual([1, 2]);
    });

    it("returns empty array when input is empty", () => {
      expect(getUniqueTreatmentPlans([])).toEqual([]);
    });
  });

  describe("groupTreatmentPlansForEdit", () => {
    it("groups treatment plans by treatmentType, plannedSessions, durationMinutes", () => {
      const sessions = [
        createSession({
          id: 1,
          treatmentType: "physiotherapy",
          plannedSessions: 10,
          durationMinutes: 30,
        }),
        createSession({
          id: 2,
          treatmentType: "physiotherapy",
          plannedSessions: 10,
          durationMinutes: 30,
        }),
        createSession({
          id: 3,
          treatmentType: "physiotherapy",
          plannedSessions: 10,
          durationMinutes: 45,
        }),
      ];
      const result = groupTreatmentPlansForEdit(sessions);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(2);
      expect(result[1]).toHaveLength(1);
    });

    it("groups tens sessions by plannedSessions and duration", () => {
      const sessions = [
        createSession({
          id: 1,
          treatmentType: "tens",
          durationMinutes: 30,
          plannedSessions: 5,
        }),
        createSession({
          id: 2,
          treatmentType: "tens",
          durationMinutes: 30,
          plannedSessions: 5,
        }),
      ];
      const result = groupTreatmentPlansForEdit(sessions);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(2);
    });
  });

  describe("groupByTypeDuration", () => {
    it("groups items by type, duration, sessionNumber, plannedSessions", () => {
      const s1 = createSession({
        id: 1,
        treatmentType: "physiotherapy",
        durationMinutes: 30,
        plannedSessions: 10,
        bodyLocation: "Head",
      });
      const s2 = createSession({
        id: 2,
        treatmentType: "physiotherapy",
        durationMinutes: 30,
        plannedSessions: 10,
        bodyLocation: "Neck",
      });
      const items = [withRecord(s1, 1), withRecord(s2, 2)];
      const result = groupByTypeDuration(items);
      expect(result).toHaveLength(2);
      expect(result[0].treatmentType).toBe("physiotherapy");
      expect(result[0].durationMinutes).toBe(30);
      expect(result[0].sessionNumber).toBe(1);
      expect(result[0].bodyLocations).toEqual(["Head"]);
      expect(result[1].bodyLocations).toEqual(["Neck"]);
    });

    it("merges body locations for same display group (same sessionNumber)", () => {
      const s1 = createSession({
        id: 1,
        treatmentType: "tens",
        bodyLocation: "Arm",
        plannedSessions: 5,
      });
      const s2 = createSession({
        id: 2,
        treatmentType: "tens",
        bodyLocation: "Leg",
        plannedSessions: 5,
      });
      const items = [withRecord(s1, 1), withRecord(s2, 1)];
      const result = groupByTypeDuration(items);
      expect(result).toHaveLength(1);
      expect(result[0].bodyLocations).toContain("Arm");
      expect(result[0].bodyLocations).toContain("Leg");
    });
  });

  describe("getEditEligibility", () => {
    it("allows edit when all sessions have completedSessions === 0 and current date matches effective first day", () => {
      const sessions = [
        createSession({
          completedSessions: 0,
          sessions: [
            { ...createRecord(1), scheduledDate: "2025-01-08" },
            { ...createRecord(2), scheduledDate: "2025-01-15" },
          ],
        }),
        createSession({
          id: 2,
          completedSessions: 0,
          sessions: [
            { ...createRecord(1), treatmentId: 2, scheduledDate: "2025-01-08" },
          ],
        }),
      ];
      expect(getEditEligibility(sessions, "2025-01-08")).toEqual({
        canEdit: true,
      });
    });

    it("disables edit when any session has completedSessions > 0", () => {
      const sessions = [
        createSession({ completedSessions: 0 }),
        createSession({ id: 2, completedSessions: 1 }),
      ];
      expect(getEditEligibility(sessions, "2025-01-15")).toEqual({
        canEdit: false,
        reason: "hasCompletedSessions",
      });
    });

    it("disables edit when currentScheduledDate is missing", () => {
      expect(getEditEligibility([], undefined)).toEqual({
        canEdit: false,
        reason: "missingCurrentDate",
      });
    });

    it("treats undefined completedSessions as 0", () => {
      const sessions = [
        createSession({
          completedSessions: undefined,
          sessions: [{ ...createRecord(1), scheduledDate: "2025-01-15" }],
        }),
      ];
      expect(getEditEligibility(sessions, "2025-01-15")).toEqual({
        canEdit: true,
      });
    });

    it("uses chronological scheduledDate (reschedule scenario)", () => {
      const session = createSession({
        completedSessions: 0,
        sessions: [
          { ...createRecord(2), scheduledDate: "2025-05-15" },
          { ...createRecord(3), scheduledDate: "2025-05-22" },
          // Session 1 was rescheduled to later, but remains sessionNumber 1
          { ...createRecord(1), scheduledDate: "2025-05-29" },
        ],
      });

      expect(getEditEligibility([session], "2025-05-15")).toEqual({
        canEdit: true,
      });
      expect(getEditEligibility([session], "2025-05-29")).toEqual({
        canEdit: false,
        reason: "notEffectiveFirstDay",
      });
    });

    it("skips missed/cancelled when finding effective first day", () => {
      const session = createSession({
        completedSessions: 0,
        sessions: [
          { ...createRecord(1), scheduledDate: "2025-05-08", status: "missed" },
          {
            ...createRecord(2),
            scheduledDate: "2025-05-15",
            status: "scheduled",
          },
        ],
      });

      expect(getEditEligibility([session], "2025-05-15")).toEqual({
        canEdit: true,
      });
      expect(getEditEligibility([session], "2025-05-08")).toEqual({
        canEdit: false,
        reason: "notEffectiveFirstDay",
      });
    });
  });

  describe("canAddNewTreatmentRow", () => {
    it("returns true when session numbers follow chronological dates (1,2,3)", () => {
      const session = createSession({
        sessions: [
          { ...createRecord(1), scheduledDate: "2025-05-08" },
          { ...createRecord(2), scheduledDate: "2025-05-15" },
          { ...createRecord(3), scheduledDate: "2025-05-22" },
        ],
      });
      expect(canAddNewTreatmentRow([session])).toBe(true);
    });

    it("returns false when reschedule breaks date vs sessionNumber order (2,3,1)", () => {
      const session = createSession({
        sessions: [
          { ...createRecord(2), scheduledDate: "2025-05-15" },
          { ...createRecord(3), scheduledDate: "2025-05-22" },
          { ...createRecord(1), scheduledDate: "2025-05-29" },
        ],
      });
      expect(canAddNewTreatmentRow([session])).toBe(false);
    });

    it("returns true when only one active record remains after missed first", () => {
      const session = createSession({
        sessions: [
          { ...createRecord(1), scheduledDate: "2025-05-08", status: "missed" },
          {
            ...createRecord(2),
            scheduledDate: "2025-05-15",
            status: "scheduled",
          },
        ],
      });
      expect(canAddNewTreatmentRow([session])).toBe(true);
    });

    it("returns true when two active records are consecutive starting at 2", () => {
      const session = createSession({
        sessions: [
          { ...createRecord(1), scheduledDate: "2025-05-08", status: "missed" },
          {
            ...createRecord(2),
            scheduledDate: "2025-05-15",
            status: "scheduled",
          },
          {
            ...createRecord(3),
            scheduledDate: "2025-05-22",
            status: "scheduled",
          },
        ],
      });
      expect(canAddNewTreatmentRow([session])).toBe(true);
    });

    it("returns true when sessions are missing", () => {
      expect(
        canAddNewTreatmentRow([createSession({ sessions: undefined })]),
      ).toBe(true);
    });
  });
});
