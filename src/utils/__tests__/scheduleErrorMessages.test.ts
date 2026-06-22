/**
 * scheduleErrorMessages utility tests
 */
import {
  DAY_NAMES_EN,
  getNoScheduleReasonForNewPatient,
} from "../scheduleErrorMessages";

describe("scheduleErrorMessages", () => {
  describe("DAY_NAMES_PT", () => {
    it("has 7 day names (Sunday to Saturday)", () => {
      expect(DAY_NAMES_EN).toHaveLength(7);
      expect(DAY_NAMES_EN[0]).toBe("Sunday");
      expect(DAY_NAMES_EN[6]).toBe("Saturday");
    });
  });

  describe("getNoScheduleReasonForNewPatient", () => {
    it("returns null when error does not match scheduling settings pattern", () => {
      expect(getNoScheduleReasonForNewPatient("Patient not found")).toBeNull();
      expect(getNoScheduleReasonForNewPatient("Network error")).toBeNull();
    });

    it("returns friendly reason with day name when error contains 'day N' and scheduling pattern", () => {
      expect(
        getNoScheduleReasonForNewPatient("scheduling settings for day 0")
      ).toBe("there are no appointments on Sunday");
      expect(
        getNoScheduleReasonForNewPatient("No schedule configuration day 1")
      ).toBe("there are no appointments on Monday");
      expect(
        getNoScheduleReasonForNewPatient("scheduling settings day 6")
      ).toBe("there are no appointments on Saturday");
    });

    it("matches 'day N' case-insensitively", () => {
      expect(
        getNoScheduleReasonForNewPatient("scheduling settings DAY 2")
      ).toBe("there are no appointments on Tuesday");
    });

    it("returns generic message when pattern matches but no valid day number", () => {
      expect(
        getNoScheduleReasonForNewPatient("No schedule configuration")
      ).toBe("there are no appointments for the selected day");
    });

    it("returns generic message when day number is out of range", () => {
      expect(
        getNoScheduleReasonForNewPatient("scheduling settings day 7")
      ).toBe("there are no appointments for the selected day");
    });
  });
});
