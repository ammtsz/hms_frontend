import { renderHook } from "@testing-library/react";
import { useCreatedTreatmentsSummary } from "../useCreatedTreatmentsSummary";
import type { CreatedTreatment } from "../../components/CreatedTreatmentsConfirmation";
import type { AttendanceResponseDto, AttendanceType, AttendanceStatus } from "@/api/types";

describe("useCreatedTreatmentsSummary", () => {
  const mockPhysiotherapySession: CreatedTreatment = {
    id: 1,
    consultationId: 1,
    attendanceId: 1,
    patientId: 1,
    treatmentType: "physiotherapy",
    bodyLocation: "Cabeça",
    startDate: "2026-01-15T00:00:00.000Z",
    plannedSessions: 3,
    completedSessions: 0,
    status: "scheduled",
    color: "Azul",
    durationMinutes: 14,
    createdDate: "2026-01-15",
    createdTime: "00:00:00",
    updatedDate: "2026-01-15",
    updatedTime: "00:00:00",
  };

  const mockTensSession: CreatedTreatment = {
    id: 2,
    consultationId: 2,
    attendanceId: 1,
    patientId: 1,
    treatmentType: "tens",
    bodyLocation: "Coluna",
    startDate: "2026-01-15T00:00:00.000Z",
    plannedSessions: 2,
    completedSessions: 0,
    status: "scheduled",
    createdDate: "2026-01-15",
    createdTime: "00:00:00",
    updatedDate: "2026-01-15",
    updatedTime: "00:00:00",
  };

  const mockAttendances: AttendanceResponseDto[] = [
    {
      id: 101,
      patientId: 1,
      type: "physiotherapy" as AttendanceType,
      status: "scheduled" as AttendanceStatus,
      scheduledDate: "2026-01-21T00:00:00.000Z",
      scheduledTime: "14:00",
      createdAt: "2026-01-15T00:00:00.000Z",
      updatedAt: "2026-01-15T00:00:00.000Z",
    },
    {
      id: 102,
      patientId: 1,
      type: "physiotherapy" as AttendanceType,
      status: "scheduled" as AttendanceStatus,
      scheduledDate: "2026-01-28T00:00:00.000Z",
      scheduledTime: "14:00",
      createdAt: "2026-01-15T00:00:00.000Z",
      updatedAt: "2026-01-15T00:00:00.000Z",
    },
    {
      id: 103,
      patientId: 1,
      type: "assessment" as AttendanceType,
      status: "scheduled" as AttendanceStatus,
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
        useCreatedTreatmentsSummary(sessions, mockAttendances)
      );

      expect(result.current.physiotherapySessions).toHaveLength(1);
      expect(result.current.physiotherapySessions[0].treatmentType).toBe(
        "physiotherapy"
      );
      expect(result.current.tensSessions).toHaveLength(1);
      expect(result.current.tensSessions[0].treatmentType).toBe("tens");
    });

    it("should handle empty sessions array", () => {
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary([], mockAttendances)
      );

      expect(result.current.physiotherapySessions).toHaveLength(0);
      expect(result.current.tensSessions).toHaveLength(0);
    });

    it("should handle only physiotherapy sessions", () => {
      const sessions = [mockPhysiotherapySession];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, mockAttendances)
      );

      expect(result.current.physiotherapySessions).toHaveLength(1);
      expect(result.current.tensSessions).toHaveLength(0);
    });

    it("should handle only tens sessions", () => {
      const sessions = [mockTensSession];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, mockAttendances)
      );

      expect(result.current.physiotherapySessions).toHaveLength(0);
      expect(result.current.tensSessions).toHaveLength(1);
    });
  });

  describe("total appointments calculation", () => {
    it("should calculate total appointments correctly", () => {
      const sessions = [mockPhysiotherapySession, mockTensSession];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, mockAttendances)
      );

      // 3 physiotherapy sessions + 2 tens sessions = 5 total
      expect(result.current.totalAppointments).toBe(5);
    });

    it("should return 0 for empty sessions", () => {
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary([], mockAttendances)
      );

      expect(result.current.totalAppointments).toBe(0);
    });
  });

  describe("next assessment consultation", () => {
    it("should find next assessment consultation", () => {
      const sessions = [mockPhysiotherapySession];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, mockAttendances)
      );

      expect(result.current.nextAssessmentConsultation).not.toBeNull();
      expect(result.current.nextAssessmentConsultation?.type).toBe("assessment");
      expect(result.current.nextAssessmentConsultation?.id).toBe(103);
    });

    it("should return null when no attendances provided", () => {
      const sessions = [mockPhysiotherapySession];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, undefined)
      );

      expect(result.current.nextAssessmentConsultation).toBeNull();
    });

    it("should return null when no assessment consultations exist", () => {
      const sessions = [mockPhysiotherapySession];
      const attendances = mockAttendances.filter((a) => a.type !== "assessment");
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, attendances)
      );

      expect(result.current.nextAssessmentConsultation).toBeNull();
    });

    it("should only return scheduled assessment consultations", () => {
      const sessions = [mockPhysiotherapySession];
      const attendancesWithCompleted: AttendanceResponseDto[] = [
        ...mockAttendances,
        {
          id: 104,
          patientId: 1,
          type: "assessment" as AttendanceType,
          status: "completed" as AttendanceStatus,
          scheduledDate: "2026-01-10T00:00:00.000Z",
          scheduledTime: "10:00",
          createdAt: "2026-01-15T00:00:00.000Z",
          updatedAt: "2026-01-15T00:00:00.000Z",
        },
      ];

      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, attendancesWithCompleted)
      );

      expect(result.current.nextAssessmentConsultation?.status).toBe(
        "scheduled"
      );
      expect(result.current.nextAssessmentConsultation?.id).toBe(103);
    });
  });

  describe("getScheduledDatesFromAttendances", () => {
    it("should return scheduled dates from attendances", () => {
      const sessions = [mockPhysiotherapySession];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, mockAttendances)
      );

      const scheduledDates =
        result.current.getScheduledDatesFromAttendances(mockPhysiotherapySession);

      expect(scheduledDates).toHaveLength(2);
      expect(scheduledDates[0].date).toBe("2026-01-21");
      expect(scheduledDates[0].time).toBe("14:00");
    });

    it("should prefer session rows over attendances when sessions are present", () => {
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
        useCreatedTreatmentsSummary(sessions, mockAttendances),
      );

      const scheduledDates =
        result.current.getScheduledDatesFromAttendances(sessions[0]);

      expect(scheduledDates.map((d) => d.date)).toEqual([
        "2026-06-06",
        "2026-06-13",
        "2026-06-20",
      ]);
    });

    it("should fallback to calculated dates when no attendances", () => {
      const sessions = [mockPhysiotherapySession];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, undefined)
      );

      const scheduledDates =
        result.current.getScheduledDatesFromAttendances(mockPhysiotherapySession);

      // Should return 3 dates (planned sessions)
      expect(scheduledDates).toHaveLength(3);
      // Fallback uses clinic calendar dates (YYYY-MM-DD), not UTC ISO
      expect(scheduledDates[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should limit results to planned sessions", () => {
      const sessionWith2Planned = { ...mockPhysiotherapySession, plannedSessions: 2 };
      const sessions = [sessionWith2Planned];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, mockAttendances)
      );

      const scheduledDates = result.current.getScheduledDatesFromAttendances(
        sessionWith2Planned
      );

      expect(scheduledDates).toHaveLength(2);
    });

    it("should match attendances by treatment type", () => {
      const sessions = [mockTensSession];
      const tensAttendances: AttendanceResponseDto[] = [
        {
          id: 201,
          patientId: 1,
          type: "tens" as AttendanceType,
          status: "scheduled" as AttendanceStatus,
          scheduledDate: "2026-01-21T00:00:00.000Z",
          scheduledTime: "15:00",
          createdAt: "2026-01-15T00:00:00.000Z",
          updatedAt: "2026-01-15T00:00:00.000Z",
        },
      ];

      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, tensAttendances)
      );

      const scheduledDates =
        result.current.getScheduledDatesFromAttendances(mockTensSession);

      expect(scheduledDates).toHaveLength(1);
      expect(scheduledDates[0].date).toBe("2026-01-21");
    });

    it("should distribute attendances correctly among multiple sessions of same type", () => {
      // Create two physiotherapy sessions with different body locations
      const physiotherapySession1: CreatedTreatment = {
        id: 1,
        consultationId: 1,
        attendanceId: 1,
        patientId: 1,
        treatmentType: "physiotherapy",
        bodyLocation: "olhos",
        startDate: "2026-01-15T00:00:00.000Z",
        plannedSessions: 2,
        completedSessions: 0,
        status: "scheduled",
        color: "verde",
        durationMinutes: 7,
        createdDate: "2026-01-15",
        createdTime: "00:00:00",
        updatedDate: "2026-01-15",
        updatedTime: "00:00:00",
      };

      const physiotherapySession2: CreatedTreatment = {
        id: 2,
        consultationId: 1,
        attendanceId: 1,
        patientId: 1,
        treatmentType: "physiotherapy",
        bodyLocation: "cabeça",
        startDate: "2026-01-15T00:00:00.000Z",
        plannedSessions: 3,
        completedSessions: 0,
        status: "scheduled",
        color: "azul",
        durationMinutes: 14,
        createdDate: "2026-01-15",
        createdTime: "00:00:00",
        updatedDate: "2026-01-15",
        updatedTime: "00:00:00",
      };

      // Create 5 physiotherapy attendances (2 for session1, 3 for session2)
      const multipleSessionAttendances: AttendanceResponseDto[] = [
        {
          id: 10,
          patientId: 1,
          type: "physiotherapy" as AttendanceType,
          status: "scheduled" as AttendanceStatus,
          scheduledDate: "2026-01-26T00:00:00.000Z",
          scheduledTime: "19:30",
          createdAt: "2026-01-15T00:00:00.000Z",
          updatedAt: "2026-01-15T00:00:00.000Z",
        },
        {
          id: 11,
          patientId: 1,
          type: "physiotherapy" as AttendanceType,
          status: "scheduled" as AttendanceStatus,
          scheduledDate: "2026-02-02T00:00:00.000Z",
          scheduledTime: "19:30",
          createdAt: "2026-01-15T00:00:00.000Z",
          updatedAt: "2026-01-15T00:00:00.000Z",
        },
        {
          id: 13,
          patientId: 1,
          type: "physiotherapy" as AttendanceType,
          status: "scheduled" as AttendanceStatus,
          scheduledDate: "2026-01-26T00:00:00.000Z",
          scheduledTime: "19:30",
          createdAt: "2026-01-15T00:00:00.000Z",
          updatedAt: "2026-01-15T00:00:00.000Z",
        },
        {
          id: 14,
          patientId: 1,
          type: "physiotherapy" as AttendanceType,
          status: "scheduled" as AttendanceStatus,
          scheduledDate: "2026-02-02T00:00:00.000Z",
          scheduledTime: "19:30",
          createdAt: "2026-01-15T00:00:00.000Z",
          updatedAt: "2026-01-15T00:00:00.000Z",
        },
        {
          id: 12,
          patientId: 1,
          type: "physiotherapy" as AttendanceType,
          status: "scheduled" as AttendanceStatus,
          scheduledDate: "2026-02-09T00:00:00.000Z",
          scheduledTime: "19:30",
          createdAt: "2026-01-15T00:00:00.000Z",
          updatedAt: "2026-01-15T00:00:00.000Z",
        },
      ];

      const sessions = [physiotherapySession1, physiotherapySession2];
      const { result } = renderHook(() =>
        useCreatedTreatmentsSummary(sessions, multipleSessionAttendances)
      );

      // Get scheduled dates for first session (2 planned)
      const session1Dates = result.current.getScheduledDatesFromAttendances(
        physiotherapySession1
      );
      expect(session1Dates).toHaveLength(2);
      // Should get first 2 attendances by ID (10, 11)
      expect(session1Dates[0].date).toBe("2026-01-26");
      expect(session1Dates[1].date).toBe("2026-02-02");

      // Get scheduled dates for second session (3 planned)
      const session2Dates = result.current.getScheduledDatesFromAttendances(
        physiotherapySession2
      );
      expect(session2Dates).toHaveLength(3);
      // Should get next 3 attendances by ID (12, 13, 14)
      expect(session2Dates[0].date).toBe("2026-02-09");
      expect(session2Dates[1].date).toBe("2026-01-26");
      expect(session2Dates[2].date).toBe("2026-02-02");

      // Verify no duplicate dates within same session
      const session1UniqueDates = new Set(session1Dates.map(d => d.date));
      expect(session1UniqueDates.size).toBe(2);
    });
  });

  describe("memoization", () => {
    it("should memoize grouped sessions", () => {
      const sessions = [mockPhysiotherapySession, mockTensSession];
      const { result, rerender } = renderHook(
        ({ sessions, attendances }) =>
          useCreatedTreatmentsSummary(sessions, attendances),
        {
          initialProps: { sessions, attendances: mockAttendances },
        }
      );

      const firstPhysiotherapy = result.current.physiotherapySessions;
      const firstTens = result.current.tensSessions;

      rerender({ sessions, attendances: mockAttendances });

      expect(result.current.physiotherapySessions).toBe(firstPhysiotherapy);
      expect(result.current.tensSessions).toBe(firstTens);
    });

    it("should recalculate when sessions change", () => {
      const sessions = [mockPhysiotherapySession];
      const { result, rerender } = renderHook(
        ({ sessions, attendances }) =>
          useCreatedTreatmentsSummary(sessions, attendances),
        {
          initialProps: { sessions, attendances: mockAttendances },
        }
      );

      expect(result.current.totalAppointments).toBe(3);

      const newSessions = [...sessions, mockTensSession];
      rerender({ sessions: newSessions, attendances: mockAttendances });

      expect(result.current.totalAppointments).toBe(5);
    });
  });
});
