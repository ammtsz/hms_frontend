import { formatBlockedTreatmentTypes } from "../holidayDisplayUtils";
import { getAttendanceTypeLabel } from "@/utils/apiTransformers";

describe("holidayDisplayUtils", () => {
  describe("formatBlockedTreatmentTypes", () => {
    it("returns all treatment labels when blocked types are unset", () => {
      expect(formatBlockedTreatmentTypes()).toBe(
        [
          getAttendanceTypeLabel("assessment"),
          getAttendanceTypeLabel("physiotherapy"),
          getAttendanceTypeLabel("tens"),
        ].join(", "),
      );
    });

    it("returns selected treatment labels in order", () => {
      expect(formatBlockedTreatmentTypes(["assessment", "physiotherapy"])).toBe(
        `${getAttendanceTypeLabel("assessment")}, ${getAttendanceTypeLabel("physiotherapy")}`,
      );
    });
  });
});
