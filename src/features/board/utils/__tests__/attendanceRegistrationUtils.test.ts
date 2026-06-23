import {
  validateBasicInputs,
  validateDateSlot,
  getTreatmentDisplayName,
  isConflictError,
  buildNewPatientSchedulingFailureMessage,
  buildSchedulingFailureMessage,
} from "../attendanceRegistrationUtils";

jest.mock("@/api/day-finalization");
jest.mock("@/api/holidays");
jest.mock("@/api/attendances");
jest.mock("@/utils/apiTransformers");
jest.mock("@/utils/businessRules");

describe("attendanceRegistrationUtils", () => {
  describe("getTreatmentDisplayName", () => {
    it("returns correct display names for treatment types", () => {
      expect(getTreatmentDisplayName("assessment")).toBe("Assessment Consultation");
      expect(getTreatmentDisplayName("physiotherapy")).toBe("Physiotherapy");
      expect(getTreatmentDisplayName("tens")).toBe("TENS");
    });
  });

  describe("validateBasicInputs", () => {
    it("returns null when name and types are valid", () => {
      expect(validateBasicInputs("John Smith", ["assessment"])).toBeNull();
    });

    it("returns error when name is empty", () => {
      const result = validateBasicInputs("", ["assessment"]);
      expect(result).toContain("enter the patient name");
    });

    it("returns error when selected types is empty", () => {
      const result = validateBasicInputs("John", []);
      expect(result).toContain("select at least one attendance type");
    });

    it("returns error when both are invalid", () => {
      const result = validateBasicInputs("", []);
      expect(result).toContain("enter the patient name");
      expect(result).toContain("select at least one attendance type");
    });
  });

  describe("validateDateSlot", () => {
    it("returns null when showDateField is false", () => {
      expect(validateDateSlot(false, "Some error")).toBeNull();
    });

    it("returns null when dateSlotError is null", () => {
      expect(validateDateSlot(true, null)).toBeNull();
    });

    it("returns dateSlotError when both conditions are true", () => {
      const error = "No slots for Saturday";
      expect(validateDateSlot(true, error)).toBe(error);
    });
  });

  describe("isConflictError", () => {
    it("returns true for 409", () => {
      expect(isConflictError("Error 409")).toBe(true);
    });

    it("returns true for Conflict", () => {
      expect(isConflictError("Conflict detected")).toBe(true);
    });

    it("returns true for slot", () => {
      expect(isConflictError("slot unavailable")).toBe(true);
    });

    it("returns false for other errors", () => {
      expect(isConflictError("Patient not found")).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isConflictError(undefined)).toBe(false);
    });
  });

  describe("buildNewPatientSchedulingFailureMessage", () => {
    it("includes the reason in the message", () => {
      const msg = buildNewPatientSchedulingFailureMessage("schedule unavailable");
      expect(msg).toContain("PATIENT CREATED");
      expect(msg).toContain("schedule unavailable");
      expect(msg).toContain("Uncheck the 'New patient' option");
    });
  });

  describe("buildSchedulingFailureMessage", () => {
    it("returns conflict message when hasConflict is true", () => {
      const msg = buildSchedulingFailureMessage(2, true, "Original error");
      expect(msg).toContain("Scheduling conflict");
    });

    it("returns firstError when hasConflict is false and firstError exists", () => {
      const msg = buildSchedulingFailureMessage(2, false, "Original error");
      expect(msg).toBe("Original error");
    });

    it("returns generic message when no firstError", () => {
      const msg = buildSchedulingFailureMessage(3, false, undefined);
      expect(msg).toContain("Error creating 3 attendance(s)");
    });
  });
});
