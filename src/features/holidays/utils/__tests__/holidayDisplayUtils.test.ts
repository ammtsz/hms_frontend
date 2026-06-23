import { formatBlockedTreatmentTypes } from "../holidayDisplayUtils";
import { getAppointmentTypeLabel } from "@/utils/apiTransformers";

describe("holidayDisplayUtils", () => {
  describe("formatBlockedTreatmentTypes", () => {
    it("returns all treatment labels when blocked types are unset", () => {
      expect(formatBlockedTreatmentTypes()).toBe(
        [
          getAppointmentTypeLabel("assessment"),
          getAppointmentTypeLabel("physiotherapy"),
          getAppointmentTypeLabel("tens"),
        ].join(", "),
      );
    });

    it("returns selected treatment labels in order", () => {
      expect(formatBlockedTreatmentTypes(["assessment", "physiotherapy"])).toBe(
        `${getAppointmentTypeLabel("assessment")}, ${getAppointmentTypeLabel("physiotherapy")}`,
      );
    });
  });
});
