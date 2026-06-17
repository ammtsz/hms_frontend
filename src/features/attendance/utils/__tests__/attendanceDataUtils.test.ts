import {
  getIncompleteAttendances,
  getCompletedAttendances,
  getScheduledAbsences,
  hasAttendancesOnDate,
  getDefaultCollapsedForDate,
  ALL_SECTIONS_COLLAPSED,
  type IAttendanceStatusDetailWithType
} from "../attendanceDataUtils";

import {
  createSampleAttendanceData,
  createEmptyAttendanceData,
  createMockAttendancesByDate,
  createMockAttendanceStatusDetail
} from "../testUtilities";

describe("attendanceDataUtils", () => {
  describe("getIncompleteAttendances", () => {
    it("should return empty array when attendancesByDate is null", () => {
      const result = getIncompleteAttendances(null);
      expect(result).toEqual([]);
    });

    it("should return empty array when attendancesByDate is undefined", () => {
      const result = getIncompleteAttendances(undefined!);
      expect(result).toEqual([]);
    });

    it("should return empty array when no incomplete attendances exist", () => {
      const emptyData = createEmptyAttendanceData();
      const result = getIncompleteAttendances(emptyData);
      expect(result).toEqual([]);
    });

    it("should collect all checkedIn and onGoing attendances from all attendance types", () => {
      const sampleData = createSampleAttendanceData();
      const result = getIncompleteAttendances(sampleData);

      expect(result).toHaveLength(6); // 2 checkedIn + 1 onGoing from each type (assessment, physiotherapy, tens)
      
      // Check that all returned items have attendanceType
      result.forEach(attendance => {
        expect(attendance.attendanceType).toBeDefined();
        expect(['assessment', 'physiotherapy', 'tens']).toContain(attendance.attendanceType);
      });
    });

    it("should include attendances from assessment type", () => {
      const sampleData = createSampleAttendanceData();
      const result = getIncompleteAttendances(sampleData);

      const assessmentAttendances = result.filter(a => a.attendanceType === 'assessment');
      expect(assessmentAttendances).toHaveLength(2); // 1 checkedIn + 1 onGoing
      
      const checkedInAssessment = assessmentAttendances.find(a => a.checkedInTime);
      const onGoingAssessment = assessmentAttendances.find(a => a.onGoingTime);
      
      expect(checkedInAssessment).toBeDefined();
      expect(onGoingAssessment).toBeDefined();
      expect(checkedInAssessment?.name).toBe("Jane Smith");
      expect(onGoingAssessment?.name).toBe("Bob Johnson");
    });

    it("should include attendances from physiotherapy type", () => {
      const sampleData = createSampleAttendanceData();
      const result = getIncompleteAttendances(sampleData);

      const physiotherapyAttendances = result.filter(a => a.attendanceType === 'physiotherapy');
      expect(physiotherapyAttendances).toHaveLength(2); // 1 checkedIn + 1 onGoing
      
      const checkedInPhysiotherapy = physiotherapyAttendances.find(a => a.checkedInTime);
      const onGoingPhysiotherapy = physiotherapyAttendances.find(a => a.onGoingTime);
      
      expect(checkedInPhysiotherapy).toBeDefined();
      expect(onGoingPhysiotherapy).toBeDefined();
      expect(checkedInPhysiotherapy?.name).toBe("Physiotherapy Checked In");
      expect(onGoingPhysiotherapy?.name).toBe("Physiotherapy Ongoing");
    });

    it("should include attendances from tens type", () => {
      const sampleData = createSampleAttendanceData();
      const result = getIncompleteAttendances(sampleData);

      const tensAttendances = result.filter(a => a.attendanceType === 'tens');
      expect(tensAttendances).toHaveLength(2); // 1 checkedIn + 1 onGoing
      
      const checkedInTens = tensAttendances.find(a => a.checkedInTime);
      const onGoingTens = tensAttendances.find(a => a.onGoingTime);
      
      expect(checkedInTens).toBeDefined();
      expect(onGoingTens).toBeDefined();
      expect(checkedInTens?.name).toBe("TENS Checked In");
      expect(onGoingTens?.name).toBe("TENS Ongoing");
    });

    it("should not include scheduled or completed attendances", () => {
      const sampleData = createSampleAttendanceData();
      const result = getIncompleteAttendances(sampleData);

      // Should not include any scheduled or completed attendances
      const scheduledAttendances = result.filter(a => !a.checkedInTime && !a.onGoingTime);
      const completedAttendances = result.filter(a => a.completedTime);
      
      expect(scheduledAttendances).toHaveLength(0);
      expect(completedAttendances).toHaveLength(0);
    });

    it("should handle mixed data with some empty attendance types", () => {
      const mixedData = createMockAttendancesByDate({
        assessment: {
          scheduled: [],
          checkedIn: [createMockAttendanceStatusDetail({ name: "Assessment Checked In" })],
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
          onGoing: [createMockAttendanceStatusDetail({ name: "TENS Ongoing" })],
          completed: [],
        },
      });

      const result = getIncompleteAttendances(mixedData);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Assessment Checked In");
      expect(result[0].attendanceType).toBe("assessment");
      expect(result[1].name).toBe("TENS Ongoing");
      expect(result[1].attendanceType).toBe("tens");
    });

    it("should handle attendance types with non-array status data gracefully", () => {
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
      } as unknown as Parameters<typeof getIncompleteAttendances>[0];

      const result = getIncompleteAttendances(malformedData);
      expect(result).toEqual([]);
    });
  });

  describe("getCompletedAttendances", () => {
    it("should return empty array when attendancesByDate is null", () => {
      const result = getCompletedAttendances(null);
      expect(result).toEqual([]);
    });

    it("should return empty array when attendancesByDate is undefined", () => {
      const result = getCompletedAttendances(undefined!);
      expect(result).toEqual([]);
    });

    it("should return empty array when no completed attendances exist", () => {
      const emptyData = createEmptyAttendanceData();
      const result = getCompletedAttendances(emptyData);
      expect(result).toEqual([]);
    });

    it("should collect all completed attendances from all attendance types", () => {
      const sampleData = createSampleAttendanceData();
      const result = getCompletedAttendances(sampleData);

      expect(result).toHaveLength(3); // 1 completed from each type (assessment, physiotherapy, tens)
      
      // Check that all returned items have attendanceType
      result.forEach(attendance => {
        expect(attendance.attendanceType).toBeDefined();
        expect(['assessment', 'physiotherapy', 'tens']).toContain(attendance.attendanceType);
        expect(attendance.completedTime).toBeDefined();
      });
    });

    it("should include completed attendances from all types", () => {
      const sampleData = createSampleAttendanceData();
      const result = getCompletedAttendances(sampleData);

      const assessmentCompleted = result.find(a => a.attendanceType === 'assessment');
      const physiotherapyCompleted = result.find(a => a.attendanceType === 'physiotherapy');
      const tensCompleted = result.find(a => a.attendanceType === 'tens');
      
      expect(assessmentCompleted?.name).toBe("Alice Wilson");
      expect(physiotherapyCompleted?.name).toBe("Physiotherapy Completed");
      expect(tensCompleted?.name).toBe("TENS Completed");
    });

    it("should not include scheduled, checkedIn, or onGoing attendances", () => {
      const sampleData = createSampleAttendanceData();
      const result = getCompletedAttendances(sampleData);

      // All results should have completedTime
      result.forEach(attendance => {
        expect(attendance.completedTime).toBeDefined();
      });
    });

    it("should handle mixed data with some empty attendance types", () => {
      const mixedData = createMockAttendancesByDate({
        assessment: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [createMockAttendanceStatusDetail({ 
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

      const result = getCompletedAttendances(mixedData);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Assessment Completed");
      expect(result[0].attendanceType).toBe("assessment");
    });
  });

  describe("hasAttendancesOnDate", () => {
    it("should return false when attendancesByDate is null", () => {
      expect(hasAttendancesOnDate(null)).toBe(false);
    });

    it("should return false when no attendances exist", () => {
      const emptyData = createEmptyAttendanceData();
      expect(hasAttendancesOnDate(emptyData)).toBe(false);
    });

    it("should return true when scheduled attendances exist", () => {
      const sampleData = createSampleAttendanceData();
      expect(hasAttendancesOnDate(sampleData)).toBe(true);
    });

    it("should return true when completed attendances exist", () => {
      const data = createMockAttendancesByDate({
        assessment: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [createMockAttendanceStatusDetail({ name: "Done" })],
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
      expect(hasAttendancesOnDate(data)).toBe(true);
    });
  });

  describe("getDefaultCollapsedForDate", () => {
    it("should return ALL_SECTIONS_COLLAPSED when attendancesByDate is null", () => {
      const result = getDefaultCollapsedForDate(null, false);
      expect(result).toEqual(ALL_SECTIONS_COLLAPSED);
    });

    it("should return all collapsed when no slots and no attendances", () => {
      const emptyData = createEmptyAttendanceData();
      const result = getDefaultCollapsedForDate(emptyData, false);
      expect(result.assessment).toBe(true);
      expect(result.physiotherapy).toBe(true);
      expect(result.tens).toBe(true);
      expect(result.combined).toBe(true);
    });

    it("should return all expanded when hasSlotsForDay and no attendances", () => {
      const emptyData = createEmptyAttendanceData();
      const result = getDefaultCollapsedForDate(emptyData, true);
      expect(result.assessment).toBe(false);
      expect(result.physiotherapy).toBe(false);
      expect(result.tens).toBe(false);
      expect(result.combined).toBe(false);
    });

    it("should keep assessment expanded when assessment attendances exist", () => {
      const sampleData = createSampleAttendanceData();
      const result = getDefaultCollapsedForDate(sampleData, true);
      expect(result.assessment).toBe(false);
    });

    it("should keep physiotherapy/tens/combined expanded when treatment attendances exist", () => {
      const sampleData = createSampleAttendanceData();
      const result = getDefaultCollapsedForDate(sampleData, true);
      expect(result.physiotherapy).toBe(false);
      expect(result.tens).toBe(false);
      expect(result.combined).toBe(false);
    });
  });

  describe("getScheduledAbsences", () => {
    it("should return empty array when attendancesByDate is null", () => {
      const result = getScheduledAbsences(null);
      expect(result).toEqual([]);
    });

    it("should return empty array when attendancesByDate is undefined", () => {
      const result = getScheduledAbsences(undefined!);
      expect(result).toEqual([]);
    });

    it("should return empty array when no scheduled attendances exist", () => {
      const emptyData = createEmptyAttendanceData();
      const result = getScheduledAbsences(emptyData);
      expect(result).toEqual([]);
    });

    it("should collect all scheduled attendances from all attendance types", () => {
      const sampleData = createSampleAttendanceData();
      const result = getScheduledAbsences(sampleData);

      expect(result).toHaveLength(3); // 1 scheduled from each type (assessment, physiotherapy, tens)
      
      // Check that all returned items have attendanceType
      result.forEach(attendance => {
        expect(attendance.attendanceType).toBeDefined();
        expect(['assessment', 'physiotherapy', 'tens']).toContain(attendance.attendanceType);
      });
    });

    it("should include scheduled attendances from all types", () => {
      const sampleData = createSampleAttendanceData();
      const result = getScheduledAbsences(sampleData);

      const assessmentScheduled = result.find(a => a.attendanceType === 'assessment');
      const physiotherapyScheduled = result.find(a => a.attendanceType === 'physiotherapy');
      const tensScheduled = result.find(a => a.attendanceType === 'tens');
      
      expect(assessmentScheduled?.name).toBe("John Doe");
      expect(physiotherapyScheduled?.name).toBe("Physiotherapy Scheduled");
      expect(tensScheduled?.name).toBe("TENS Scheduled");
    });

    it("should not include checkedIn, onGoing, or completed attendances", () => {
      const sampleData = createSampleAttendanceData();
      const result = getScheduledAbsences(sampleData);

      // All results should not have timestamps (except maybe scheduled time if it exists)
      result.forEach(attendance => {
        expect(attendance.checkedInTime).toBeFalsy();
        expect(attendance.onGoingTime).toBeFalsy();
        expect(attendance.completedTime).toBeFalsy();
      });
    });

    it("should handle mixed data with some empty attendance types", () => {
      const mixedData = createMockAttendancesByDate({
        assessment: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        physiotherapy: {
          scheduled: [createMockAttendanceStatusDetail({ name: "Physiotherapy Scheduled" })],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        tens: {
          scheduled: [createMockAttendanceStatusDetail({ name: "TENS Scheduled" })],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
      });

      const result = getScheduledAbsences(mixedData);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Physiotherapy Scheduled");
      expect(result[0].attendanceType).toBe("physiotherapy");
      expect(result[1].name).toBe("TENS Scheduled");
      expect(result[1].attendanceType).toBe("tens");
    });
  });

  describe("IAttendanceStatusDetailWithType interface", () => {
    it("should extend AttendanceStatusDetail with attendanceType", () => {
      const sampleData = createSampleAttendanceData();
      const incomplete = getIncompleteAttendances(sampleData);
      
      if (incomplete.length > 0) {
        const firstAttendance: IAttendanceStatusDetailWithType = incomplete[0];
        
        // Should have all AttendanceStatusDetail properties
        expect(firstAttendance.name).toBeDefined();
        expect(firstAttendance.priority).toBeDefined();
        expect(firstAttendance.patientId).toBeDefined();
        expect(firstAttendance.attendanceId).toBeDefined();
        
        // Should have the additional attendanceType property
        expect(firstAttendance.attendanceType).toBeDefined();
        expect(['assessment', 'physiotherapy', 'tens']).toContain(firstAttendance.attendanceType);
      }
    });
  });

});