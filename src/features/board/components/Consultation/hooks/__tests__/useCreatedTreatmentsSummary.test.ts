import { renderHook } from "@testing-library/react";
import { useCreatedTreatmentsSummary } from "../useCreatedTreatmentsSummary";
import type { CreatedTreatment } from "../../components/CreatedTreatmentsConfirmation";
import type {
  AppointmentResponseDto,
  AppointmentType,
  AppointmentStatus,
} from "@/api/types";

describe("useCreatedTreatmentsSummary", () => {
  const mockPhysiotherapySession: CreatedTreatment = {
    id: 1,
    consultationId: 1,
    appointmentId: 1,
    patientId: 1,
    treatmentType: "physiotherapy",
    bodyLocation: "Head",
    startDate: "2026-01-15T00:00:00.000Z",
    plannedSessions: 3,
    completedSessions: 0,
    status: "scheduled",
    color: "Blue",
    durationMinutes: 14,
    createdDate: "2026-01-15",
    createdTime: "00:00:00",
    updatedDate: "2026-01-15",
    updatedTime: "00:00:00",
  };

  const mockTensSession: CreatedTreatment = {
    id: 2,
    consultationId: 2,
    appointmentId: 1,
    patientId: 1,
    treatmentType: "tens",
    bodyLocation: "Back",
    startDate: "2026-01-15T00:00:00.000Z",
    plannedSessions: 2,
    completedSessions: 0,
    status: "scheduled",
    createdDate: "2026-01-15",
    createdTime: "00:00:00",
    updatedDate: "2026-01-15",
    updatedTime: "00:00:00",
  };

  const mockAppointments: AppointmentResponseDto[] = [
    {
      id: 101,
      patientId: 1,
      type: "physiotherapy" as AppointmentType,
      status: "scheduled" as AppointmentStatus,
      scheduledDate: "2026-01-21T00:00:00.000Z",
      scheduledTime: "14:00",
      createdAt: "2026-01-15T00:00:00.000Z",
      updatedAt: "2026-01-15T00:00:00.000Z",
    },
    {
      id: 102,
      patientId: 1,
      type: "physiotherapy" as AppointmentType,
      status: "scheduled" as AppointmentStatus,
      scheduledDate: "2026-01-28T00:00:00.000Z",
      scheduledTime: "14:00",
      createdAt: "2026-01-15T00:00:00.000Z",
      updatedAt: "2026-01-15T00:00:00.000Z",
    },
    {
      id: 103,
      patientId: 1,
      type: "assessment" as AppointmentType,
      status: "scheduled" as AppointmentStatus,
      scheduledDate: "2026-02-19T00:00:00.000Z",
      scheduledTime: "15:00",
      createdAt: "2026-01-15T00:00:00.000Z",
      updatedAt: "2026-01-15T00:00:00.000Z",
    },
  ];

  describe("session grouping", () => {
    it("should group sessions by treatment type", () => {
      const sessions = [mockPhysiotherapySession, mockTensSession];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, mockAppointments),
      );

      expect(result.current.physiotherapySessions).toHaveLength(1);
      expect(result.current.physiotherapySessions[0].treatmentType).toBe(
        "physiotherapy",
      );
      expect(result.current.tensSessions).toHaveLength(1);
      expect(result.current.tensSessions[0].treatmentType).toBe("tens");
    });

    it("should handle empty sessions array", () => {
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary([], mockAppointments),
      );

      expect(result.current.physiotherapySessions).toHaveLength(0);
      expect(result.current.tensSessions).toHaveLength(0);
    });

    it("should handle only physiotherapy sessions", () => {
      const sessions = [mockPhysiotherapySession];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, mockAppointments),
      );

      expect(result.current.physiotherapySessions).toHaveLength(1);
      expect(result.current.tensSessions).toHaveLength(0);
    });

    it("should handle only tens sessions", () => {
      const sessions = [mockTensSession];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, mockAppointments),
      );

      expect(result.current.physiotherapySessions).toHaveLength(0);
      expect(result.current.tensSessions).toHaveLength(1);
    });
  });

  describe("total appointments calculation", () => {
    it("should calculate total appointments correctly", () => {
      const sessions = [mockPhysiotherapySession, mockTensSession];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, mockAppointments),
      );

      // 3 physiotherapy sessions + 2 tens sessions = 5 total
      expect(result.current.totalAppointments).toBe(5);
    });

    it("should return 0 for empty sessions", () => {
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary([], mockAppointments),
      );

      expect(result.current.totalAppointments).toBe(0);
    });
  });

  describe("next assessment consultation", () => {
    it("should find next assessment consultation", () => {
      const sessions = [mockPhysiotherapySession];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, mockAppointments),
      );

      expect(result.current.nextAssessmentConsultation).not.toBeNull();
      expect(result.current.nextAssessmentConsultation?.type).toBe(
        "assessment",
      );
      expect(result.current.nextAssessmentConsultation?.id).toBe(103);
    });

    it("should return null when no appointments provided", () => {
      const sessions = [mockPhysiotherapySession];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, undefined),
      );

      expect(result.current.nextAssessmentConsultation).toBeNull();
    });

    it("should return null when no assessment consultations exist", () => {
      const sessions = [mockPhysiotherapySession];
      const appointments = mockAppointments.filter(
        (a) => a.type !== "assessment",
      );
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, appointments),
      );

      expect(result.current.nextAssessmentConsultation).toBeNull();
    });

    it("should only return scheduled assessment consultations", () => {
      const sessions = [mockPhysiotherapySession];
      const appointmentsWithCompleted: AppointmentResponseDto[] = [
        ...mockAppointments,
        {
          id: 104,
          patientId: 1,
          type: "assessment" as AppointmentType,
          status: "completed" as AppointmentStatus,
          scheduledDate: "2026-01-10T00:00:00.000Z",
          scheduledTime: "10:00",
          createdAt: "2026-01-15T00:00:00.000Z",
          updatedAt: "2026-01-15T00:00:00.000Z",
        },
      ];

      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, appointmentsWithCompleted),
      );

      expect(result.current.nextAssessmentConsultation?.status).toBe(
        "scheduled",
      );
      expect(result.current.nextAssessmentConsultation?.id).toBe(103);
    });
  });

  describe("getScheduledDatesFromAppointments", () => {
    it("should return scheduled dates from appointments", () => {
      const sessions = [mockPhysiotherapySession];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, mockAppointments),
      );

      const scheduledDates = result.current.getScheduledDatesFromAppointments(
        mockPhysiotherapySession,
      );

      expect(scheduledDates).toHaveLength(2);
      expect(scheduledDates[0].date).toBe("2026-01-21");
      expect(scheduledDates[0].time).toBe("14:00");
    });

    it("should prefer session rows over appointments when sessions are present", () => {
      const sessions = [
        {
          ...mockPhysiotherapySession,
          sessions: [
            {
              id: 1,
              treatmentId: 1,
              sessionNumber: 1,
              scheduledDate: "2026-06-06",
              status: "scheduled",
              createdDate: "2026-01-15",
              createdTime: "00:00:00",
              updatedDate: "2026-01-15",
              updatedTime: "00:00:00",
            },
            {
              id: 2,
              treatmentId: 1,
              sessionNumber: 2,
              scheduledDate: "2026-06-13",
              status: "scheduled",
              createdDate: "2026-01-15",
              createdTime: "00:00:00",
              updatedDate: "2026-01-15",
              updatedTime: "00:00:00",
            },
            {
              id: 3,
              treatmentId: 1,
              sessionNumber: 3,
              scheduledDate: "2026-06-20",
              status: "scheduled",
              createdDate: "2026-01-15",
              createdTime: "00:00:00",
              updatedDate: "2026-01-15",
              updatedTime: "00:00:00",
            },
          ],
        },
      ];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(
          sessions as CreatedTreatment[],
          mockAppointments,
        ),
      );

      const scheduledDates = result.current.getScheduledDatesFromAppointments(
        sessions[0] as CreatedTreatment,
      );

      expect(scheduledDates.map((d) => d.date)).toEqual([
        "2026-06-06",
        "2026-06-13",
        "2026-06-20",
      ]);
    });

    it("should fallback to calculated dates when no appointments", () => {
      const sessions = [mockPhysiotherapySession];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, undefined),
      );

      const scheduledDates = result.current.getScheduledDatesFromAppointments(
        mockPhysiotherapySession,
      );

      // Should return 3 dates (planned sessions)
      expect(scheduledDates).toHaveLength(3);
      // Fallback uses clinic calendar dates (YYYY-MM-DD), not UTC ISO
      expect(scheduledDates[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should limit results to planned sessions", () => {
      const sessionWith2Planned = {
        ...mockPhysiotherapySession,
        plannedSessions: 2,
      };
      const sessions = [sessionWith2Planned];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, mockAppointments),
      );

      const scheduledDates =
        result.current.getScheduledDatesFromAppointments(sessionWith2Planned);

      expect(scheduledDates).toHaveLength(2);
    });

    it("should match appointments by treatment type", () => {
      const sessions = [mockTensSession];
      const tensAppointments: AppointmentResponseDto[] = [
        {
          id: 201,
          patientId: 1,
          type: "tens" as AppointmentType,
          status: "scheduled" as AppointmentStatus,
          scheduledDate: "2026-01-21T00:00:00.000Z",
          scheduledTime: "15:00",
          createdAt: "2026-01-15T00:00:00.000Z",
          updatedAt: "2026-01-15T00:00:00.000Z",
        },
      ];

      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, tensAppointments),
      );

      const scheduledDates =
        result.current.getScheduledDatesFromAppointments(mockTensSession);

      expect(scheduledDates).toHaveLength(1);
      expect(scheduledDates[0].date).toBe("2026-01-21");
    });

    it("should distribute appointments correctly among multiple sessions of same type", () => {
      // Create two physiotherapy sessions with different body locations
      const physiotherapySession1: CreatedTreatment = {
        id: 1,
        consultationId: 1,
        appointmentId: 1,
        patientId: 1,
        treatmentType: "physiotherapy",
        bodyLocation: "eyes",
        startDate: "2026-01-15T00:00:00.000Z",
        plannedSessions: 2,
        completedSessions: 0,
        status: "scheduled",
        color: "green",
        durationMinutes: 7,
        createdDate: "2026-01-15",
        createdTime: "00:00:00",
        updatedDate: "2026-01-15",
        updatedTime: "00:00:00",
      };

      const physiotherapySession2: CreatedTreatment = {
        id: 2,
        consultationId: 1,
        appointmentId: 1,
        patientId: 1,
        treatmentType: "physiotherapy",
        bodyLocation: "Head",
        startDate: "2026-01-15T00:00:00.000Z",
        plannedSessions: 3,
        completedSessions: 0,
        status: "scheduled",
        color: "blue",
        durationMinutes: 14,
        createdDate: "2026-01-15",
        createdTime: "00:00:00",
        updatedDate: "2026-01-15",
        updatedTime: "00:00:00",
      };

      // Create 5 physiotherapy appointments (2 for session1, 3 for session2)
      const multipleSessionAppointments: AppointmentResponseDto[] = [
        {
          id: 10,
          patientId: 1,
          type: "physiotherapy" as AppointmentType,
          status: "scheduled" as AppointmentStatus,
          scheduledDate: "2026-01-26T00:00:00.000Z",
          scheduledTime: "19:30",
          createdAt: "2026-01-15T00:00:00.000Z",
          updatedAt: "2026-01-15T00:00:00.000Z",
        },
        {
          id: 11,
          patientId: 1,
          type: "physiotherapy" as AppointmentType,
          status: "scheduled" as AppointmentStatus,
          scheduledDate: "2026-02-02T00:00:00.000Z",
          scheduledTime: "19:30",
          createdAt: "2026-01-15T00:00:00.000Z",
          updatedAt: "2026-01-15T00:00:00.000Z",
        },
        {
          id: 13,
          patientId: 1,
          type: "physiotherapy" as AppointmentType,
          status: "scheduled" as AppointmentStatus,
          scheduledDate: "2026-01-26T00:00:00.000Z",
          scheduledTime: "19:30",
          createdAt: "2026-01-15T00:00:00.000Z",
          updatedAt: "2026-01-15T00:00:00.000Z",
        },
        {
          id: 14,
          patientId: 1,
          type: "physiotherapy" as AppointmentType,
          status: "scheduled" as AppointmentStatus,
          scheduledDate: "2026-02-02T00:00:00.000Z",
          scheduledTime: "19:30",
          createdAt: "2026-01-15T00:00:00.000Z",
          updatedAt: "2026-01-15T00:00:00.000Z",
        },
        {
          id: 12,
          patientId: 1,
          type: "physiotherapy" as AppointmentType,
          status: "scheduled" as AppointmentStatus,
          scheduledDate: "2026-02-09T00:00:00.000Z",
          scheduledTime: "19:30",
          createdAt: "2026-01-15T00:00:00.000Z",
          updatedAt: "2026-01-15T00:00:00.000Z",
        },
      ];

      const sessions = [physiotherapySession1, physiotherapySession2];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, multipleSessionAppointments),
      );

      // Get scheduled dates for first session (2 planned)
      const session1Dates = result.current.getScheduledDatesFromAppointments(
        physiotherapySession1,
      );
      expect(session1Dates).toHaveLength(2);
      // Should get first 2 appointments by ID (10, 11)
      expect(session1Dates[0].date).toBe("2026-01-26");
      expect(session1Dates[1].date).toBe("2026-02-02");

      // Get scheduled dates for second session (3 planned)
      const session2Dates = result.current.getScheduledDatesFromAppointments(
        physiotherapySession2,
      );
      expect(session2Dates).toHaveLength(3);
      // Should get next 3 appointments by ID (12, 13, 14)
      expect(session2Dates[0].date).toBe("2026-02-09");
      expect(session2Dates[1].date).toBe("2026-01-26");
      expect(session2Dates[2].date).toBe("2026-02-02");

      // Verify no duplicate dates within same session
      const session1UniqueDates = new Set(session1Dates.map((d) => d.date));
      expect(session1UniqueDates.size).toBe(2);
    });
  });

  describe("memoization", () => {
    it("should memoize grouped sessions", () => {
      const sessions = [mockPhysiotherapySession, mockTensSession];
      const { result, rerender } = renderHook(
        ({ sessions, appointments }) =>
          useCreatedTreatmentsSummary(sessions, appointments),
        {
          initialProps: { sessions, appointments: mockAppointments },
        },
      );

      const firstPhysiotherapy = result.current.physiotherapySessions;
      const firstTens = result.current.tensSessions;

      rerender({ sessions, appointments: mockAppointments });

      expect(result.current.physiotherapySessions).toBe(firstPhysiotherapy);
      expect(result.current.tensSessions).toBe(firstTens);
    });

    it("should recalculate when sessions change", () => {
      const sessions = [mockPhysiotherapySession];
      const { result, rerender } = renderHook(
        ({ sessions, appointments }) =>
          useCreatedTreatmentsSummary(sessions, appointments),
        {
          initialProps: { sessions, appointments: mockAppointments },
        },
      );

      expect(result.current.totalAppointments).toBe(3);

      const newSessions = [...sessions, mockTensSession];
      rerender({ sessions: newSessions, appointments: mockAppointments });

      expect(result.current.totalAppointments).toBe(5);
    });
  });
});
