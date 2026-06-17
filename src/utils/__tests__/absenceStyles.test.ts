import {
  getAbsenceStyles,
  getAbsenceStatus,
  isAbsence,
} from "../absenceStyles";

describe("absenceStyles", () => {
  describe("getAbsenceStyles", () => {
    it("returns red styling for missed status", () => {
      const styles = getAbsenceStyles("missed");

      expect(styles.containerClass).toBe("bg-red-50 border-red-300");
      expect(styles.textClass).toBe("text-gray-500 line-through");
      expect(styles.reasonBoxClass).toBe("bg-red-100");
      expect(styles.reasonBorderClass).toBe("border-red-500");
      expect(styles.iconColor).toBe("text-red-600");
      expect(styles.labelColor).toBe("text-red-600");
    });

    it("returns orange styling for cancelled status", () => {
      const styles = getAbsenceStyles("cancelled");

      expect(styles.containerClass).toBe("bg-orange-50 border-orange-300");
      expect(styles.textClass).toBe("text-gray-500 line-through");
      expect(styles.reasonBoxClass).toBe("bg-orange-100");
      expect(styles.reasonBorderClass).toBe("border-orange-500");
      expect(styles.iconColor).toBe("text-orange-600");
      expect(styles.labelColor).toBe("text-orange-600");
    });

    it("returns default styling for none status", () => {
      const styles = getAbsenceStyles("none");

      expect(styles.containerClass).toBe("bg-gray-50 border-gray-200");
      expect(styles.textClass).toBe("text-gray-900");
      expect(styles.dateClass).toBe("text-gray-900");
      expect(styles.treatmentClass).toBe("text-gray-600");
      expect(styles.reasonBoxClass).toBe("bg-white");
      expect(styles.reasonBorderClass).toBe("border-gray-500");
      expect(styles.iconColor).toBe("");
      expect(styles.labelColor).toBe("");
    });
  });

  describe("getAbsenceStatus", () => {
    it("returns 'missed' for missed status", () => {
      expect(getAbsenceStatus("missed")).toBe("missed");
    });

    it("returns 'cancelled' for cancelled status", () => {
      expect(getAbsenceStatus("cancelled")).toBe("cancelled");
    });

    it("returns 'none' for completed status", () => {
      expect(getAbsenceStatus("completed")).toBe("none");
    });

    it("returns 'none' for scheduled status", () => {
      expect(getAbsenceStatus("scheduled")).toBe("none");
    });

    it("returns 'none' for checked_in status", () => {
      expect(getAbsenceStatus("checked_in")).toBe("none");
    });
  });

  describe("isAbsence", () => {
    it("returns true for missed status", () => {
      expect(isAbsence("missed")).toBe(true);
    });

    it("returns true for cancelled status", () => {
      expect(isAbsence("cancelled")).toBe(true);
    });

    it("returns false for completed status", () => {
      expect(isAbsence("completed")).toBe(false);
    });

    it("returns false for scheduled status", () => {
      expect(isAbsence("scheduled")).toBe(false);
    });

    it("returns false for in_progress status", () => {
      expect(isAbsence("in_progress")).toBe(false);
    });
  });
});
