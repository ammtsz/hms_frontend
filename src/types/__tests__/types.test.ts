import {
  Priority,
  Status,
  AppointmentType,
  AppointmentProgression,
  Recommendations,
  AppointmentStatusDetail,
  AppointmentStatus,
  AppointmentByDate,
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
      const statusD: Status = "D";
      const statusC: Status = "C";
      
      expect(statusN).toBe("N");
      expect(statusT).toBe("T");
      expect(statusD).toBe("D");
      expect(statusC).toBe("C");
    });

    it('should define AppointmentTypeUnified correctly', () => {
      const assessment: AppointmentType = "assessment";
      const physiotherapy: AppointmentType = "physiotherapy";
      const tens: AppointmentType = "tens";
      const combined: AppointmentType = "combined";
      
      expect(assessment).toBe("assessment");
      expect(physiotherapy).toBe("physiotherapy");
      expect(tens).toBe("tens");
      expect(combined).toBe("combined");
    });

    it('should define AppointmentProgressionUnified correctly', () => {
      const scheduled: AppointmentProgression = "scheduled";
      const checkedIn: AppointmentProgression = "checkedIn";
      const onGoing: AppointmentProgression = "onGoing";
      const completed: AppointmentProgression = "completed";
      
      expect(scheduled).toBe("scheduled");
      expect(checkedIn).toBe("checkedIn");
      expect(onGoing).toBe("onGoing");
      expect(completed).toBe("completed");
    });
  });

  describe('Interface Structures', () => {
    it('should create Recommendations interface correctly', () => {
      const recommendations: Recommendations = {
        homeExercises: "Test exercises",
        painManagement: "Test pain management",
        medications: "Test medications",
        physiotherapy: true,
        tens: false,
        returnWeeks: 2
      };
      
      expect(recommendations.homeExercises).toBe("Test exercises");
      expect(recommendations.physiotherapy).toBe(true);
      expect(recommendations.returnWeeks).toBe(2);
    });

    it('should create AppointmentStatusDetail interface correctly', () => {
      const detail: AppointmentStatusDetail = {
        name: "Test Patient",
        priority: "1",
        checkedInTime: "10:00",
        onGoingTime: null,
        completedTime: null,
        appointmentId: 123,
        patientId: 456
      };
      
      expect(detail.name).toBe("Test Patient");
      expect(detail.priority).toBe("1");
      expect(detail.appointmentId).toBe(123);
    });

    it('should create AppointmentStatus interface correctly', () => {
      const status: AppointmentStatus = {
        scheduled: [],
        checkedIn: [{
          name: "Patient 1",
          priority: "2",
          checkedInTime: "09:30",
          appointmentId: 1,
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
        nextAppointmentDates: [{
          date: "2025-01-15",
          type: "assessment"
        }],
        currentRecommendations: {
          date: "2025-01-01",
          homeExercises: "Light exercises",
          painManagement: "Ice as needed",
          medications: "None",
          physiotherapy: true,
          tens: false,
          returnWeeks: 1
        },
        previousAppointments: [],
        missingAppointmentsStreak: 0,
      };
      
      expect(patient.name).toBe("Test Patient");
      expect(patient.nextAppointmentDates).toHaveLength(1);
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
      expect(PatientStatus.DISCHARGED).toBe('D');
      expect(PatientStatus.CONSECUTIVE_NO_SHOWS).toBe('C');
    });
  });

  describe('Complex Type Structures', () => {
    it('should create AppointmentByDate structure correctly', () => {
      const appointmentByDate: AppointmentByDate = {
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

      expect(appointmentByDate.date).toBe("2025-01-15");
      expect(appointmentByDate.assessment).toHaveProperty('scheduled');
      expect(appointmentByDate.physiotherapy).toHaveProperty('checkedIn');
    });

    it('should create Schedule structure correctly', () => {
      const schedule: Schedule = {
        assessment: [{
          date: "2025-01-15",
          patients: [{
            id: "1",
            name: "Patient 1",
            priority: "1",
            appointmentId: 123,
            appointmentType: "assessment"
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