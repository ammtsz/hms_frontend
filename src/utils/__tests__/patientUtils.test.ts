import {
  getTreatmentStatusLabel,
  validatePatientData,
  calculateAge,
} from "@/utils/patientUtils";

describe("patientUtils", () => {
  describe("validatePatientData", () => {
    it("should validate correct patient data", () => {
      const result = validatePatientData({
        name: "John Smith",
        phone: "11999999999",
        birthDate: "1990-01-01",
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should reject empty name", () => {
      const result = validatePatientData({
        name: "",
        birthDate: "1990-01-01",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Name is required");
    });

    it("should reject name with only whitespace", () => {
      const result = validatePatientData({
        name: "   ",
        birthDate: "1990-01-01",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Name is required");
    });

    it("should reject name too short", () => {
      const result = validatePatientData({
        name: "J",
        birthDate: "1990-01-01",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Name must be at least 2 characters long",
      );
    });

    it("should accept valid phone number", () => {
      const result = validatePatientData({
        name: "John Smith",
        phone: "11999999999",
        birthDate: "1990-01-01",
      });

      expect(result.isValid).toBe(true);
    });

    it("should reject invalid phone number", () => {
      const result = validatePatientData({
        name: "John Smith",
        phone: "123",
        birthDate: "1990-01-01",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Phone number must be 10-15 digits");
    });

    it("should accept phone with formatting characters", () => {
      const result = validatePatientData({
        name: "John Smith",
        phone: "(11) 99999-9999",
        birthDate: "1990-01-01",
      });

      expect(result.isValid).toBe(true);
    });

    it("should allow empty phone", () => {
      const result = validatePatientData({
        name: "John Smith",
        birthDate: "1990-01-01",
      });

      expect(result.isValid).toBe(true);
    });

    it("should reject future birth date", () => {
      const currentYear = new Date().getFullYear();
      const futureDate = `${currentYear + 1}-01-01`;

      const result = validatePatientData({
        name: "John Smith",
        birthDate: futureDate,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Birth date cannot be in the future");
    });

    it("should reject birth date too far in past", () => {
      const currentYear = new Date().getFullYear();
      const ancientDate = `${currentYear - 150}-01-01`;

      const result = validatePatientData({
        name: "John Smith",
        birthDate: ancientDate,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Birth date is too far in the past");
    });

    it("should accumulate multiple errors", () => {
      const currentYear = new Date().getFullYear();
      const futureDate = `${currentYear + 1}-01-01`;

      const result = validatePatientData({
        name: "",
        phone: "123",
        birthDate: futureDate,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain("Name is required");
      expect(result.errors).toContain("Phone number must be 10-15 digits");
      expect(result.errors).toContain("Birth date cannot be in the future");
    });
  });

  describe("calculateAge", () => {
    beforeEach(() => {
      // Mock current date to November 28, 2025 for consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2025-11-28T00:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should calculate age correctly", () => {
      const birthDate = "1990-01-01";
      const age = calculateAge(birthDate);
      expect(age).toBe(35);
    });

    it("should handle birthday not yet reached this year", () => {
      const birthDate = "1990-12-01";
      const age = calculateAge(birthDate);
      expect(age).toBe(34); // Birthday hasn't occurred yet in 2025
    });

    it("should handle birthday already passed this year", () => {
      const birthDate = "1990-06-15";
      const age = calculateAge(birthDate);
      expect(age).toBe(35); // Birthday already occurred in 2025
    });

    it("should handle same month, day not reached", () => {
      const birthDate = "1990-11-30"; // Same month but day 30, current is 28
      const age = calculateAge(birthDate);
      expect(age).toBe(34); // Day hasn't been reached yet
    });

    it("should handle same month, day reached", () => {
      const birthDate = "1990-11-15"; // Same month but day 15, current is 28
      const age = calculateAge(birthDate);
      expect(age).toBe(35); // Day already passed
    });
  });

  describe("getTreatmentStatusLabel", () => {
    it("should return correct treatment status labels", () => {
      expect(getTreatmentStatusLabel("N")).toBe("New patient");
      expect(getTreatmentStatusLabel("T")).toBe("In Treatment");
      expect(getTreatmentStatusLabel("A")).toBe("Discharged");
      expect(getTreatmentStatusLabel("F")).toBe("Missed — consecutive");
      expect(getTreatmentStatusLabel("unknown")).toBe("unknown");
    });
  });
});
