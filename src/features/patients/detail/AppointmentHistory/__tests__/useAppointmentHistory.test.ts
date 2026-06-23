/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, waitFor } from "@testing-library/react";
import { useAppointmentHistory } from "../hooks/useAppointmentHistory";
import { usePatientAppointments } from "@/api/query/hooks/usePatientQueries";
import { useTreatmentsByPatient } from "@/api/query/hooks/useTreatmentsQueries";
import { useConsultations } from "@/api/query/hooks/useConsultationQueries";
import { Patient } from "@/types/types";
import * as appointmentHistoryUtils from "@/utils/appointmentHistoryUtils";

// Mock the hooks
jest.mock("@/api/query/hooks/usePatientQueries");
jest.mock("@/api/query/hooks/useTreatmentsQueries");
jest.mock("@/api/query/hooks/useConsultationQueries");

// Mock the groupHistoryAppointmentsByDate function
jest.mock("@/utils/appointmentHistoryUtils", () => ({
  groupHistoryAppointmentsByDate: jest.fn(),
}));

const mockUsePatientAppointments = usePatientAppointments as jest.MockedFunction<
  typeof usePatientAppointments
>;
const mockUseTreatmentsByPatient =
  useTreatmentsByPatient as jest.MockedFunction<typeof useTreatmentsByPatient>;
const mockUseConsultations = useConsultations as jest.MockedFunction<
  typeof useConsultations
>;
const mockGroupHistoryAppointmentsByDate =
  appointmentHistoryUtils.groupHistoryAppointmentsByDate as jest.MockedFunction<
    typeof appointmentHistoryUtils.groupHistoryAppointmentsByDate
  >;

describe("useAppointmentHistory", () => {
  const mockPatient = {
    id: "1",
    name: "Test Patient",
    previousAppointments: [],
  } as Partial<Patient> as Patient;

  const mockAppointment = {
    id: "att1",
    appointmentId: "att1",
    status: "completed",
    scheduledDate: "2026-01-15",
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
    notes: "",
  };

  const mockGroupedAppointment = {
    date: "2026-01-15",
    appointmentId: "att1",
    appointmentIds: ["att1"],
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
    mockUsePatientAppointments.mockReturnValue({
      data: [mockAppointment as any],
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

    // Mock groupHistoryAppointmentsByDate to return a simple array
    mockGroupHistoryAppointmentsByDate.mockReturnValue([mockGroupedAppointment]);
  });

  it("should return loading state when appointments are loading", () => {
    mockUsePatientAppointments.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() =>
      useAppointmentHistory({
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
      useAppointmentHistory({
        patient: mockPatient,
        statusFilter: "all",
      }),
    );

    expect(result.current.loading).toBe(true);
  });

  it("should return error from appointments query", () => {
    mockUsePatientAppointments.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: "Failed to fetch appointments" },
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() =>
      useAppointmentHistory({
        patient: mockPatient,
        statusFilter: "all",
      }),
    );

    expect(result.current.error).toBe("Failed to fetch appointments");
  });

  it("should return error from treatment sessions query", () => {
    mockUseTreatmentsByPatient.mockReturnValue({
      treatments: [],
      loading: false,
      error: "Failed to fetch sessions",
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() =>
      useAppointmentHistory({
        patient: mockPatient,
        statusFilter: "all",
      }),
    );

    expect(result.current.error).toBe("Failed to fetch sessions");
  });

  it("should filter out scheduled and checked_in appointments from initial filter", () => {
    const completedAppointment = {
      id: "3",
      appointmentId: "3",
      status: "completed" as const,
      scheduledDate: "2026-01-17",
      createdAt: "2026-01-17T10:00:00Z",
      updatedAt: "2026-01-17T10:00:00Z",
      notes: "",
    };

    mockUsePatientAppointments.mockReturnValue({
      data: [
        {
          id: "1",
          appointmentId: "1",
          status: "scheduled" as const,
          scheduledDate: "2026-01-15",
          createdAt: "2026-01-15T10:00:00Z",
          updatedAt: "2026-01-15T10:00:00Z",
          notes: "",
        },
        {
          id: "2",
          appointmentId: "2",
          status: "checked_in" as const,
          scheduledDate: "2026-01-16",
          createdAt: "2026-01-16T10:00:00Z",
          updatedAt: "2026-01-16T10:00:00Z",
          notes: "",
        },
        completedAppointment,
      ] as any,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    mockGroupHistoryAppointmentsByDate.mockReturnValue([
      {
        date: "2026-01-17",
        appointmentId: "3",
        appointmentIds: ["3"],
        notes: "",
        status: "completed" as const,
        createdDate: "2026-01-17",
        updatedDate: "2026-01-17",
        treatments: {},
      },
    ]);

    const { result } = renderHook(() =>
      useAppointmentHistory({
        patient: mockPatient,
        statusFilter: "all",
      }),
    );

    // groupHistoryAppointmentsByDate is called with filtered data
    expect(mockGroupHistoryAppointmentsByDate).toHaveBeenCalled();
    expect(result.current.groupedAppointments).toHaveLength(1);
    expect(result.current.groupedAppointments[0].status).toBe("completed");
  });

  it("should filter by completed status", () => {
    const completedAppointment = {
      id: "1",
      appointmentId: "1",
      status: "completed" as const,
      scheduledDate: "2026-01-15",
      createdAt: "2026-01-15T10:00:00Z",
      updatedAt: "2026-01-15T10:00:00Z",
      notes: "",
    };

    mockUsePatientAppointments.mockReturnValue({
      data: [
        completedAppointment,
        {
          id: "2",
          appointmentId: "2",
          status: "missed" as const,
          scheduledDate: "2026-01-16",
          createdAt: "2026-01-16T10:00:00Z",
          updatedAt: "2026-01-16T10:00:00Z",
          notes: "",
        },
        {
          id: "3",
          appointmentId: "3",
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

    mockGroupHistoryAppointmentsByDate.mockReturnValue([
      {
        date: "2026-01-15",
        appointmentId: "1",
        appointmentIds: ["1"],
        notes: "",
        status: "completed" as const,
        createdDate: "2026-01-15",
        updatedDate: "2026-01-15",
        treatments: {},
      },
    ]);

    const { result } = renderHook(() =>
      useAppointmentHistory({
        patient: mockPatient,
        statusFilter: "completed",
      }),
    );

    expect(result.current.groupedAppointments).toHaveLength(1);
    expect(result.current.groupedAppointments[0].status).toBe("completed");
  });

  it("should filter by missed status", () => {
    const missedAppointment = {
      id: "2",
      appointmentId: "2",
      status: "missed" as const,
      scheduledDate: "2026-01-16",
      createdAt: "2026-01-16T10:00:00Z",
      updatedAt: "2026-01-16T10:00:00Z",
      notes: "",
    };

    mockUsePatientAppointments.mockReturnValue({
      data: [
        {
          id: "1",
          appointmentId: "1",
          status: "completed" as const,
          scheduledDate: "2026-01-15",
          createdAt: "2026-01-15T10:00:00Z",
          updatedAt: "2026-01-15T10:00:00Z",
          notes: "",
        },
        missedAppointment,
        {
          id: "3",
          appointmentId: "3",
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

    mockGroupHistoryAppointmentsByDate.mockReturnValue([
      {
        date: "2026-01-16",
        appointmentId: "2",
        appointmentIds: ["2"],
        notes: "",
        status: "missed" as const,
        createdDate: "2026-01-16",
        updatedDate: "2026-01-16",
        treatments: {},
      },
    ]);

    const { result } = renderHook(() =>
      useAppointmentHistory({
        patient: mockPatient,
        statusFilter: "missed",
      }),
    );

    expect(result.current.groupedAppointments).toHaveLength(1);
    expect(result.current.groupedAppointments[0].status).toBe("missed");
  });

  it("should filter by cancelled status", () => {
    const cancelledAppointment = {
      id: "3",
      appointmentId: "3",
      status: "cancelled" as const,
      scheduledDate: "2026-01-17",
      createdAt: "2026-01-17T10:00:00Z",
      updatedAt: "2026-01-17T10:00:00Z",
      notes: "",
    };

    mockUsePatientAppointments.mockReturnValue({
      data: [
        {
          id: "1",
          appointmentId: "1",
          status: "completed" as const,
          scheduledDate: "2026-01-15",
          createdAt: "2026-01-15T10:00:00Z",
          updatedAt: "2026-01-15T10:00:00Z",
          notes: "",
        },
        {
          id: "2",
          appointmentId: "2",
          status: "missed" as const,
          scheduledDate: "2026-01-16",
          createdAt: "2026-01-16T10:00:00Z",
          updatedAt: "2026-01-16T10:00:00Z",
          notes: "",
        },
        cancelledAppointment,
      ] as any,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    mockGroupHistoryAppointmentsByDate.mockReturnValue([
      {
        date: "2026-01-17",
        appointmentId: "3",
        appointmentIds: ["3"],
        notes: "",
        status: "cancelled" as const,
        createdDate: "2026-01-17",
        updatedDate: "2026-01-17",
        treatments: {},
      },
    ]);

    const { result } = renderHook(() =>
      useAppointmentHistory({
        patient: mockPatient,
        statusFilter: "cancelled",
      }),
    );

    expect(result.current.groupedAppointments).toHaveLength(1);
    expect(result.current.groupedAppointments[0].status).toBe("cancelled");
  });

  it("should handle refresh with animation timing", async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() =>
      useAppointmentHistory({
        patient: mockPatient,
        statusFilter: "all",
      }),
    );

    expect(result.current.isRefreshing).toBe(false);

    // Call handleRefresh
    await waitFor(() => {
      result.current.handleRefresh();
    });

    expect(mockRefetch).toHaveBeenCalledTimes(2); // appointments + treatments

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
      useAppointmentHistory({
        patient: mockPatient,
        statusFilter: "all",
      }),
    );

    expect(result.current.treatments).toEqual(mockTreatments);
    expect(result.current.consultations).toEqual(mockConsultations);
  });

  it("should use patient previous appointments as fallback", () => {
    mockUsePatientAppointments.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    const patientWithAppointments = {
      ...mockPatient,
      previousAppointments: [
        {
          date: "2026-01-15",
          appointmentId: "1",
          status: "completed" as const,
          notes: "",
          createdDate: "2026-01-15",
          updatedDate: "2026-01-15",
        },
      ],
    } as Partial<Patient> as Patient;

    mockGroupHistoryAppointmentsByDate.mockReturnValue([
      {
        date: "2026-01-15",
        appointmentId: "1",
        appointmentIds: ["1"],
        notes: "",
        status: "completed" as const,
        createdDate: "2026-01-15",
        updatedDate: "2026-01-15",
        treatments: { assessment: { notes: "test" } },
      },
    ]);

    const { result } = renderHook(() =>
      useAppointmentHistory({
        patient: patientWithAppointments,
        statusFilter: "all",
      }),
    );

    expect(result.current.groupedAppointments.length).toBeGreaterThan(0);
  });
});
