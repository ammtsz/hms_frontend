/**
 * TreatmentRecommendationTable.utils unit tests
 */

import {
  normalizeString,
  clampTreatmentQuantity,
  getDefaultTreatmentStartDate,
  createNewTreatmentRow,
  getBlockedLocationsForRow,
  enforceUniqueLocationsForRow,
  getAvailableLocationsForRow,
  findInactiveOptionByValue,
} from "../TreatmentRecommendationTable.utils";
import type { LocationTreatment } from "@/types/treatment";
import {
  DEFAULT_PHYSIOTHERAPY_DURATION_MINUTES,
  DEFAULT_TENS_DURATION_MINUTES,
} from "@/constants/treatment";

jest.mock("@/utils/timezoneDate", () => {
  const actual = jest.requireActual<typeof import("@/utils/timezoneDate")>(
    "@/utils/timezoneDate",
  );
  return {
    ...actual,
    getTodayClinic: () => "2025-01-20",
  };
});

jest.mock("@/api/query/hooks/useScheduleSettingQueries", () => ({
  getNextDateWithTreatmentSlots: (date: string) => {
    if (date === "2025-01-21") return "2025-01-22";
    return date;
  },
}));

describe("TreatmentRecommendationTable.utils", () => {
  describe("normalizeString", () => {
    it("lowercases and trims", () => {
      expect(normalizeString("  HEAD  ")).toBe("head");
    });
    it("handles already normal", () => {
      expect(normalizeString("Chest")).toBe("chest");
    });
  });

  describe("clampTreatmentQuantity", () => {
    it("returns value when between 1 and 50", () => {
      expect(clampTreatmentQuantity(10)).toBe(10);
      expect(clampTreatmentQuantity(1)).toBe(1);
      expect(clampTreatmentQuantity(50)).toBe(50);
    });
    it("returns fallback when value < 1", () => {
      expect(clampTreatmentQuantity(0, 1)).toBe(1);
      expect(clampTreatmentQuantity(-1, 5)).toBe(5);
    });
    it("returns fallback when value > 50", () => {
      expect(clampTreatmentQuantity(51, 1)).toBe(1);
    });
    it("returns fallback when value is NaN or not a number", () => {
      expect(clampTreatmentQuantity(undefined, 1)).toBe(1);
      expect(clampTreatmentQuantity(Number.NaN, 1)).toBe(1);
    });
    it("uses default fallback 1", () => {
      expect(clampTreatmentQuantity(0)).toBe(1);
    });
  });

  describe("getDefaultTreatmentStartDate", () => {
    const scheduleSettings = [
      {
        id: 1,
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "18:00",
        maxConcurrentAssessment: 2,
        maxConcurrentPhysiotherapyTens: 2,
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];

    it("in edit mode returns first treatment start date", () => {
      const treatments: LocationTreatment[] = [
        {
          locations: [],
          duration: 45,
          quantity: 1,
          startDate: "2025-02-01",
        },
      ];
      expect(
        getDefaultTreatmentStartDate({
          isEditMode: true,
          treatments,
          scheduleSettings,
        }),
      ).toBe("2025-02-01");
    });

    it("in create mode with existing treatments returns last treatment start date", () => {
      const treatments: LocationTreatment[] = [
        {
          locations: [],
          duration: 45,
          quantity: 1,
          startDate: "2025-02-01",
        },
        {
          locations: [],
          duration: 45,
          quantity: 1,
          startDate: "2025-02-10",
        },
      ];
      expect(
        getDefaultTreatmentStartDate({
          isEditMode: false,
          treatments,
          scheduleSettings,
        }),
      ).toBe("2025-02-10");
    });

    it("uses defaultStartDate when no treatments", () => {
      expect(
        getDefaultTreatmentStartDate({
          isEditMode: false,
          treatments: [],
          scheduleSettings,
          defaultStartDate: "2025-03-01",
        }),
      ).toBe("2025-03-01");
    });

    it("uses getNextDateWithTreatmentSlots when no treatments and no defaultStartDate", () => {
      const result = getDefaultTreatmentStartDate({
        isEditMode: false,
        treatments: [],
        scheduleSettings,
      });
      expect(result).toBe("2025-01-22");
    });
  });

  describe("createNewTreatmentRow", () => {
    const scheduleSettings = null;

    it("creates physiotherapy row with defaults in create mode", () => {
      const row = createNewTreatmentRow({
        treatmentType: "physiotherapy",
        treatments: [],
        defaultQuantity: 2,
        isEditMode: false,
        scheduleSettings,
      });
      expect(row).toMatchObject({
        locations: [],
        duration: DEFAULT_PHYSIOTHERAPY_DURATION_MINUTES,
        quantity: 2,
      });
      expect(row.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("creates physiotherapy row in edit mode reusing first row duration", () => {
      const treatments: LocationTreatment[] = [
        {
          locations: ["Head"],
          duration: 60,
          quantity: 5,
          startDate: "2025-01-15",
        },
      ];
      const row = createNewTreatmentRow({
        treatmentType: "physiotherapy",
        treatments,
        defaultQuantity: 1,
        isEditMode: true,
        scheduleSettings,
      });
      expect(row.duration).toBe(60);
    });

    it("creates tens row with default duration", () => {
      const row = createNewTreatmentRow({
        treatmentType: "tens",
        treatments: [],
        defaultQuantity: 3,
        isEditMode: false,
        scheduleSettings,
      });
      expect(row).toMatchObject({
        locations: [],
        duration: DEFAULT_TENS_DURATION_MINUTES,
        quantity: 3,
      });
    });
  });

  describe("getBlockedLocationsForRow", () => {
    it("blocks locations used in other rows", () => {
      const treatments: LocationTreatment[] = [
        { locations: ["Head"], duration: 45, quantity: 1, startDate: "2025-01-01" },
        { locations: ["Chest"], duration: 45, quantity: 1, startDate: "2025-01-01" },
        { locations: ["Leg"], duration: 30, quantity: 1, startDate: "2025-01-01" },
      ];
      const blocked = getBlockedLocationsForRow({
        rowIndex: 0,
        treatments,
      });
      expect(blocked.has("chest")).toBe(true);
      expect(blocked.has("leg")).toBe(true);
      expect(blocked.has("head")).toBe(false);
    });
  });

  describe("enforceUniqueLocationsForRow", () => {
    it("removes locations that are blocked", () => {
      const treatments: LocationTreatment[] = [
        {
          locations: ["Head", "Chest"],
          duration: 30,
          quantity: 1,
          startDate: "2025-01-01",
        },
        {
          locations: ["Chest"],
          duration: 30,
          quantity: 1,
          startDate: "2025-01-01",
        },
      ];
      const result = enforceUniqueLocationsForRow({
        rowIndex: 0,
        treatments,
      });
      expect(result[0].locations).toEqual(["Head"]);
      expect(result[1].locations).toEqual(["Chest"]);
    });

    it("returns same content when no duplicates", () => {
      const treatments: LocationTreatment[] = [
        {
          locations: ["Head"],
          duration: 45,
          quantity: 1,
          startDate: "2025-01-01",
        },
      ];
      const result = enforceUniqueLocationsForRow({
        rowIndex: 0,
        treatments,
      });
      expect(result).toHaveLength(1);
      expect(result[0].locations).toEqual(["Head"]);
    });
  });

  describe("getAvailableLocationsForRow", () => {
    it("filters out blocked locations", () => {
      const active = ["Head", "Chest", "Leg"];
      const blocked = new Set(["chest", "leg"]);
      expect(
        getAvailableLocationsForRow({
          activeLocations: active,
          blockedLocations: blocked,
        }),
      ).toEqual(["Head"]);
    });
    it("filters out blocked locations using normalized comparison", () => {
      const active = ["Head", "Chest"];
      const blocked = new Set(["chest"]);
      expect(
        getAvailableLocationsForRow({
          activeLocations: active,
          blockedLocations: blocked,
        }),
      ).toEqual(["Head"]);
    });
  });

  describe("findInactiveOptionByValue", () => {
    const options = [
      { isActive: true, value: "Head" },
      { isActive: false, value: "Chest" },
      { isActive: false, value: "Leg" },
    ];

    it("returns inactive option matching value (case-insensitive)", () => {
      expect(findInactiveOptionByValue(options, "chest")).toEqual({
        isActive: false,
        value: "Chest",
      });
      expect(findInactiveOptionByValue(options, "  CHEST  ")).toEqual({
        isActive: false,
        value: "Chest",
      });
    });
    it("returns undefined for active option", () => {
      expect(findInactiveOptionByValue(options, "Head")).toBeUndefined();
    });
    it("returns undefined when no match", () => {
      expect(findInactiveOptionByValue(options, "Left Arm")).toBeUndefined();
    });
  });
});
