import {
  getStatusConfig,
  getTreatmentTypeLabel,
  ATTENDANCE_HISTORY_STATUS_LABELS,
} from "../utils";
import { getAttendanceTypeLabel } from "@/utils/apiTransformers";

describe("AttendanceHistory Utils", () => {
  describe("getStatusConfig", () => {
    it("should return correct config for missed status", () => {
      const config = getStatusConfig("missed");

      expect(config.label).toBe(ATTENDANCE_HISTORY_STATUS_LABELS.missed);
      expect(config.badgeClass).toContain("bg-red-100");
      expect(config.badgeClass).toContain("text-red-800");
      expect(config.badgeClass).toContain("border-red-300");
      expect(config.borderColor).toBe("border border-gray-50");
      expect(config.icon).not.toBeNull();
    });

    it("should return correct config for cancelled status", () => {
      const config = getStatusConfig("cancelled");

      expect(config.label).toBe(ATTENDANCE_HISTORY_STATUS_LABELS.cancelled);
      expect(config.badgeClass).toContain("bg-orange-100");
      expect(config.badgeClass).toContain("text-orange-800");
      expect(config.badgeClass).toContain("border-orange-300");
      expect(config.borderColor).toBe("border border-gray-50");
      expect(config.icon).not.toBeNull();
    });

    it("should return correct config for completed status", () => {
      const config = getStatusConfig("completed");

      expect(config.label).toBe(ATTENDANCE_HISTORY_STATUS_LABELS.completed);
      expect(config.badgeClass).toContain("bg-green-100");
      expect(config.badgeClass).toContain("text-green-800");
      expect(config.badgeClass).toContain("border-green-300");
      expect(config.borderColor).toBe("border-gray-200");
      expect(config.icon).toBeNull();
    });

    it("should return completed config for undefined status", () => {
      const config = getStatusConfig(undefined);

      expect(config.label).toBe(ATTENDANCE_HISTORY_STATUS_LABELS.completed);
      expect(config.badgeClass).toContain("bg-green-100");
      expect(config.borderColor).toBe("border-gray-200");
      expect(config.icon).toBeNull();
    });

    it("should return completed config for unknown status", () => {
      const config = getStatusConfig("unknown");

      expect(config.label).toBe(ATTENDANCE_HISTORY_STATUS_LABELS.completed);
      expect(config.badgeClass).toContain("bg-green-100");
      expect(config.borderColor).toBe("border-gray-200");
      expect(config.icon).toBeNull();
    });
  });

  describe("getTreatmentTypeLabel", () => {
    it("should return Assessment Consultation when only assessment is true", () => {
      const label = getTreatmentTypeLabel(true, false, false);
      expect(label).toBe(getAttendanceTypeLabel("assessment"));
    });

    it("should return Assessment Consultation and Physiotherapy when assessment and physiotherapy", () => {
      const label = getTreatmentTypeLabel(true, true, false);
      expect(label).toBe(
        `${getAttendanceTypeLabel("assessment")} and ${getAttendanceTypeLabel("physiotherapy")}`,
      );
    });

    it("should return Assessment Consultation and TENS when assessment and tens", () => {
      const label = getTreatmentTypeLabel(true, false, true);
      expect(label).toBe(
        `${getAttendanceTypeLabel("assessment")} and ${getAttendanceTypeLabel("tens")}`,
      );
    });

    it("should return Assessment Consultation, Physiotherapy and TENS when all three treatments exist", () => {
      const label = getTreatmentTypeLabel(true, true, true);
      expect(label).toBe(
        `${getAttendanceTypeLabel("assessment")}, ${getAttendanceTypeLabel("physiotherapy")} and ${getAttendanceTypeLabel("tens")}`,
      );
    });

    it("should return Physiotherapy and TENS when both physical treatments exist", () => {
      const label = getTreatmentTypeLabel(false, true, true);
      expect(label).toBe(
        `${getAttendanceTypeLabel("physiotherapy")} and ${getAttendanceTypeLabel("tens")}`,
      );
    });

    it("should return Physiotherapy when only physiotherapy exists", () => {
      const label = getTreatmentTypeLabel(false, true, false);
      expect(label).toBe(getAttendanceTypeLabel("physiotherapy"));
    });

    it("should return TENS when only tens exists", () => {
      const label = getTreatmentTypeLabel(false, false, true);
      expect(label).toBe(getAttendanceTypeLabel("tens"));
    });

    it("should return not specified when no treatment exists", () => {
      const label = getTreatmentTypeLabel(false, false, false);
      expect(label).toBe("Not specified");
    });
  });
});
