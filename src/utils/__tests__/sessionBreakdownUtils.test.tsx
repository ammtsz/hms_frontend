/**
 * sessionBreakdownUtils unit tests
 */

import { render } from "@testing-library/react";
import {
  getStatusIcon,
  getStatusLabel,
  formatTime,
  formatDate,
  getTreatmentTypeLabel,
  getTreatmentTypeIcon,
  determineGroupStatus,
  getStatusDates,
} from "../sessionBreakdownUtils";
import { APPOINTMENT_HISTORY_STATUS_LABELS } from "../appointmentStatusLabels";
import { getAppointmentTypeLabel } from "../apiTransformers";

describe("sessionBreakdownUtils", () => {
  describe("getStatusIcon", () => {
    it("returns icon for completed", () => {
      const icon = getStatusIcon("completed");
      const { container } = render(<>{icon}</>);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("returns icon for missed", () => {
      const icon = getStatusIcon("missed");
      const { container } = render(<>{icon}</>);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("returns icon for cancelled", () => {
      const icon = getStatusIcon("cancelled");
      const { container } = render(<>{icon}</>);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("returns icon for scheduled", () => {
      const icon = getStatusIcon("scheduled");
      const { container } = render(<>{icon}</>);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("returns null for unknown status", () => {
      expect(getStatusIcon("unknown")).toBeNull();
    });
  });

  describe("getStatusLabel", () => {
    it("returns correct labels for known statuses", () => {
      expect(getStatusLabel("completed")).toBe(
        APPOINTMENT_HISTORY_STATUS_LABELS.completed,
      );
      expect(getStatusLabel("missed")).toBe(
        APPOINTMENT_HISTORY_STATUS_LABELS.missed,
      );
      expect(getStatusLabel("scheduled")).toBe(
        APPOINTMENT_HISTORY_STATUS_LABELS.scheduled,
      );
      expect(getStatusLabel("cancelled")).toBe(
        APPOINTMENT_HISTORY_STATUS_LABELS.cancelled,
      );
    });

    it("returns status as-is for unknown", () => {
      expect(getStatusLabel("unknown")).toBe("unknown");
    });
  });

  describe("formatTime", () => {
    it("returns first 5 chars for HH:MM:SS", () => {
      expect(formatTime("14:30:00")).toBe("14:30");
    });

    it("returns empty string for undefined", () => {
      expect(formatTime(undefined)).toBe("");
    });

    it("returns empty string for empty string", () => {
      expect(formatTime("")).toBe("");
    });
  });

  describe("formatDate", () => {
    it("formats YYYY-MM-DD as MM/DD", () => {
      expect(formatDate("2024-03-15")).toBe("03/15");
    });

    it("extracts date part from ISO datetime", () => {
      expect(formatDate("2024-03-15T10:30:00.000Z")).toBe("03/15");
    });
  });

  describe("getTreatmentTypeLabel", () => {
    it("returns correct labels", () => {
      expect(getTreatmentTypeLabel("physiotherapy")).toBe(
        getAppointmentTypeLabel("physiotherapy"),
      );
      expect(getTreatmentTypeLabel("tens")).toBe(getAppointmentTypeLabel("tens"));
    });

    it("returns empty string for undefined", () => {
      expect(getTreatmentTypeLabel(undefined)).toBe("");
    });

    it("returns type as-is for unknown", () => {
      expect(getTreatmentTypeLabel("other")).toBe("other");
    });
  });

  describe("getTreatmentTypeIcon", () => {
    it("returns emoji for known types", () => {
      expect(getTreatmentTypeIcon("physiotherapy")).toBe("✨");
      expect(getTreatmentTypeIcon("tens")).toBe("🪄");
    });

    it("returns empty string for undefined or unknown", () => {
      expect(getTreatmentTypeIcon(undefined)).toBe("");
      expect(getTreatmentTypeIcon("other")).toBe("");
    });
  });

  describe("determineGroupStatus", () => {
    it("returns completed when all sessions completed", () => {
      expect(
        determineGroupStatus([
          { status: "completed" },
          { status: "completed" },
        ]),
      ).toBe("completed");
    });

    it("returns cancelled when all sessions cancelled", () => {
      expect(
        determineGroupStatus([
          { status: "cancelled" },
          { status: "cancelled" },
        ]),
      ).toBe("cancelled");
    });

    it("returns in_progress when some completed and some not", () => {
      expect(
        determineGroupStatus([
          { status: "completed" },
          { status: "scheduled" },
        ]),
      ).toBe("in_progress");
    });

    it("returns scheduled when none completed", () => {
      expect(
        determineGroupStatus([
          { status: "scheduled" },
          { status: "scheduled" },
        ]),
      ).toBe("scheduled");
    });

    it("returns cancelled for empty array (vacuous every)", () => {
      expect(determineGroupStatus([])).toBe("cancelled");
    });
  });

  describe("getStatusDates", () => {
    const baseSession = {
      id: 1,
      treatmentId: 1,
      sessionNumber: 1,
      scheduledDate: "2024-01-15T09:00:00",
      status: "scheduled" as const,
      createdDate: "2000-01-01",
      createdTime: "00:00:00",
      updatedDate: "2000-01-01",
      updatedTime: "00:00:00",
      treatmentType: "physiotherapy" as const,
      bodyLocation: "Head",
      color: "Blue",
      plannedSessions: 3,
      completedSessions: 0,
      durationMinutes: 7,
    };

    it("filters and returns matching session dates joined by underscore", () => {
      const sessions = [
        {
          ...baseSession,
          id: 1,
          scheduledDate: "2024-01-20T09:00:00",
          status: "scheduled" as const,
        },
        {
          ...baseSession,
          id: 2,
          scheduledDate: "2024-01-15T09:00:00",
          status: "scheduled" as const,
        },
      ];
      const session = sessions[0];
      const result = getStatusDates(sessions, session, "scheduled");
      expect(result).toBe("2024-01-20_2024-01-15");
    });

    it("returns only date part for each match", () => {
      const sessions = [
        {
          ...baseSession,
          scheduledDate: "2024-02-01T14:00:00",
          status: "missed" as const,
        },
      ];
      const result = getStatusDates(sessions, sessions[0], "missed");
      expect(result).toBe("2024-02-01");
    });

    it("returns empty string when no matches", () => {
      const sessions = [{ ...baseSession, status: "completed" as const }];
      const result = getStatusDates(sessions, sessions[0], "missed");
      expect(result).toBe("");
    });
  });
});
