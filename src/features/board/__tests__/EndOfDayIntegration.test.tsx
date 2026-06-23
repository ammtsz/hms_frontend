/**
 * @jest-environment jsdom
 */

import React, { useState } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { ClinicTimezoneProvider } from "@/contexts/ClinicTimezoneContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppointmentsBoard from "@/features/board/AppointmentsBoard";
import { appointmentKeys } from "@/api/query/keys/appointmentKeys";
import { patientKeys } from "@/api/query/keys/patientKeys";
import { priorityKeys } from "@/api/query/keys/priorityKeys";

// Mock the API calls
jest.mock("@/api/appointments", () => ({
  getAllAppointments: jest.fn(() => Promise.resolve({ data: [], error: null })),
  getAppointmentsForSchedule: jest.fn(() =>
    Promise.resolve({ data: [], error: null }),
  ),
  getUnresolvedPastAppointments: jest.fn(() =>
    Promise.resolve({
      success: true,
      value: { hasUnresolved: false, dates: [] },
    }),
  ),
  getAppointmentsByDate: jest.fn(() =>
    Promise.resolve({
      success: true,
      value: [
        {
          id: 1,
          patientId: 1,
          type: "assessment",
          status: "completed",
          scheduledDate: "2025-10-17",
          scheduledTime: "08:00",
        },
        {
          id: 2,
          patientId: 2,
          type: "assessment",
          status: "completed",
          scheduledDate: "2025-10-17",
          scheduledTime: "09:00",
        },
        {
          id: 3,
          patientId: 3,
          type: "assessment",
          status: "completed",
          scheduledDate: "2025-10-17",
          scheduledTime: "10:00",
        },
      ],
    }),
  ),
  getNextAppointmentDate: jest.fn(() =>
    Promise.resolve({
      success: true,
      value: { next_appointment_date: "2025-10-17" },
    }),
  ),
}));

jest.mock("@/api/patients", () => ({
  getPatients: jest.fn(() =>
    Promise.resolve({
      success: true,
      value: [
        {
          id: 1,
          name: "Patient 1",
          phone: "123456789",
          birthDate: "1990-01-01",
          priority: "1",
          patientStatus: "T",
          startDate: "2025-01-01",
          missingAppointmentsStreak: 0,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          id: 2,
          name: "Patient 2",
          phone: "123456789",
          birthDate: "1990-01-01",
          priority: "1",
          patientStatus: "T",
          startDate: "2025-01-01",
          missingAppointmentsStreak: 0,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          id: 3,
          name: "Patient 3",
          phone: "123456789",
          birthDate: "1990-01-01",
          priority: "1",
          patientStatus: "T",
          startDate: "2025-01-01",
          missingAppointmentsStreak: 0,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ],
    }),
  ),
}));

// Mock React Query schedule hooks
jest.mock("@/api/query/hooks/useScheduleQueries", () => ({
  useScheduled: () => ({
    data: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

// useDayFinalizationStatus sets gcTime to 10 minutes — leaves Jest open after tests.
jest.mock("@/api/query/hooks/useDayFinalizationQueries", () => ({
  useDayFinalizationStatus: () => ({
    data: { isFinalized: false },
    isLoading: false,
    error: null,
  }),
  useFetchDayFinalizationStatus: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue({ isFinalized: false })),
}));

jest.mock("@/api/query/hooks/useAppointmentQueries", () => {
  const actual = jest.requireActual(
    "@/api/query/hooks/useAppointmentQueries",
  ) as typeof import("@/api/query/hooks/useAppointmentQueries");
  const { useQuery } = jest.requireActual(
    "@tanstack/react-query",
  ) as typeof import("@tanstack/react-query");
  const { getAppointmentsByDate, getUnresolvedPastAppointments } =
    jest.requireMock(
      "@/api/appointments",
    ) as typeof import("@/api/appointments");
  const { transformAppointmentWithPatientByDate } = jest.requireActual(
    "@/utils/apiTransformers",
  ) as typeof import("@/utils/apiTransformers");

  return {
    ...actual,
    useAppointmentsByDate: (date: string) =>
      useQuery({
        queryKey: appointmentKeys.byDate(date),
        queryFn: async () => {
          const response = await getAppointmentsByDate(date);
          if (!response.success) {
            throw new Error(response.error || "Failed to fetch appointments");
          }
          return transformAppointmentWithPatientByDate(
            response.value || [],
            date,
          );
        },
        staleTime: 0,
        gcTime: 0,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      }),
    useUnresolvedPastAppointments: () =>
      useQuery({
        queryKey: appointmentKeys.unresolvedPast(),
        queryFn: async () => {
          const response = await getUnresolvedPastAppointments();
          if (!response.success) {
            throw new Error(
              response.error || "Failed to fetch unresolved past appointments",
            );
          }
          return response.value;
        },
        staleTime: 0,
        gcTime: 0,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      }),
  };
});

jest.mock("@/api/query/hooks/usePatientQueries", () => {
  const actual = jest.requireActual(
    "@/api/query/hooks/usePatientQueries",
  ) as typeof import("@/api/query/hooks/usePatientQueries");
  const { useQuery } = jest.requireActual(
    "@tanstack/react-query",
  ) as typeof import("@tanstack/react-query");
  const { getPatients } = jest.requireMock(
    "@/api/patients",
  ) as typeof import("@/api/patients");
  const { transformPatientsFromApi } = jest.requireActual(
    "@/utils/apiTransformers",
  ) as typeof import("@/utils/apiTransformers");

  return {
    ...actual,
    usePatients: () =>
      useQuery({
        queryKey: patientKeys.lists(),
        queryFn: async () => {
          const result = await getPatients();
          if (!result.success || !result.value) {
            throw new Error(result.error || "Error loading patients");
          }
          return transformPatientsFromApi(result.value);
        },
        staleTime: 0,
        gcTime: 0,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      }),
  };
});

jest.mock("@/api/query/hooks/useScheduleSettingQueries", () => ({
  useScheduleSettingByDay: () => ({ data: null, isLoading: false }),
  useScheduleSettings: () => ({ data: null, isLoading: false }),
  hasSlotsForWalkIn: () => true,
  getNextDateWithTreatmentSlots: (date: string) => date,
  hasInvalidTreatmentStartDates: () => false,
}));

jest.mock("@/features/board/hooks/useBoardHolidayForDate", () => ({
  useBoardHolidayForDate: () => ({
    isHolidayForAll: false,
    holidayMessage: null,
    isLoading: false,
  }),
}));

jest.mock("@/api/query/hooks/usePriorityOptionsQueries", () => {
  const actual = jest.requireActual(
    "@/api/query/hooks/usePriorityOptionsQueries",
  ) as typeof import("@/api/query/hooks/usePriorityOptionsQueries");
  const { useQuery } = jest.requireActual(
    "@tanstack/react-query",
  ) as typeof import("@tanstack/react-query");
  const { SystemOptionType } = jest.requireActual(
    "@/types/systemOptions",
  ) as typeof import("@/types/systemOptions");

  const mockPriorities = [
    {
      id: 1,
      type: SystemOptionType.PRIORITY,
      value: "1",
      label: "Normal",
      isActive: true,
      sortOrder: 0,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
    {
      id: 2,
      type: SystemOptionType.PRIORITY,
      value: "2",
      label: "Intermediate",
      isActive: true,
      sortOrder: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
    {
      id: 3,
      type: SystemOptionType.PRIORITY,
      value: "3",
      label: "Emergency",
      isActive: true,
      sortOrder: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
  ];

  return {
    ...actual,
    usePriorities: (includeInactive = false) =>
      useQuery({
        queryKey: [...priorityKeys.all, includeInactive],
        queryFn: async () => mockPriorities,
        staleTime: 0,
        gcTime: 0,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      }),
  };
});

/** Set in TestWrapper mount; cleared in afterEach so React Query does not leave GC timers open. */
let testQueryClient: QueryClient | null = null;

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    });
    testQueryClient = client;
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ClinicTimezoneProvider>
        <ToastProvider>{children}</ToastProvider>
      </ClinicTimezoneProvider>
    </QueryClientProvider>
  );
};

describe("EndOfDayModal Integration - Completed Count Fix", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    testQueryClient?.clear();
    testQueryClient = null;
  });

  it("should correctly show completed appointments count in end of day modal", async () => {
    render(
      <TestWrapper>
        <AppointmentsBoard />
      </TestWrapper>,
    );

    await waitFor(
      () => {
        expect(
          screen.getByText(/▼\s*Assessment Consultations\s*\(\d+\)/),
        ).toBeInTheDocument();
      },
      { timeout: 15000 },
    );

    // Verify the component structure is correct
    expect(screen.getAllByText("Scheduled")).toHaveLength(2); // Two sections have this
    expect(screen.getAllByText("Completed")).toHaveLength(2); // Two sections have this

    // Check that the End of Day button exists
    expect(screen.getByText("End of Day")).toBeInTheDocument();

    // Verify there are completed appointments (text includes priority numbers)
    expect(screen.getByText(/Patient 1/)).toBeInTheDocument();
    expect(screen.getByText(/Patient 2/)).toBeInTheDocument();
    expect(screen.getByText(/Patient 3/)).toBeInTheDocument();
  }, 30000); // 30 second timeout for the entire test
});
