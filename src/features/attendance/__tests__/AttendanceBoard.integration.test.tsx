import React from "react";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import AttendanceBoard from "../index";
import { ClinicTimezoneProvider } from "@/contexts/ClinicTimezoneContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { attendanceKeys } from "@/api/query/keys/attendanceKeys";
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
  usePathname: () => "/attendance",
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

jest.mock("@/features/attendance/hooks/useAttendanceHolidayForDate", () => ({
  useAttendanceHolidayForDate: () => ({
    isHolidayForAll: false,
    holidayMessage: null,
    isLoading: false,
  }),
}));

// useAttendanceWorkflow calls useDayFinalizationStatus on mount.
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
jest.mock("@/api/query/hooks/useAttendanceQueries", () => {
  const actual = jest.requireActual(
    "@/api/query/hooks/useAttendanceQueries",
  ) as typeof import("@/api/query/hooks/useAttendanceQueries");
  const { useQuery } = jest.requireActual(
    "@tanstack/react-query",
  ) as typeof import("@tanstack/react-query");
  const { getAttendancesByDate, getUnresolvedPastAttendances } =
    jest.requireMock("@/api/attendances") as typeof import("@/api/attendances");
  const { transformAttendanceWithPatientByDate } = jest.requireActual(
    "@/utils/apiTransformers",
  ) as typeof import("@/utils/apiTransformers");

  return {
    ...actual,
    useAttendancesByDate: (date: string) =>
      useQuery({
        queryKey: attendanceKeys.byDate(date),
        queryFn: async () => {
          const response = await getAttendancesByDate(date);
          if (!response.success) {
            throw new Error(response.error || "Failed to fetch attendances");
          }
          return transformAttendanceWithPatientByDate(
            response.value || [],
            date,
          );
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      }),
    useUnresolvedPastAttendances: () =>
      useQuery({
        queryKey: attendanceKeys.unresolvedPast(),
        queryFn: async () => {
          const response = await getUnresolvedPastAttendances();
          if (!response.success) {
            throw new Error(
              response.error || "Failed to fetch unresolved past attendances",
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

// Mock the API functions used by attendance data hooks.
jest.mock("@/api/attendances", () => ({
  getAttendancesByDate: jest.fn(),
  getNextAttendanceDate: jest.fn(),
  getUnresolvedPastAttendances: jest.fn(),
}));

// Mock the API functions that PatientsContext uses
jest.mock("@/api/patients", () => ({
  getPatients: jest.fn(),
}));

import { getAttendancesByDate, getNextAttendanceDate } from "@/api/attendances";
import { getUnresolvedPastAttendances } from "@/api/attendances";
import { getPatients } from "@/api/patients";
import {
  AttendanceType,
  AttendanceStatus,
  PatientPriority,
  PatientStatus,
} from "@/api/types";

const mockGetAttendancesByDate = getAttendancesByDate as jest.MockedFunction<
  typeof getAttendancesByDate
>;
const mockGetNextAttendanceDate = getNextAttendanceDate as jest.MockedFunction<
  typeof getNextAttendanceDate
>;
const mockGetUnresolvedPastAttendances =
  getUnresolvedPastAttendances as jest.MockedFunction<
    typeof getUnresolvedPastAttendances
  >;
const mockGetPatients = getPatients as jest.MockedFunction<typeof getPatients>;

describe("AttendanceBoard Integration Tests", () => {
  const mockAttendancesData = [
    {
      id: 1,
      patientId: 1,
      type: "assessment" as AttendanceType,
      status: AttendanceStatus.SCHEDULED,
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
      type: "physiotherapy" as AttendanceType,
      status: AttendanceStatus.CHECKED_IN,
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
    mockGetAttendancesByDate.mockResolvedValue({
      success: true,
      value: mockAttendancesData,
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

    mockGetNextAttendanceDate.mockResolvedValue({
      success: true,
      value: { nextDate: "2025-01-15" },
    });

    mockGetUnresolvedPastAttendances.mockResolvedValue({
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
          <AttendanceBoard {...props} />
        </ClinicTimezoneProvider>
      </QueryClientProvider>,
    );
  };

  describe("Real Component Integration", () => {
    it("should render with real useAttendanceBoardState hook", async () => {
      renderWithProvider();

      // Wait for initial data load
      await waitFor(
        () => {
          expect(
            screen.queryByText("Loading attendances..."),
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

    it("should render real AttendanceColumn components", async () => {
      renderWithProvider();

      await waitFor(
        () => {
          expect(
            screen.queryByText("Loading attendances..."),
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Check that real AttendanceColumn components are rendered
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
            screen.queryByText("Loading attendances..."),
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
      mockGetAttendancesByDate.mockRejectedValue(new Error("Network error"));

      renderWithProvider();

      await waitFor(
        () => {
          expect(
            screen.getByText("Error loading attendances"),
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
            screen.queryByText("Loading attendances..."),
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
