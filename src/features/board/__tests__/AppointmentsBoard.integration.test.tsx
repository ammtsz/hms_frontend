import React from "react";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import AppointmentsBoard from "../index";
import { ClinicTimezoneProvider } from "@/contexts/ClinicTimezoneContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { appointmentKeys } from "@/api/query/keys/appointmentKeys";
import { patientKeys } from "@/api/query/keys/patientKeys";

jest.mock("@/utils/timezoneDate", () => ({
  getTodayInTimezone: () => "2025-01-15",
  getTodayClinic: () => "2025-01-15",
  formatDateClinic: (date?: string | Date | null) =>
    typeof date === "string" ? date : "2025-01-15",
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/board",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/contexts/ToastContext", () => ({
  useToast: () => ({
    toasts: [],
    showToast: jest.fn(),
    removeToast: jest.fn(),
  }),
}));

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

// useBoardWorkflow calls useDayFinalizationStatus on mount.
// That hook sets gcTime to 10 minutes and can schedule long timers that keep Jest alive.
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

// React Query auto-refetch on focus/mount can leave pending timers/event listeners in Jest.
// For this integration test, we keep the same query logic but disable refetch triggers so Jest exits cleanly.
jest.mock("@/api/query/hooks/useAppointmentQueries", () => {
  const actual = jest.requireActual(
    "@/api/query/hooks/useAppointmentQueries",
  ) as typeof import("@/api/query/hooks/useAppointmentQueries");
  const { useQuery } = jest.requireActual(
    "@tanstack/react-query",
  ) as typeof import("@tanstack/react-query");
  const { getAppointmentsByDate, getUnresolvedPastAppointments } =
    jest.requireMock("@/api/appointments") as typeof import("@/api/appointments");
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
        staleTime: 5 * 60 * 1000,
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
        staleTime: 2 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      }),
  };
});

// usePatients uses an explicit gcTime (10 minutes) which can schedule timers that keep Jest alive.
// In this integration test, we override it to use gcTime=0 and disable refetch triggers.
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

// Mock the API functions used by appointment data hooks.
jest.mock("@/api/appointments", () => ({
  getAppointmentsByDate: jest.fn(),
  getNextAppointmentDate: jest.fn(),
  getUnresolvedPastAppointments: jest.fn(),
}));

// Mock the API functions that PatientsContext uses
jest.mock("@/api/patients", () => ({
  getPatients: jest.fn(),
}));

import { getAppointmentsByDate, getNextAppointmentDate } from "@/api/appointments";
import { getUnresolvedPastAppointments } from "@/api/appointments";
import { getPatients } from "@/api/patients";
import {
  AppointmentType,
  AppointmentStatus,
  PatientPriority,
  PatientStatus,
} from "@/api/types";

const mockGetAppointmentsByDate = getAppointmentsByDate as jest.MockedFunction<
  typeof getAppointmentsByDate
>;
const mockGetNextAppointmentDate = getNextAppointmentDate as jest.MockedFunction<
  typeof getNextAppointmentDate
>;
const mockGetUnresolvedPastAppointments =
  getUnresolvedPastAppointments as jest.MockedFunction<
    typeof getUnresolvedPastAppointments
  >;
const mockGetPatients = getPatients as jest.MockedFunction<typeof getPatients>;

describe("AppointmentsBoard Integration Tests", () => {
  const mockAppointmentsData = [
    {
      id: 1,
      patientId: 1,
      type: "assessment" as AppointmentType,
      status: AppointmentStatus.SCHEDULED,
      scheduledDate: "2025-01-15",
      scheduledTime: "09:00",
      createdAt: "2025-01-01T08:00:00.000Z",
      updatedAt: "2025-01-10T08:00:00.000Z",
      Patient: {
        id: 1,
        name: "John Smith",
        priority: "1",
      },
    },
    {
      id: 2,
      patientId: 2,
      type: "physiotherapy" as AppointmentType,
      status: AppointmentStatus.CHECKED_IN,
      scheduledDate: "2025-01-15",
      scheduledTime: "10:00",
      createdAt: "2025-01-02T08:00:00.000Z",
      updatedAt: "2025-01-11T08:00:00.000Z",
      Patient: {
        id: 2,
        name: "Emily Williams",
        priority: "2",
      },
    },
  ];

  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          // Avoid timers keeping Jest alive.
          gcTime: Infinity,
          staleTime: Infinity,
          refetchOnWindowFocus: false,
          refetchOnMount: false,
        },
        mutations: { retry: false },
      },
    });

    // Setup default successful API responses
    mockGetAppointmentsByDate.mockResolvedValue({
      success: true,
      value: mockAppointmentsData,
    });

    // Setup patients API response
    mockGetPatients.mockResolvedValue({
      success: true,
      value: [
        {
          id: 1,
          name: "John Smith",
          priority: PatientPriority.LEVEL_1,
          patientStatus: PatientStatus.IN_TREATMENT,
          startDate: "2025-01-01",
          missingAppointmentsStreak: 0,
          createdAt: "2025-01-01T08:00:00.000Z",
          updatedAt: "2025-01-01T08:00:00.000Z",
        },
        {
          id: 2,
          name: "Emily Williams",
          priority: PatientPriority.LEVEL_2,
          patientStatus: PatientStatus.IN_TREATMENT,
          startDate: "2025-01-02",
          missingAppointmentsStreak: 0,
          createdAt: "2025-01-02T08:00:00.000Z",
          updatedAt: "2025-01-02T08:00:00.000Z",
        },
      ],
    });

    mockGetNextAppointmentDate.mockResolvedValue({
      success: true,
      value: { nextDate: "2025-01-15" },
    });

    mockGetUnresolvedPastAppointments.mockResolvedValue({
      success: true,
      value: { hasUnresolved: false, dates: [] },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
    queryClient.clear();
    queryClient.getQueryCache().clear();
    queryClient.getMutationCache().clear();
  });

  const renderWithProvider = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ClinicTimezoneProvider>
          <AppointmentsBoard {...props} />
        </ClinicTimezoneProvider>
      </QueryClientProvider>,
    );
  };

  describe("Real Component Integration", () => {
    it("should render with real useBoardState hook", async () => {
      renderWithProvider();

      // Wait for initial data load
      await waitFor(
        () => {
          expect(
            screen.queryByText("Loading appointments..."),
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Check that the date is displayed
      expect(screen.getByDisplayValue("2025-01-15")).toBeInTheDocument();

      // Check that sections are rendered
      expect(
        screen.getByRole("button", { name: /Consultation/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Physiotherapy and TENS/i }),
      ).toBeInTheDocument();
    });

    it("should render real AppointmentColumn components", async () => {
      renderWithProvider();

      await waitFor(
        () => {
          expect(
            screen.queryByText("Loading appointments..."),
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Check that real AppointmentColumn components are rendered
      expect(screen.getAllByText("Scheduled")).toHaveLength(2); // Both assessment and physiotherapy have this column
      expect(screen.getAllByText("Waiting Room")).toHaveLength(2);
      expect(screen.getAllByText("In Progress")).toHaveLength(2);
      expect(screen.getAllByText("Completed")).toHaveLength(2); // "Completed" not "Completed"
    });

    it("should handle section collapse with real functionality", async () => {
      renderWithProvider();

      await waitFor(
        () => {
          expect(
            screen.queryByText("Loading appointments..."),
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const assessmentButton = screen.getByRole("button", {
        name: /Consultation/i,
      });
      fireEvent.click(assessmentButton);

      // Should change to collapsed state
      await waitFor(() => {
        expect(assessmentButton.textContent).toMatch(/^▶\s/);
      });
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle API errors with real error states", async () => {
      mockGetAppointmentsByDate.mockRejectedValue(new Error("Network error"));

      renderWithProvider();

      await waitFor(
        () => {
          expect(
            screen.getByText("Error loading appointments"),
          ).toBeInTheDocument(); // Error appears in error state
        },
        { timeout: 3000 },
      );
    });
  });

  describe("Component Composition", () => {
    it("should properly compose all child components", async () => {
      renderWithProvider();

      await waitFor(
        () => {
          expect(
            screen.queryByText("Loading appointments..."),
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Check that the main container has proper structure
      const mainHeading = screen.getByText(/Selected date:/);
      expect(mainHeading).toBeInTheDocument();

      // Check date input
      const dateInput = screen.getByDisplayValue("2025-01-15");
      expect(dateInput).toBeInTheDocument();

      // Check sections
      const assessmentSection = screen.getByRole("button", {
        name: /Consultation/i,
      });
      const physiotherapySection = screen.getByRole("button", {
        name: /Physiotherapy and TENS/i,
      });
      expect(assessmentSection).toBeInTheDocument();
      expect(physiotherapySection).toBeInTheDocument();
    });
  });
});
