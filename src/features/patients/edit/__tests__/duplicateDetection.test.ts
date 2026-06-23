import { checkForDuplicatePatients } from "../utils/duplicateDetection";
import { PatientBasic } from "@/types/types";

describe("duplicateDetection", () => {
  const mockPatients: PatientBasic[] = [
    {
      id: "1",
      name: "John Smith",
      phone: "(555) 321-6547",
      priority: "3",
      status: "T",
    },
    {
      id: "2",
      name: "Emily Williams",
      phone: "(718) 234-5678",
      priority: "2",
      status: "N",
    },
    {
      id: "3",
      name: "John Williams",
      phone: "(555) 321-6547",
      priority: "3",
      status: "T",
    },
  ];

  it("should find exact name match", () => {
    const duplicates = checkForDuplicatePatients(
      mockPatients,
      "John Smith",
      "(999) 888-7777",
      "999"
    );

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].id).toBe("1");
    expect(duplicates[0].name).toBe("John Smith");
  });

  it("should find exact phone match", () => {
    const duplicates = checkForDuplicatePatients(
      mockPatients,
      "Different Name",
      "(555) 321-6547",
      "999"
    );

    expect(duplicates.length).toBeGreaterThanOrEqual(1);
    expect(duplicates.some((d) => d.phone === "(555) 321-6547")).toBe(true);
  });

  it("should be case insensitive for names", () => {
    const duplicates = checkForDuplicatePatients(
      mockPatients,
      "john smith",
      "(999) 888-7777",
      "999"
    );

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].id).toBe("1");
  });

  it("should ignore accents in names", () => {
    const duplicates = checkForDuplicatePatients(
      mockPatients,
      "Jöhn Smith",
      "(999) 888-7777",
      "999"
    );

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].id).toBe("1");
  });

  it("should normalize phone numbers (remove formatting)", () => {
    const duplicates = checkForDuplicatePatients(
      mockPatients,
      "Different Name",
      "5553216547", // Without formatting
      "999"
    );

    expect(duplicates.length).toBeGreaterThanOrEqual(1);
  });

  it("should exclude current patient from results", () => {
    const duplicates = checkForDuplicatePatients(
      mockPatients,
      "John Smith",
      "(555) 321-6547",
      "1" // Current patient ID
    );

    // Should not include patient with ID "1"
    expect(duplicates.every((d) => d.id !== "1")).toBe(true);
  });

  it("should find similar names (fuzzy matching)", () => {
    const duplicates = checkForDuplicatePatients(
      mockPatients,
      "Jon Smith", // Missing letter (fuzzy match)
      "(999) 888-7777",
      "999"
    );

    expect(duplicates.length).toBeGreaterThan(0);
  });

  it("should return empty array when no duplicates found", () => {
    const duplicates = checkForDuplicatePatients(
      mockPatients,
      "Completely Different Name",
      "(000) 000-0000",
      "999"
    );

    expect(duplicates).toHaveLength(0);
  });

  it("should handle empty patient list", () => {
    const duplicates = checkForDuplicatePatients(
      [],
      "John Smith",
      "(555) 321-6547",
      "999"
    );

    expect(duplicates).toHaveLength(0);
  });

  it("should handle patients without phone", () => {
    const patientsWithoutPhone: PatientBasic[] = [
      {
        id: "4",
        name: "John Smith",
        phone: "",
        priority: "3",
        status: "T",
      },
    ];

    const duplicates = checkForDuplicatePatients(
      patientsWithoutPhone,
      "John Smith",
      "",
      "999"
    );

    // Should still find by name
    expect(duplicates.length).toBeGreaterThan(0);
  });

  it("should return patient details in correct format", () => {
    const duplicates = checkForDuplicatePatients(
      mockPatients,
      "John Smith",
      "(555) 321-6547",
      "999"
    );

    expect(duplicates[0]).toHaveProperty("id");
    expect(duplicates[0]).toHaveProperty("name");
    expect(duplicates[0]).toHaveProperty("phone");
    expect(duplicates[0]).toHaveProperty("priority");
    expect(duplicates[0]).toHaveProperty("status");
  });

  it("should find multiple duplicates", () => {
    // Both patients have the same phone
    const duplicates = checkForDuplicatePatients(
      mockPatients,
      "New Patient",
      "(555) 321-6547",
      "999"
    );

    // Should find both John Smith and John Smith
    expect(duplicates.length).toBeGreaterThanOrEqual(2);
  });

  it("should handle very short names without fuzzy matching", () => {
    const duplicates = checkForDuplicatePatients(
      mockPatients,
      "Jo",
      "(999) 888-7777",
      "999"
    );

    // Should not do fuzzy matching for very short names
    expect(duplicates).toHaveLength(0);
  });

  it("should trim whitespace from names", () => {
    const duplicates = checkForDuplicatePatients(
      mockPatients,
      "  John Smith  ", // With whitespace
      "(999) 888-7777",
      "999"
    );

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].id).toBe("1");
  });
});
