/**
 * scheduleTreatmentSlots utility tests
 */
import {
  getDayOfWeekFromDateString,
  hasSlotsForAssessmentOnDate,
  hasSlotsForTreatmentOnDate,
  getDateSlotError,
  getNextDateWithTreatmentSlots,
  hasInvalidTreatmentStartDates,
  TREATMENT_SLOTS_UNAVAILABLE_MESSAGE,
  ASSESSMENT_SLOTS_UNAVAILABLE_MESSAGE,
  ALL_TYPES_SLOTS_UNAVAILABLE_MESSAGE,
} from "../scheduleTreatmentSlots";

describe("scheduleTreatmentSlots", () => {
  const settingsAllActive = [
    { dayOfWeek: 0, isActive: true, maxConcurrentPhysiotherapyTens: 2 },
    { dayOfWeek: 1, isActive: true, maxConcurrentPhysiotherapyTens: 2 },
    { dayOfWeek: 2, isActive: true, maxConcurrentPhysiotherapyTens: 2 },
    { dayOfWeek: 3, isActive: true, maxConcurrentPhysiotherapyTens: 2 },
    { dayOfWeek: 4, isActive: true, maxConcurrentPhysiotherapyTens: 2 },
    { dayOfWeek: 5, isActive: true, maxConcurrentPhysiotherapyTens: 2 },
    { dayOfWeek: 6, isActive: true, maxConcurrentPhysiotherapyTens: 2 },
  ];

  describe("getDayOfWeekFromDateString", () => {
    it("returns 0 for Sunday", () => {
      expect(getDayOfWeekFromDateString("2024-01-07")).toBe(0);
    });
    it("returns 1 for Monday", () => {
      expect(getDayOfWeekFromDateString("2024-01-01")).toBe(1);
    });
  });

  describe("hasSlotsForAssessmentOnDate", () => {
    it("returns false when settings is null or empty", () => {
      expect(hasSlotsForAssessmentOnDate("2024-01-01", null)).toBe(false);
      expect(hasSlotsForAssessmentOnDate("2024-01-01", [])).toBe(false);
    });
    it("returns true when day has active setting with assessment slots", () => {
      const settings = [
        { dayOfWeek: 1, isActive: true, maxConcurrentAssessment: 2 },
      ];
      expect(hasSlotsForAssessmentOnDate("2024-01-01", settings)).toBe(true);
    });
    it("returns false when maxConcurrentAssessment is 0", () => {
      const settings = [
        { dayOfWeek: 1, isActive: true, maxConcurrentAssessment: 0 },
      ];
      expect(hasSlotsForAssessmentOnDate("2024-01-01", settings)).toBe(false);
    });
  });

  describe("hasSlotsForTreatmentOnDate", () => {
    it("returns false when settings is null or empty", () => {
      expect(hasSlotsForTreatmentOnDate("2024-01-01", null)).toBe(false);
      expect(hasSlotsForTreatmentOnDate("2024-01-01", [])).toBe(false);
    });
    it("returns true when day has active setting with slots", () => {
      expect(
        hasSlotsForTreatmentOnDate("2024-01-01", settingsAllActive),
      ).toBe(true);
    });
    it("returns false when day is inactive", () => {
      const settings = [
        ...settingsAllActive.slice(0, 1),
        { dayOfWeek: 1, isActive: false, maxConcurrentPhysiotherapyTens: 2 },
      ];
      expect(hasSlotsForTreatmentOnDate("2024-01-01", settings)).toBe(false);
    });
    it("returns false when maxConcurrentPhysiotherapyTens is 0", () => {
      const settings = [
        { dayOfWeek: 1, isActive: true, maxConcurrentPhysiotherapyTens: 0 },
      ];
      expect(hasSlotsForTreatmentOnDate("2024-01-01", settings)).toBe(false);
    });
  });

  describe("getDateSlotError", () => {
    const saturdayNoSlots = [
      { dayOfWeek: 6, isActive: true, maxConcurrentAssessment: 0, maxConcurrentPhysiotherapyTens: 0 },
    ];
    const mondayWithSlots = [
      { dayOfWeek: 1, isActive: true, maxConcurrentAssessment: 2, maxConcurrentPhysiotherapyTens: 2 },
    ];

    it("returns null when settings is empty", () => {
      expect(getDateSlotError("2024-01-06", ["assessment"], [])).toBeNull();
      expect(getDateSlotError("2024-01-06", ["assessment"], null)).toBeNull();
    });
    it("returns assessment message when assessment selected and no assessment slots", () => {
      expect(getDateSlotError("2024-01-06", ["assessment"], saturdayNoSlots)).toBe(
        ASSESSMENT_SLOTS_UNAVAILABLE_MESSAGE,
      );
    });
    it("returns treatment message when treatment selected and no treatment slots", () => {
      expect(getDateSlotError("2024-01-06", ["physiotherapy"], saturdayNoSlots)).toBe(
        TREATMENT_SLOTS_UNAVAILABLE_MESSAGE,
      );
    });
    it("returns combined message when both assessment and treatment selected and both invalid", () => {
      expect(
        getDateSlotError("2024-01-06", ["assessment", "physiotherapy"], saturdayNoSlots),
      ).toBe(ALL_TYPES_SLOTS_UNAVAILABLE_MESSAGE);
    });
    it("returns null when date has slots for selected types", () => {
      expect(getDateSlotError("2024-01-01", ["assessment"], mondayWithSlots)).toBeNull();
      expect(getDateSlotError("2024-01-01", ["physiotherapy"], mondayWithSlots)).toBeNull();
    });
  });

  describe("getNextDateWithTreatmentSlots", () => {
    it("returns same date when it has slots", () => {
      expect(
        getNextDateWithTreatmentSlots("2024-01-01", settingsAllActive),
      ).toBe("2024-01-01");
    });
    it("returns fromDate when settings is empty", () => {
      expect(getNextDateWithTreatmentSlots("2024-01-01", [])).toBe(
        "2024-01-01",
      );
    });
  });

  describe("hasInvalidTreatmentStartDates", () => {
    it("returns false when no treatments", () => {
      expect(
        hasInvalidTreatmentStartDates(
          settingsAllActive,
          undefined,
          undefined,
        ),
      ).toBe(false);
    });
    it("returns false when all start dates have slots", () => {
      expect(
        hasInvalidTreatmentStartDates(
          settingsAllActive,
          [{ startDate: "2024-01-01" }],
          [{ startDate: "2024-01-02" }],
        ),
      ).toBe(false);
    });
    it("returns true when a start date has no slots", () => {
      const noSlots = [
        { dayOfWeek: 1, isActive: true, maxConcurrentPhysiotherapyTens: 0 },
      ];
      expect(
        hasInvalidTreatmentStartDates(
          noSlots,
          [{ startDate: "2024-01-01" }],
          undefined,
        ),
      ).toBe(true);
    });
  });

  describe("TREATMENT_SLOTS_UNAVAILABLE_MESSAGE", () => {
    it("is a non-empty string", () => {
      expect(typeof TREATMENT_SLOTS_UNAVAILABLE_MESSAGE).toBe("string");
      expect(TREATMENT_SLOTS_UNAVAILABLE_MESSAGE.length).toBeGreaterThan(0);
      expect(TREATMENT_SLOTS_UNAVAILABLE_MESSAGE).toContain("Fisioterapia");
    });
  });

  describe("ASSESSMENT_SLOTS_UNAVAILABLE_MESSAGE", () => {
    it("is a non-empty string", () => {
      expect(typeof ASSESSMENT_SLOTS_UNAVAILABLE_MESSAGE).toBe("string");
      expect(ASSESSMENT_SLOTS_UNAVAILABLE_MESSAGE.length).toBeGreaterThan(0);
      expect(ASSESSMENT_SLOTS_UNAVAILABLE_MESSAGE).toContain("consulta");
    });
  });
});
