/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, waitFor } from "@testing-library/react";
import { useAttendanceHistory } from "../hooks/useAttendanceHistory";
import { usePatientAttendances } from "@/api/query/hooks/usePatientQueries";
import { useTreatmentsByPatient } from "@/api/query/hooks/useTreatmentsQueries";
import { useConsultations } from "@/api/query/hooks/useConsultationQueries";
import { Patient } from "@/types/types";
import * as attendanceHistoryUtils from "@/utils/attendanceHistoryUtils";

// Mock the hooks
jest.mock("@/api/query/hooks/usePatientQueries");
jest.mock("@/api/query/hooks/useTreatmentsQueries");
jest.mock("@/api/query/hooks/useConsultationQueries");

// Mock the groupHistoryAttendancesByDate function
jest.mock("@/utils/attendanceHistoryUtils", () => ({
  groupHistoryAttendancesByDate: jest.fn(),
}));

const mockUsePatientAttendances = usePatientAttendances as jest.MockedFunction<
  typeof usePatientAttendances
>;
const mockUseTreatmentsByPatient =
  useTreatmentsByPatient as jest.MockedFunction<typeof useTreatmentsByPatient>;
const mockUseConsultations = useConsultations as jest.MockedFunction<
  typeof useConsultations
>;
const mockGroupHistoryAttendancesByDate =
  attendanceHistoryUtils.groupHistoryAttendancesByDate as jest.MockedFunction<
    typeof attendanceHistoryUtils.groupHistoryAttendancesByDate
  >;

describe("useAttendanceHistory", () => {
  const mockPatient = {
    id: "1",
    name: "Test Patient",
    previousAttendances: [],
  } as Partial<Patient> as Patient;

  const mockAttendance = {
    id: "att1",
    attendanceId: "att1",
    status: "completed",
    scheduledDate: "2026-01-15",
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
    notes: "",
  };

  const mockGroupedAttendance = {
    date: "2026-01-15",
    attendanceId: "att1",
    attendanceIds: ["att1"],
    notes: "",
    status: "completed" as const,
    createdDate: "2026-01-15",
    updatedDate: "2026-01-15",
    treatments: {},
  };

  const mockRefetch = jest.fn().mockResolvedValue({});

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock returns
    mockUsePatientAttendances.mockReturnValue({
      data: [mockAttendance as any],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    mockUseTreatmentsByPatient.mockReturnValue({
      treatments: [],
      loading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    mockUseConsultations.mockReturnValue({
      data: [],
    } as any);

    // Mock groupHistoryAttendancesByDate to return a simple array
    mockGroupHistoryAttendancesByDate.mockReturnValue([mockGroupedAttendance]);
  });

  it("should return loading state when attendances are loading", () => {
    mockUsePatientAttendances.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() =>
      useAttendanceHistory({
        patient: mockPatient,
        statusFilter: "all",
      }),
    );

    expect(result.current.loading).toBe(true);
  });

  it("should return loading state when treatment sessions are loading", () => {
    mockUseTreatmentsByPatient.mockReturnValue({
      treatments: [],
      loading: true,
      error: null,
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() =>
      useAttendanceHistory({
        patient: mockPatient,
        statusFilter: "all",
      }),
    );

    expect(result.current.loading).toBe(true);
  });

  it("should return error from attendances query", () => {
    mockUsePatientAttendances.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: "Failed to fetch attendances" },
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() =>
      useAttendanceHistory({
        patient: mockPatient,
        statusFilter: "all",
      }),
    );

    expect(result.current.error).toBe("Failed to fetch attendances");
  });

  it("should return error from treatment sessions query", () => {
    mockUseTreatmentsByPatient.mockReturnValue({
      treatments: [],
      loading: false,
      error: "Failed to fetch sessions",
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() =>
      useAttendanceHistory({
        patient: mockPatient,
        statusFilter: "all",
      }),
    );

    expect(result.current.error).toBe("Failed to fetch sessions");
  });

  it("should filter out scheduled and checked_in attendances from initial filter", () => {
    const completedAttendance = {
      id: "3",
      attendanceId: "3",
      status: "completed" as const,
      scheduledDate: "2026-01-17",
      createdAt: "2026-01-17T10:00:00Z",
      updatedAt: "2026-01-17T10:00:00Z",
      notes: "",
    };

    mockUsePatientAttendances.mockReturnValue({
      data: [
        {
          id: "1",
          attendanceId: "1",
          status: "scheduled" as const,
          scheduledDate: "2026-01-15",
          createdAt: "2026-01-15T10:00:00Z",
          updatedAt: "2026-01-15T10:00:00Z",
          notes: "",
        },
        {
          id: "2",
          attendanceId: "2",
          status: "checked_in" as const,
          scheduledDate: "2026-01-16",
          createdAt: "2026-01-16T10:00:00Z",
          updatedAt: "2026-01-16T10:00:00Z",
          notes: "",
        },
        completedAttendance,
      ] as any,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    mockGroupHistoryAttendancesByDate.mockReturnValue([
      {
        date: "2026-01-17",
        attendanceId: "3",
        attendanceIds: ["3"],
        notes: "",
        status: "completed" as const,
        createdDate: "2026-01-17",
        updatedDate: "2026-01-17",
        treatments: {},
      },
    ]);

    const { result } = renderHook(() =>
      useAttendanceHistory({
        patient: mockPatient,
        statusFilter: "all",
      }),
    );

    // groupHistoryAttendancesByDate is called with filtered data
    expect(mockGroupHistoryAttendancesByDate).toHaveBeenCalled();
    expect(result.current.groupedAttendances).toHaveLength(1);
    expect(result.current.groupedAttendances[0].status).toBe("completed");
  });

  it("should filter by completed status", () => {
    const completedAttendance = {
      id: "1",
      attendanceId: "1",
      status: "completed" as const,
      scheduledDate: "2026-01-15",
      createdAt: "2026-01-15T10:00:00Z",
      updatedAt: "2026-01-15T10:00:00Z",
      notes: "",
    };

    mockUsePatientAttendances.mockReturnValue({
      data: [
        completedAttendance,
        {
          id: "2",
          attendanceId: "2",
          status: "missed" as const,
          scheduledDate: "2026-01-16",
          createdAt: "2026-01-16T10:00:00Z",
          updatedAt: "2026-01-16T10:00:00Z",
          notes: "",
        },
        {
          id: "3",
          attendanceId: "3",
          status: "cancelled" as const,
          scheduledDate: "2026-01-17",
          createdAt: "2026-01-17T10:00:00Z",
          updatedAt: "2026-01-17T10:00:00Z",
          notes: "",
        },
      ] as any,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    mockGroupHistoryAttendancesByDate.mockReturnValue([
      {
        date: "2026-01-15",
        attendanceId: "1",
        attendanceIds: ["1"],
        notes: "",
        status: "completed" as const,
        createdDate: "2026-01-15",
        updatedDate: "2026-01-15",
        treatments: {},
      },
    ]);

    const { result } = renderHook(() =>
      useAttendanceHistory({
        patient: mockPatient,
        statusFilter: "completed",
      }),
    );

    expect(result.current.groupedAttendances).toHaveLength(1);
    expect(result.current.groupedAttendances[0].status).toBe("completed");
  });

  it("should filter by missed status", () => {
    const missedAttendance = {
      id: "2",
      attendanceId: "2",
      status: "missed" as const,
      scheduledDate: "2026-01-16",
      createdAt: "2026-01-16T10:00:00Z",
      updatedAt: "2026-01-16T10:00:00Z",
      notes: "",
    };

    mockUsePatientAttendances.mockReturnValue({
      data: [
        {
          id: "1",
          attendanceId: "1",
          status: "completed" as const,
          scheduledDate: "2026-01-15",
          createdAt: "2026-01-15T10:00:00Z",
          updatedAt: "2026-01-15T10:00:00Z",
          notes: "",
        },
        missedAttendance,
        {
          id: "3",
          attendanceId: "3",
          status: "cancelled" as const,
          scheduledDate: "2026-01-17",
          createdAt: "2026-01-17T10:00:00Z",
          updatedAt: "2026-01-17T10:00:00Z",
          notes: "",
        },
      ] as any,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    mockGroupHistoryAttendancesByDate.mockReturnValue([
      {
        date: "2026-01-16",
        attendanceId: "2",
        attendanceIds: ["2"],
        notes: "",
        status: "missed" as const,
        createdDate: "2026-01-16",
        updatedDate: "2026-01-16",
        treatments: {},
      },
    ]);

    const { result } = renderHook(() =>
      useAttendanceHistory({
        patient: mockPatient,
        statusFilter: "missed",
      }),
    );

    expect(result.current.groupedAttendances).toHaveLength(1);
    expect(result.current.groupedAttendances[0].status).toBe("missed");
  });

  it("should filter by cancelled status", () => {
    const cancelledAttendance = {
      id: "3",
      attendanceId: "3",
      status: "cancelled" as const,
      scheduledDate: "2026-01-17",
      createdAt: "2026-01-17T10:00:00Z",
      updatedAt: "2026-01-17T10:00:00Z",
      notes: "",
    };

    mockUsePatientAttendances.mockReturnValue({
      data: [
        {
          id: "1",
          attendanceId: "1",
          status: "completed" as const,
          scheduledDate: "2026-01-15",
          createdAt: "2026-01-15T10:00:00Z",
          updatedAt: "2026-01-15T10:00:00Z",
          notes: "",
        },
        {
          id: "2",
          attendanceId: "2",
          status: "missed" as const,
          scheduledDate: "2026-01-16",
          createdAt: "2026-01-16T10:00:00Z",
          updatedAt: "2026-01-16T10:00:00Z",
          notes: "",
        },
        cancelledAttendance,
      ] as any,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    mockGroupHistoryAttendancesByDate.mockReturnValue([
      {
        date: "2026-01-17",
        attendanceId: "3",
        attendanceIds: ["3"],
        notes: "",
        status: "cancelled" as const,
        createdDate: "2026-01-17",
        updatedDate: "2026-01-17",
        treatments: {},
      },
    ]);

    const { result } = renderHook(() =>
      useAttendanceHistory({
        patient: mockPatient,
        statusFilter: "cancelled",
      }),
    );

    expect(result.current.groupedAttendances).toHaveLength(1);
    expect(result.current.groupedAttendances[0].status).toBe("cancelled");
  });

  it("should handle refresh with animation timing", async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() =>
      useAttendanceHistory({
        patient: mockPatient,
        statusFilter: "all",
      }),
    );

    expect(result.current.isRefreshing).toBe(false);

    // Call handleRefresh
    await waitFor(() => {
      result.current.handleRefresh();
    });

    expect(mockRefetch).toHaveBeenCalledTimes(2); // attendances + treatments

    // After 200ms, isRefreshing should be reset to false
    await waitFor(() => {
      jest.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });

    jest.useRealTimers();
  });

  it("should return treatments and consultations", () => {
    const mockTreatments = [
      { id: "s1", treatmentType: "physiotherapy" },
      { id: "s2", treatmentType: "tens" },
    ];

    const mockConsultations = [{ id: "r1", type: "assessment" }];

    mockUseTreatmentsByPatient.mockReturnValue({
      treatments: mockTreatments as any,
      loading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    mockUseConsultations.mockReturnValue({
      data: mockConsultations as any,
    } as any);

    const { result } = renderHook(() =>
      useAttendanceHistory({
        patient: mockPatient,
        statusFilter: "all",
      }),
    );

    expect(result.current.treatments).toEqual(mockTreatments);
    expect(result.current.consultations).toEqual(mockConsultations);
  });

  it("should use patient previous attendances as fallback", () => {
    mockUsePatientAttendances.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    const patientWithAttendances = {
      ...mockPatient,
      previousAttendances: [
        {
          date: "2026-01-15",
          attendanceId: "1",
          status: "completed" as const,
          notes: "",
          createdDate: "2026-01-15",
          updatedDate: "2026-01-15",
        },
      ],
    } as Partial<Patient> as Patient;

    mockGroupHistoryAttendancesByDate.mockReturnValue([
      {
        date: "2026-01-15",
        attendanceId: "1",
        attendanceIds: ["1"],
        notes: "",
        status: "completed" as const,
        createdDate: "2026-01-15",
        updatedDate: "2026-01-15",
        treatments: { assessment: { notes: "test" } },
      },
    ]);

    const { result } = renderHook(() =>
      useAttendanceHistory({
        patient: patientWithAttendances,
        statusFilter: "all",
      }),
    );

    expect(result.current.groupedAttendances.length).toBeGreaterThan(0);
  });
});
