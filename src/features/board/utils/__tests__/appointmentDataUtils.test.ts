import {
  getIncompleteAppointments,
  getCompletedAppointments,
  getScheduledAbsences,
  hasAppointmentsOnDate,
  getDefaultCollapsedForDate,
  ALL_SECTIONS_COLLAPSED,
  type IAppointmentStatusDetailWithType
} from "../appointmentDataUtils";

import {
  createSampleAppointmentData,
  createEmptyAppointmentData,
  createMockAppointmentsByDate,
  createMockAppointmentStatusDetail
} from "../testUtilities";

describe("appointmentDataUtils", () => {
  describe("getIncompleteAppointments", () => {
    it("should return empty array when appointmentsByDate is null", () => {
      const result = getIncompleteAppointments(null);
      expect(result).toEqual([]);
    });

    it("should return empty array when appointmentsByDate is undefined", () => {
      const result = getIncompleteAppointments(undefined!);
      expect(result).toEqual([]);
    });

    it("should return empty array when no incomplete appointments exist", () => {
      const emptyData = createEmptyAppointmentData();
      const result = getIncompleteAppointments(emptyData);
      expect(result).toEqual([]);
    });

    it("should collect all checkedIn and onGoing appointments from all appointment types", () => {
      const sampleData = createSampleAppointmentData();
      const result = getIncompleteAppointments(sampleData);

      expect(result).toHaveLength(6); // 2 checkedIn + 1 onGoing from each type (assessment, physiotherapy, tens)
      
      // Check that all returned items have appointmentType
      result.forEach(appointment => {
        expect(appointment.appointmentType).toBeDefined();
        expect(['assessment', 'physiotherapy', 'tens']).toContain(appointment.appointmentType);
      });
    });

    it("should include appointments from assessment type", () => {
      const sampleData = createSampleAppointmentData();
      const result = getIncompleteAppointments(sampleData);

      const assessmentAppointments = result.filter(a => a.appointmentType === 'assessment');
      expect(assessmentAppointments).toHaveLength(2); // 1 checkedIn + 1 onGoing
      
      const checkedInAssessment = assessmentAppointments.find(a => a.checkedInTime);
      const onGoingAssessment = assessmentAppointments.find(a => a.onGoingTime);
      
      expect(checkedInAssessment).toBeDefined();
      expect(onGoingAssessment).toBeDefined();
      expect(checkedInAssessment?.name).toBe("Jane Smith");
      expect(onGoingAssessment?.name).toBe("Bob Johnson");
    });

    it("should include appointments from physiotherapy type", () => {
      const sampleData = createSampleAppointmentData();
      const result = getIncompleteAppointments(sampleData);

      const physiotherapyAppointments = result.filter(a => a.appointmentType === 'physiotherapy');
      expect(physiotherapyAppointments).toHaveLength(2); // 1 checkedIn + 1 onGoing
      
      const checkedInPhysiotherapy = physiotherapyAppointments.find(a => a.checkedInTime);
      const onGoingPhysiotherapy = physiotherapyAppointments.find(a => a.onGoingTime);
      
      expect(checkedInPhysiotherapy).toBeDefined();
      expect(onGoingPhysiotherapy).toBeDefined();
      expect(checkedInPhysiotherapy?.name).toBe("Physiotherapy Checked In");
      expect(onGoingPhysiotherapy?.name).toBe("Physiotherapy Ongoing");
    });

    it("should include appointments from tens type", () => {
      const sampleData = createSampleAppointmentData();
      const result = getIncompleteAppointments(sampleData);

      const tensAppointments = result.filter(a => a.appointmentType === 'tens');
      expect(tensAppointments).toHaveLength(2); // 1 checkedIn + 1 onGoing
      
      const checkedInTens = tensAppointments.find(a => a.checkedInTime);
      const onGoingTens = tensAppointments.find(a => a.onGoingTime);
      
      expect(checkedInTens).toBeDefined();
      expect(onGoingTens).toBeDefined();
      expect(checkedInTens?.name).toBe("TENS Checked In");
      expect(onGoingTens?.name).toBe("TENS Ongoing");
    });

    it("should not include scheduled or completed appointments", () => {
      const sampleData = createSampleAppointmentData();
      const result = getIncompleteAppointments(sampleData);

      // Should not include any scheduled or completed appointments
      const scheduledAppointments = result.filter(a => !a.checkedInTime && !a.onGoingTime);
      const completedAppointments = result.filter(a => a.completedTime);
      
      expect(scheduledAppointments).toHaveLength(0);
      expect(completedAppointments).toHaveLength(0);
    });

    it("should handle mixed data with some empty appointment types", () => {
      const mixedData = createMockAppointmentsByDate({
        assessment: {
          scheduled: [],
          checkedIn: [createMockAppointmentStatusDetail({ name: "Assessment Checked In" })],
          onGoing: [],
          completed: [],
        },
        physiotherapy: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        tens: {
          scheduled: [],
          checkedIn: [],
          onGoing: [createMockAppointmentStatusDetail({ name: "TENS Ongoing" })],
          completed: [],
        },
      });

      const result = getIncompleteAppointments(mixedData);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Assessment Checked In");
      expect(result[0].appointmentType).toBe("assessment");
      expect(result[1].name).toBe("TENS Ongoing");
      expect(result[1].appointmentType).toBe("tens");
    });

    it("should handle appointment types with non-array status data gracefully", () => {
      // Type assertion is needed here to test malformed data handling (checkedIn is wrong type)
      const malformedData = {
        date: "2024-01-15",
        assessment: {
          scheduled: [],
          checkedIn: "not-an-array" as unknown,
          onGoing: [],
          completed: [],
        },
        physiotherapy: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        tens: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        combined: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
      } as unknown as Parameters<typeof getIncompleteAppointments>[0];

      const result = getIncompleteAppointments(malformedData);
      expect(result).toEqual([]);
    });
  });

  describe("getCompletedAppointments", () => {
    it("should return empty array when appointmentsByDate is null", () => {
      const result = getCompletedAppointments(null);
      expect(result).toEqual([]);
    });

    it("should return empty array when appointmentsByDate is undefined", () => {
      const result = getCompletedAppointments(undefined!);
      expect(result).toEqual([]);
    });

    it("should return empty array when no completed appointments exist", () => {
      const emptyData = createEmptyAppointmentData();
      const result = getCompletedAppointments(emptyData);
      expect(result).toEqual([]);
    });

    it("should collect all completed appointments from all appointment types", () => {
      const sampleData = createSampleAppointmentData();
      const result = getCompletedAppointments(sampleData);

      expect(result).toHaveLength(3); // 1 completed from each type (assessment, physiotherapy, tens)
      
      // Check that all returned items have appointmentType
      result.forEach(appointment => {
        expect(appointment.appointmentType).toBeDefined();
        expect(['assessment', 'physiotherapy', 'tens']).toContain(appointment.appointmentType);
        expect(appointment.completedTime).toBeDefined();
      });
    });

    it("should include completed appointments from all types", () => {
      const sampleData = createSampleAppointmentData();
      const result = getCompletedAppointments(sampleData);

      const assessmentCompleted = result.find(a => a.appointmentType === 'assessment');
      const physiotherapyCompleted = result.find(a => a.appointmentType === 'physiotherapy');
      const tensCompleted = result.find(a => a.appointmentType === 'tens');
      
      expect(assessmentCompleted?.name).toBe("Alice Wilson");
      expect(physiotherapyCompleted?.name).toBe("Physiotherapy Completed");
      expect(tensCompleted?.name).toBe("TENS Completed");
    });

    it("should not include scheduled, checkedIn, or onGoing appointments", () => {
      const sampleData = createSampleAppointmentData();
      const result = getCompletedAppointments(sampleData);

      // All results should have completedTime
      result.forEach(appointment => {
        expect(appointment.completedTime).toBeDefined();
      });
    });

    it("should handle mixed data with some empty appointment types", () => {
      const mixedData = createMockAppointmentsByDate({
        assessment: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [createMockAppointmentStatusDetail({ 
            name: "Assessment Completed", 
            completedTime: "2024-01-15T12:00:00Z" 
          })],
        },
        physiotherapy: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        tens: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
      });

      const result = getCompletedAppointments(mixedData);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Assessment Completed");
      expect(result[0].appointmentType).toBe("assessment");
    });
  });

  describe("hasAppointmentsOnDate", () => {
    it("should return false when appointmentsByDate is null", () => {
      expect(hasAppointmentsOnDate(null)).toBe(false);
    });

    it("should return false when no appointments exist", () => {
      const emptyData = createEmptyAppointmentData();
      expect(hasAppointmentsOnDate(emptyData)).toBe(false);
    });

    it("should return true when scheduled appointments exist", () => {
      const sampleData = createSampleAppointmentData();
      expect(hasAppointmentsOnDate(sampleData)).toBe(true);
    });

    it("should return true when completed appointments exist", () => {
      const data = createMockAppointmentsByDate({
        assessment: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [createMockAppointmentStatusDetail({ name: "Done" })],
        },
        physiotherapy: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        tens: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
      });
      expect(hasAppointmentsOnDate(data)).toBe(true);
    });
  });

  describe("getDefaultCollapsedForDate", () => {
    it("should return ALL_SECTIONS_COLLAPSED when appointmentsByDate is null", () => {
      const result = getDefaultCollapsedForDate(null, false);
      expect(result).toEqual(ALL_SECTIONS_COLLAPSED);
    });

    it("should return all collapsed when no slots and no appointments", () => {
      const emptyData = createEmptyAppointmentData();
      const result = getDefaultCollapsedForDate(emptyData, false);
      expect(result.assessment).toBe(true);
      expect(result.physiotherapy).toBe(true);
      expect(result.tens).toBe(true);
      expect(result.combined).toBe(true);
    });

    it("should return all expanded when hasSlotsForDay and no appointments", () => {
      const emptyData = createEmptyAppointmentData();
      const result = getDefaultCollapsedForDate(emptyData, true);
      expect(result.assessment).toBe(false);
      expect(result.physiotherapy).toBe(false);
      expect(result.tens).toBe(false);
      expect(result.combined).toBe(false);
    });

    it("should keep assessment expanded when assessment appointments exist", () => {
      const sampleData = createSampleAppointmentData();
      const result = getDefaultCollapsedForDate(sampleData, true);
      expect(result.assessment).toBe(false);
    });

    it("should keep physiotherapy/tens/combined expanded when treatment appointments exist", () => {
      const sampleData = createSampleAppointmentData();
      const result = getDefaultCollapsedForDate(sampleData, true);
      expect(result.physiotherapy).toBe(false);
      expect(result.tens).toBe(false);
      expect(result.combined).toBe(false);
    });
  });

  describe("getScheduledAbsences", () => {
    it("should return empty array when appointmentsByDate is null", () => {
      const result = getScheduledAbsences(null);
      expect(result).toEqual([]);
    });

    it("should return empty array when appointmentsByDate is undefined", () => {
      const result = getScheduledAbsences(undefined!);
      expect(result).toEqual([]);
    });

    it("should return empty array when no scheduled appointments exist", () => {
      const emptyData = createEmptyAppointmentData();
      const result = getScheduledAbsences(emptyData);
      expect(result).toEqual([]);
    });

    it("should collect all scheduled appointments from all appointment types", () => {
      const sampleData = createSampleAppointmentData();
      const result = getScheduledAbsences(sampleData);

      expect(result).toHaveLength(3); // 1 scheduled from each type (assessment, physiotherapy, tens)
      
      // Check that all returned items have appointmentType
      result.forEach(appointment => {
        expect(appointment.appointmentType).toBeDefined();
        expect(['assessment', 'physiotherapy', 'tens']).toContain(appointment.appointmentType);
      });
    });

    it("should include scheduled appointments from all types", () => {
      const sampleData = createSampleAppointmentData();
      const result = getScheduledAbsences(sampleData);

      const assessmentScheduled = result.find(a => a.appointmentType === 'assessment');
      const physiotherapyScheduled = result.find(a => a.appointmentType === 'physiotherapy');
      const tensScheduled = result.find(a => a.appointmentType === 'tens');
      
      expect(assessmentScheduled?.name).toBe("John Doe");
      expect(physiotherapyScheduled?.name).toBe("Physiotherapy Scheduled");
      expect(tensScheduled?.name).toBe("TENS Scheduled");
    });

    it("should not include checkedIn, onGoing, or completed appointments", () => {
      const sampleData = createSampleAppointmentData();
      const result = getScheduledAbsences(sampleData);

      // All results should not have timestamps (except maybe scheduled time if it exists)
      result.forEach(appointment => {
        expect(appointment.checkedInTime).toBeFalsy();
        expect(appointment.onGoingTime).toBeFalsy();
        expect(appointment.completedTime).toBeFalsy();
      });
    });

    it("should handle mixed data with some empty appointment types", () => {
      const mixedData = createMockAppointmentsByDate({
        assessment: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        physiotherapy: {
          scheduled: [createMockAppointmentStatusDetail({ name: "Physiotherapy Scheduled" })],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        tens: {
          scheduled: [createMockAppointmentStatusDetail({ name: "TENS Scheduled" })],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
      });

      const result = getScheduledAbsences(mixedData);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Physiotherapy Scheduled");
      expect(result[0].appointmentType).toBe("physiotherapy");
      expect(result[1].name).toBe("TENS Scheduled");
      expect(result[1].appointmentType).toBe("tens");
    });
  });

  describe("IAppointmentStatusDetailWithType interface", () => {
    it("should extend AppointmentStatusDetail with appointmentType", () => {
      const sampleData = createSampleAppointmentData();
      const incomplete = getIncompleteAppointments(sampleData);
      
      if (incomplete.length > 0) {
        const firstAppointment: IAppointmentStatusDetailWithType = incomplete[0];
        
        // Should have all AppointmentStatusDetail properties
        expect(firstAppointment.name).toBeDefined();
        expect(firstAppointment.priority).toBeDefined();
        expect(firstAppointment.patientId).toBeDefined();
        expect(firstAppointment.appointmentId).toBeDefined();
        
        // Should have the additional appointmentType property
        expect(firstAppointment.appointmentType).toBeDefined();
        expect(['assessment', 'physiotherapy', 'tens']).toContain(firstAppointment.appointmentType);
      }
    });
  });

});