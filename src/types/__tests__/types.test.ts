import {
  Priority,
  Status,
  AttendanceType,
  AttendanceProgression,
  Recommendations,
  AttendanceStatusDetail,
  AttendanceStatus,
  AttendanceByDate,
  Schedule,
  CalendarSchedule,
  Patient,
  PatientPriority,
  PatientStatus,
} from '../types';

describe('Type System', () => {
  describe('Type Aliases', () => {
    it('should define Priority type correctly', () => {
      const priority1: Priority = "1";
      const priority2: Priority = "2";
      const priority3: Priority = "3";
      
      expect(priority1).toBe("1");
      expect(priority2).toBe("2");
      expect(priority3).toBe("3");
    });

    it('should define Status type correctly', () => {
      const statusN: Status = "N";
      const statusT: Status = "T";
      const statusA: Status = "A";
      const statusF: Status = "F";
      
      expect(statusN).toBe("N");
      expect(statusT).toBe("T");
      expect(statusA).toBe("A");
      expect(statusF).toBe("F");
    });

    it('should define AttendanceTypeUnified correctly', () => {
      const assessment: AttendanceType = "assessment";
      const physiotherapy: AttendanceType = "physiotherapy";
      const tens: AttendanceType = "tens";
      const combined: AttendanceType = "combined";
      
      expect(assessment).toBe("assessment");
      expect(physiotherapy).toBe("physiotherapy");
      expect(tens).toBe("tens");
      expect(combined).toBe("combined");
    });

    it('should define AttendanceProgressionUnified correctly', () => {
      const scheduled: AttendanceProgression = "scheduled";
      const checkedIn: AttendanceProgression = "checkedIn";
      const onGoing: AttendanceProgression = "onGoing";
      const completed: AttendanceProgression = "completed";
      
      expect(scheduled).toBe("scheduled");
      expect(checkedIn).toBe("checkedIn");
      expect(onGoing).toBe("onGoing");
      expect(completed).toBe("completed");
    });
  });

  describe('Interface Structures', () => {
    it('should create Recommendations interface correctly', () => {
      const recommendations: Recommendations = {
        food: "Test food",
        water: "Test water",
        ointment: "Test ointment",
        physiotherapy: true,
        tens: false,
        returnWeeks: 2
      };
      
      expect(recommendations.food).toBe("Test food");
      expect(recommendations.physiotherapy).toBe(true);
      expect(recommendations.returnWeeks).toBe(2);
    });

    it('should create AttendanceStatusDetail interface correctly', () => {
      const detail: AttendanceStatusDetail = {
        name: "Test Patient",
        priority: "1",
        checkedInTime: "10:00",
        onGoingTime: null,
        completedTime: null,
        attendanceId: 123,
        patientId: 456
      };
      
      expect(detail.name).toBe("Test Patient");
      expect(detail.priority).toBe("1");
      expect(detail.attendanceId).toBe(123);
    });

    it('should create AttendanceStatus interface correctly', () => {
      const status: AttendanceStatus = {
        scheduled: [],
        checkedIn: [{
          name: "Patient 1",
          priority: "2",
          checkedInTime: "09:30",
          attendanceId: 1,
          patientId: 10
        }],
        onGoing: [],
        completed: []
      };
      
      expect(status.checkedIn).toHaveLength(1);
      expect(status.checkedIn[0].name).toBe("Patient 1");
    });

    it('should create Patient interface correctly', () => {
      const patient: Patient = {
        name: "Test Patient",
        id: "123",
        phone: "123456789",
        priority: "1",
        status: "T",
        birthDate: "1990-01-01",
        mainConcern: "Test complaint",
        startDate: "2025-01-01",
        dischargeDate: null,
        timezone: "America/Sao_Paulo",
        nextAttendanceDates: [{
          date: "2025-01-15",
          type: "assessment"
        }],
        currentRecommendations: {
          date: "2025-01-01",
          food: "Light meals",
          water: "2L daily",
          ointment: "None",
          physiotherapy: true,
          tens: false,
          returnWeeks: 1
        },
        previousAttendances: [],
        missingAppointmentsStreak: 0,
      };
      
      expect(patient.name).toBe("Test Patient");
      expect(patient.timezone).toBe("America/Sao_Paulo");
      expect(patient.nextAttendanceDates).toHaveLength(1);
    });
  });

  describe('API Type Integration', () => {
    it('should expose PatientPriority enum', () => {
      expect(PatientPriority.LEVEL_1).toBe('1');
      expect(PatientPriority.LEVEL_2).toBe('2');
      expect(PatientPriority.LEVEL_3).toBe('3');
      expect(PatientPriority.LEVEL_4).toBe('4');
      expect(PatientPriority.LEVEL_5).toBe('5');
    });

    it('should expose PatientStatus enum', () => {
      expect(PatientStatus.NEW_PATIENT).toBe('N');
      expect(PatientStatus.IN_TREATMENT).toBe('T');
      expect(PatientStatus.DISCHARGED).toBe('A');
      expect(PatientStatus.ABSENT).toBe('F');
    });
  });

  describe('Complex Type Structures', () => {
    it('should create AttendanceByDate structure correctly', () => {
      const attendanceByDate: AttendanceByDate = {
        date: "2025-01-15",
        assessment: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: []
        },
        physiotherapy: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: []
        },
        tens: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: []
        },
        combined: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: []
        }
      };

      expect(attendanceByDate.date).toBe("2025-01-15");
      expect(attendanceByDate.assessment).toHaveProperty('scheduled');
      expect(attendanceByDate.physiotherapy).toHaveProperty('checkedIn');
    });

    it('should create Schedule structure correctly', () => {
      const schedule: Schedule = {
        assessment: [{
          date: "2025-01-15",
          patients: [{
            id: "1",
            name: "Patient 1",
            priority: "1",
            attendanceId: 123,
            attendanceType: "assessment"
          }]
        }],
        physiotherapy: [],
        tens: [],
        combined: []
      };
      
      expect(schedule.assessment).toHaveLength(1);
      expect(schedule.assessment[0].patients[0].name).toBe("Patient 1");
    });

    it('should create CalendarSchedule structure correctly', () => {
      const calendarSchedule: CalendarSchedule = {
        assessment: [{
          date: "2025-01-15",
          patients: []
        }],
        physiotherapy: [{
          date: "2025-01-16",
          patients: []
        }]
      };
      
      expect(calendarSchedule.assessment).toHaveLength(1);
      expect(calendarSchedule.physiotherapy).toHaveLength(1);
    });
  });
});