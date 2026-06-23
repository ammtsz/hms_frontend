import {
  countTreatmentTypes,
  getTreatmentCombinationColor,
  groupPatientsByTreatments,
  type IGroupedPatient
} from "../patientGrouping";

import type { AppointmentType } from "@/types/types";

import {
  createGroupingTestData,
  createMockAppointmentStatusDetail
} from "../testUtilities";

describe("patientGrouping", () => {
  describe("getTreatmentCombinationColor", () => {
    it("should return 'combined' when both physiotherapy and tens are present", () => {
      const treatmentTypes: AppointmentType[] = ['physiotherapy', 'tens'];
      const result = getTreatmentCombinationColor(treatmentTypes);
      expect(result).toBe('combined');
    });

    it("should return 'combined' when physiotherapy, tens, and assessment are present", () => {
      const treatmentTypes: AppointmentType[] = ['physiotherapy', 'tens', 'assessment'];
      const result = getTreatmentCombinationColor(treatmentTypes);
      expect(result).toBe('combined');
    });

    it("should return 'physiotherapy' when only physiotherapy is present", () => {
      const treatmentTypes: AppointmentType[] = ['physiotherapy'];
      const result = getTreatmentCombinationColor(treatmentTypes);
      expect(result).toBe('physiotherapy');
    });

    it("should return 'tens' when only tens is present", () => {
      const treatmentTypes: AppointmentType[] = ['tens'];
      const result = getTreatmentCombinationColor(treatmentTypes);
      expect(result).toBe('tens');
    });

    it("should return 'physiotherapy' when physiotherapy and assessment are present (no tens)", () => {
      const treatmentTypes: AppointmentType[] = ['physiotherapy', 'assessment'];
      const result = getTreatmentCombinationColor(treatmentTypes);
      expect(result).toBe('physiotherapy');
    });

    it("should return 'tens' when tens and assessment are present (no physiotherapy)", () => {
      const treatmentTypes: AppointmentType[] = ['tens', 'assessment'];
      const result = getTreatmentCombinationColor(treatmentTypes);
      expect(result).toBe('tens');
    });

    it("should return 'physiotherapy' as fallback when only assessment is present", () => {
      const treatmentTypes: AppointmentType[] = ['assessment'];
      const result = getTreatmentCombinationColor(treatmentTypes);
      expect(result).toBe('physiotherapy');
    });

    it("should return 'physiotherapy' as fallback when empty array is passed", () => {
      const treatmentTypes: AppointmentType[] = [];
      const result = getTreatmentCombinationColor(treatmentTypes);
      expect(result).toBe('physiotherapy');
    });

    it("should handle mixed treatment order consistently", () => {
      const treatmentTypes1: AppointmentType[] = ['physiotherapy', 'tens'];
      const treatmentTypes2: AppointmentType[] = ['tens', 'physiotherapy'];
      
      const result1 = getTreatmentCombinationColor(treatmentTypes1);
      const result2 = getTreatmentCombinationColor(treatmentTypes2);
      
      expect(result1).toBe('combined');
      expect(result2).toBe('combined');
      expect(result1).toBe(result2);
    });
  });

  describe("groupPatientsByTreatments", () => {
    it("should return empty array when both input arrays are empty", () => {
      const result = groupPatientsByTreatments([], []);
      expect(result).toEqual([]);
    });

    it("should group physiotherapy patients only", () => {
      const physiotherapyPatients = [
        createMockAppointmentStatusDetail({
          name: "Physiotherapy Patient",
          patientId: 1,
          appointmentId: 1,
        }),
      ];

      const result = groupPatientsByTreatments(physiotherapyPatients, []);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Physiotherapy Patient");
      expect(result[0].originalType).toBe('physiotherapy');
      expect(result[0].treatmentTypes).toEqual(['physiotherapy']);
      expect(result[0].combinedType).toBe('physiotherapy');
    });

    it("should group tens patients only", () => {
      const tensPatients = [
        createMockAppointmentStatusDetail({
          name: "TENS Patient",
          patientId: 2,
          appointmentId: 2,
        }),
      ];

      const result = groupPatientsByTreatments([], tensPatients);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("TENS Patient");
      expect(result[0].originalType).toBe('tens');
      expect(result[0].treatmentTypes).toEqual(['tens']);
      expect(result[0].combinedType).toBe('tens');
    });

    it("should combine patients with same patientId from different treatment types", () => {
      const { physiotherapyPatients, tensPatients } = createGroupingTestData();
      const result = groupPatientsByTreatments(physiotherapyPatients, tensPatients);
      
      // Should have 4 unique patients total: Patient One (combined), Patient Two, Patient Three, Patient Four
      expect(result).toHaveLength(4);
      
      // Find Patient One who should be combined
      const combinedPatient = result.find(p => p.name === "Patient One");
      expect(combinedPatient).toBeDefined();
      expect(combinedPatient?.treatmentTypes).toContain('physiotherapy');
      expect(combinedPatient?.treatmentTypes).toContain('tens');
      expect(combinedPatient?.treatmentTypes).toHaveLength(2);
      expect(combinedPatient?.combinedType).toBe('combined');
    });

    it("should preserve all patient properties when combining", () => {
      const physiotherapyPatient = createMockAppointmentStatusDetail({
        name: "John Doe",
        patientId: 1,
        appointmentId: 1,
        priority: "1",
        checkedInTime: "2024-01-15T10:00:00Z",
      });

      const tensPatient = createMockAppointmentStatusDetail({
        name: "John Doe",
        patientId: 1,
        appointmentId: 2,
        priority: "1",
        onGoingTime: "2024-01-15T11:00:00Z",
      });

      const result = groupPatientsByTreatments([physiotherapyPatient], [tensPatient]);
      
      expect(result).toHaveLength(1);
      const combinedPatient = result[0];
      
      // Should preserve all original properties
      expect(combinedPatient.name).toBe("John Doe");
      expect(combinedPatient.patientId).toBe(1);
      expect(combinedPatient.priority).toBe("1");
      expect(combinedPatient.checkedInTime).toBe("2024-01-15T10:00:00Z");
      
      // Should have combined treatment information
      expect(combinedPatient.treatmentTypes).toEqual(['physiotherapy', 'tens']);
      expect(combinedPatient.combinedType).toBe('combined');
      expect(combinedPatient.originalType).toBe('physiotherapy'); // First one encountered
    });

    it("should handle patients without patientId gracefully", () => {
      const physiotherapyPatients = [
        createMockAppointmentStatusDetail({
          name: "No ID Patient",
          patientId: undefined,
          appointmentId: 1,
        }),
      ];

      const tensPatients = [
        createMockAppointmentStatusDetail({
          name: "Valid Patient",
          patientId: 2,
          appointmentId: 2,
        }),
      ];

      const result = groupPatientsByTreatments(physiotherapyPatients, tensPatients);
      
      // Should only include the patient with a valid patientId
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Valid Patient");
      expect(result[0].patientId).toBe(2);
    });

    it("should handle multiple patients with same treatment type", () => {
      const physiotherapyPatients = [
        createMockAppointmentStatusDetail({
          name: "Patient A",
          patientId: 1,
          appointmentId: 1,
        }),
        createMockAppointmentStatusDetail({
          name: "Patient B",
          patientId: 2,
          appointmentId: 2,
        }),
      ];

      const tensPatients = [
        createMockAppointmentStatusDetail({
          name: "Patient C",
          patientId: 3,
          appointmentId: 3,
        }),
      ];

      const result = groupPatientsByTreatments(physiotherapyPatients, tensPatients);
      
      expect(result).toHaveLength(3);
      
      const physiotherapyA = result.find(p => p.name === "Patient A");
      const physiotherapyB = result.find(p => p.name === "Patient B");
      const tensC = result.find(p => p.name === "Patient C");
      
      expect(physiotherapyA?.treatmentTypes).toEqual(['physiotherapy']);
      expect(physiotherapyB?.treatmentTypes).toEqual(['physiotherapy']);
      expect(tensC?.treatmentTypes).toEqual(['tens']);
    });

    it("should maintain correct originalType when tens patient is added first", () => {
      const physiotherapyPatients = [
        createMockAppointmentStatusDetail({
          name: "Combined Patient",
          patientId: 1,
          appointmentId: 2,
        }),
      ];

      const tensPatients = [
        createMockAppointmentStatusDetail({
          name: "Combined Patient",
          patientId: 1,
          appointmentId: 1,
        }),
      ];

      const result = groupPatientsByTreatments(physiotherapyPatients, tensPatients);
      
      expect(result).toHaveLength(1);
      
      // Since physiotherapy is processed first, originalType should be physiotherapy
      expect(result[0].originalType).toBe('physiotherapy');
      expect(result[0].treatmentTypes).toEqual(['physiotherapy', 'tens']);
      expect(result[0].combinedType).toBe('combined');
    });

    it("should handle complex scenario with multiple combinations", () => {
      const physiotherapyPatients = [
        createMockAppointmentStatusDetail({
          name: "Only Physiotherapy",
          patientId: 1,
        }),
        createMockAppointmentStatusDetail({
          name: "Combined A",
          patientId: 2,
        }),
        createMockAppointmentStatusDetail({
          name: "Combined B",
          patientId: 3,
        }),
      ];

      const tensPatients = [
        createMockAppointmentStatusDetail({
          name: "Combined A", // Same patient as physiotherapy
          patientId: 2,
        }),
        createMockAppointmentStatusDetail({
          name: "Combined B", // Same patient as physiotherapy
          patientId: 3,
        }),
        createMockAppointmentStatusDetail({
          name: "Only TENS",
          patientId: 4,
        }),
      ];

      const result = groupPatientsByTreatments(physiotherapyPatients, tensPatients);
      
      expect(result).toHaveLength(4);
      
      const onlyPhysiotherapy = result.find(p => p.patientId === 1);
      const combinedA = result.find(p => p.patientId === 2);
      const combinedB = result.find(p => p.patientId === 3);
      const onlyTens = result.find(p => p.patientId === 4);
      
      expect(onlyPhysiotherapy?.combinedType).toBe('physiotherapy');
      expect(combinedA?.combinedType).toBe('combined');
      expect(combinedB?.combinedType).toBe('combined');
      expect(onlyTens?.combinedType).toBe('tens');
    });
  });

  describe("countTreatmentTypes", () => {
    it("should count multiple physiotherapy appointments on one card", () => {
      const treatmentTypes: AppointmentType[] = [
        "physiotherapy",
        "physiotherapy",
        "physiotherapy",
      ];
      expect(countTreatmentTypes(treatmentTypes)).toEqual({
        physiotherapy: 3,
        tens: 0,
      });
    });

    it("should count physiotherapy and tens separately", () => {
      const treatmentTypes: AppointmentType[] = [
        "physiotherapy",
        "tens",
        "physiotherapy",
      ];
      expect(countTreatmentTypes(treatmentTypes)).toEqual({
        physiotherapy: 2,
        tens: 1,
      });
    });

    it("should return zero counts for empty treatment types", () => {
      expect(countTreatmentTypes([])).toEqual({ physiotherapy: 0, tens: 0 });
    });
  });

  describe("IGroupedPatient interface", () => {
    it("should extend AppointmentStatusDetail with additional properties", () => {
      const { physiotherapyPatients, tensPatients } = createGroupingTestData();
      const result = groupPatientsByTreatments(physiotherapyPatients, tensPatients);
      
      if (result.length > 0) {
        const groupedPatient: IGroupedPatient = result[0];
        
        // Should have all AppointmentStatusDetail properties
        expect(groupedPatient.name).toBeDefined();
        expect(groupedPatient.priority).toBeDefined();
        expect(groupedPatient.patientId).toBeDefined();
        expect(groupedPatient.appointmentId).toBeDefined();
        
        // Should have the additional grouping properties
        expect(groupedPatient.originalType).toBeDefined();
        expect(groupedPatient.treatmentTypes).toBeDefined();
        expect(groupedPatient.combinedType).toBeDefined();
        
        // Type checks
        expect(Array.isArray(groupedPatient.treatmentTypes)).toBe(true);
        expect(['physiotherapy', 'tens', 'combined']).toContain(groupedPatient.combinedType);
        expect(['assessment', 'physiotherapy', 'tens']).toContain(groupedPatient.originalType);
      }
    });
  });

  describe("Integration tests", () => {
    it("should keep combinedType consistent with treatment combination color", () => {
      const { physiotherapyPatients, tensPatients } = createGroupingTestData();
      const groupedPatients = groupPatientsByTreatments(physiotherapyPatients, tensPatients);

      groupedPatients.forEach((patient) => {
        const color = getTreatmentCombinationColor(patient.treatmentTypes);
        expect(patient.combinedType).toBe(color);

        if (
          patient.treatmentTypes.includes("physiotherapy") &&
          patient.treatmentTypes.includes("tens")
        ) {
          expect(color).toBe("combined");
        } else if (patient.treatmentTypes.includes("physiotherapy")) {
          expect(color).toBe("physiotherapy");
        } else if (patient.treatmentTypes.includes("tens")) {
          expect(color).toBe("tens");
        }
      });
    });
  });
});