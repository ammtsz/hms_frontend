/**
 * Schedule React Query Hooks Tests
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import {
  useScheduleAppointments,
  useSchedule,
  useScheduled,
  useRemovePatientFromSchedule,
  useAddPatientToSchedule,
  useRefreshSchedule,
} from "../useScheduleQueries";
import * as appointmentsApi from "@/api/appointments";
import { AppointmentType, AppointmentStatus } from "@/api/types";
import { Priority } from "@/types/types";

// Mock the API
jest.mock("@/api/appointments");
const mockedAppointmentsApi = appointmentsApi as jest.Mocked<
  typeof appointmentsApi
>;

// Mock console methods
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

// Mock data factories - using camelCase since axios interceptor transforms responses
const createMockAppointmentScheduleDto = (overrides = {}) => ({
  id: 1,
  patientId: 1,
  patientName: "Test Patient",
  patientPriority: "1" as Priority,
  type: AppointmentType.ASSESSMENT,
  scheduledDate: "2025-10-27",
  status: AppointmentStatus.SCHEDULED,
  ...overrides,
});

const createMockAppointmentResponseDto = (overrides = {}) => ({
  id: 1,
  patientId: 1,
  type: AppointmentType.ASSESSMENT,
  scheduledDate: "2025-10-27",
  scheduledTime: "09:00",
  status: AppointmentStatus.SCHEDULED,
  createdAt: "2025-10-27T08:00:00Z",
  updatedAt: "2025-10-27T08:00:00Z",
  ...overrides,
});

describe("useScheduleQueries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useScheduleAppointments", () => {
    it("should fetch schedule appointments successfully", async () => {
      const mockData = [createMockAppointmentScheduleDto()];

      mockedAppointmentsApi.getAppointmentsForSchedule.mockResolvedValueOnce({
        success: true,
        value: mockData,
      });

      const { result } = renderHook(() => useScheduleAppointments(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedAppointmentsApi.getAppointmentsForSchedule).toHaveBeenCalledWith(
        undefined,
      );
    });

    it("should fetch schedule appointments with filters", async () => {
      const filters = {
        statuses: [AppointmentStatus.SCHEDULED],
        type: "assessment",
        limit: 10,
        fromDate: "2025-01-01",
        toDate: "2025-01-31",
      };
      const mockData = [createMockAppointmentScheduleDto()];

      mockedAppointmentsApi.getAppointmentsForSchedule.mockResolvedValueOnce({
        success: true,
        value: mockData,
      });

      const { result } = renderHook(() => useScheduleAppointments(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedAppointmentsApi.getAppointmentsForSchedule).toHaveBeenCalledWith(
        filters,
      );
    });

    it("does not fetch when date range contains invalid dates", async () => {
      const filters = {
        fromDate: "2025-0",
        toDate: "2025-01-31",
      };

      const { result } = renderHook(() => useScheduleAppointments(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      expect(
        mockedAppointmentsApi.getAppointmentsForSchedule,
      ).not.toHaveBeenCalled();
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("should handle API error", async () => {
      mockedAppointmentsApi.getAppointmentsForSchedule
        .mockResolvedValueOnce({
          success: false,
          error: "API Error",
        })
        .mockResolvedValueOnce({
          success: false,
          error: "API Error",
        })
        .mockResolvedValueOnce({
          success: false,
          error: "API Error",
        });

      const { result } = renderHook(() => useScheduleAppointments(), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 5000 },
      );

      expect(result.current.error).toEqual(new Error("API Error"));
    });

    it("should handle API error without message", async () => {
      mockedAppointmentsApi.getAppointmentsForSchedule
        .mockResolvedValueOnce({
          success: false,
        })
        .mockResolvedValueOnce({
          success: false,
        })
        .mockResolvedValueOnce({
          success: false,
        });

      const { result } = renderHook(() => useScheduleAppointments(), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 5000 },
      );

      expect(result.current.error).toEqual(
        new Error("Failed to load schedule"),
      );
    });
  });

  describe("useSchedule", () => {
    it("should transform assessment appointments data", async () => {
      const mockData = [
        createMockAppointmentScheduleDto({
          id: 1,
          patientId: 1,
          patientName: "Patient 1",
          patientPriority: "1",
          type: AppointmentType.ASSESSMENT,
          scheduledDate: "2025-10-27",
        }),
        createMockAppointmentScheduleDto({
          id: 2,
          patientId: 2,
          patientName: "Patient 2",
          patientPriority: "2",
          type: AppointmentType.ASSESSMENT,
          scheduledDate: "2025-10-28",
        }),
      ];

      mockedAppointmentsApi.getAppointmentsForSchedule.mockResolvedValueOnce({
        success: true,
        value: mockData,
      });

      const { result } = renderHook(() => useSchedule(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        assessment: [
          {
            date: "2025-10-27", // String in YYYY-MM-DD format
            patients: [
              {
                id: "1",
                name: "Patient 1",
                priority: "1",
                appointmentId: 1,
                appointmentType: "assessment",
                appointmentStatus: AppointmentStatus.SCHEDULED,
              },
            ],
          },
          {
            date: "2025-10-28", // String in YYYY-MM-DD format
            patients: [
              {
                id: "2",
                name: "Patient 2",
                priority: "2",
                appointmentId: 2,
                appointmentType: "assessment",
                appointmentStatus: AppointmentStatus.SCHEDULED,
              },
            ],
          },
        ],
        physiotherapy: [],
      });

      expect(result.current.schedule).toEqual({
        assessment: [
          {
            date: "2025-10-27", // String in YYYY-MM-DD format
            patients: [
              {
                id: "1",
                name: "Patient 1",
                priority: "1",
                appointmentId: 1,
                appointmentType: "assessment",
                appointmentStatus: AppointmentStatus.SCHEDULED,
              },
            ],
          },
          {
            date: "2025-10-28", // String in YYYY-MM-DD format
            patients: [
              {
                id: "2",
                name: "Patient 2",
                priority: "2",
                appointmentId: 2,
                appointmentType: "assessment",
                appointmentStatus: AppointmentStatus.SCHEDULED,
              },
            ],
          },
        ],
        physiotherapy: [],
      });
    });

    it("should transform physiotherapy and tens appointments data", async () => {
      const mockData = [
        createMockAppointmentScheduleDto({
          id: 1,
          patientId: 1,
          patientName: "Physiotherapy Patient",
          patientPriority: "1",
          type: AppointmentType.PHYSIOTHERAPY,
          scheduledDate: "2025-10-27",
        }),
        createMockAppointmentScheduleDto({
          id: 2,
          patientId: 2,
          patientName: "TENS Patient",
          patientPriority: "2",
          type: AppointmentType.TENS,
          scheduledDate: "2025-10-27",
        }),
      ];

      mockedAppointmentsApi.getAppointmentsForSchedule.mockResolvedValueOnce({
        success: true,
        value: mockData,
      });

      const { result } = renderHook(() => useSchedule(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        assessment: [],
        physiotherapy: [
          {
            date: "2025-10-27", // String in YYYY-MM-DD format
            patients: [
              {
                id: "1",
                name: "Physiotherapy Patient",
                priority: "1",
                appointmentId: 1,
                appointmentType: "physiotherapy",
                appointmentStatus: AppointmentStatus.SCHEDULED,
              },
              {
                id: "2",
                name: "TENS Patient",
                priority: "2",
                appointmentId: 2,
                appointmentType: "tens",
                appointmentStatus: AppointmentStatus.SCHEDULED,
              },
            ],
          },
        ],
      });
    });

    it("should return empty schedule when no data", async () => {
      mockedAppointmentsApi.getAppointmentsForSchedule.mockResolvedValueOnce({
        success: true,
        value: [],
      });

      const { result } = renderHook(() => useSchedule(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        assessment: [],
        physiotherapy: [],
      });
      expect(result.current.schedule).toEqual({
        assessment: [],
        physiotherapy: [],
      });
    });

    it("should return default schedule when data is undefined", async () => {
      mockedAppointmentsApi.getAppointmentsForSchedule
        .mockResolvedValueOnce({
          success: false,
          error: "Network error",
        })
        .mockResolvedValueOnce({
          success: false,
          error: "Network error",
        })
        .mockResolvedValueOnce({
          success: false,
          error: "Network error",
        });

      const { result } = renderHook(() => useSchedule(), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 5000 },
      );

      expect(result.current.data).toBeUndefined();
      expect(result.current.schedule).toEqual({
        assessment: [],
        physiotherapy: [],
      });
    });

    it("should group multiple patients on same date", async () => {
      const mockData = [
        createMockAppointmentScheduleDto({
          id: 1,
          patientId: 1,
          patientName: "Patient 1",
          patientPriority: "1",
          type: AppointmentType.ASSESSMENT,
          scheduledDate: "2025-10-27",
        }),
        createMockAppointmentScheduleDto({
          id: 2,
          patientId: 2,
          patientName: "Patient 2",
          patientPriority: "2",
          type: AppointmentType.ASSESSMENT,
          scheduledDate: "2025-10-27",
        }),
      ];

      mockedAppointmentsApi.getAppointmentsForSchedule.mockResolvedValueOnce({
        success: true,
        value: mockData,
      });

      const { result } = renderHook(() => useSchedule(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.assessment).toHaveLength(1);
      expect(result.current.data?.assessment[0].patients).toHaveLength(2);
    });
  });

  describe("useScheduled", () => {
    it("should fetch scheduled schedule with correct filters", async () => {
      const mockData = [
        createMockAppointmentScheduleDto({
          status: AppointmentStatus.SCHEDULED,
        }),
      ];

      mockedAppointmentsApi.getAppointmentsForSchedule.mockResolvedValueOnce({
        success: true,
        value: mockData,
      });

      const { result } = renderHook(() => useScheduled(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedAppointmentsApi.getAppointmentsForSchedule).toHaveBeenCalledWith(
        {
          statuses: [AppointmentStatus.SCHEDULED],
        },
      );
    });
  });

  describe("useRemovePatientFromSchedule", () => {
    it("should remove patient successfully and invalidate queries", async () => {
      const queryClient = new QueryClient({
        defaultOptions: { mutations: { retry: false } },
      });
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      mockedAppointmentsApi.deleteAppointment.mockResolvedValueOnce({
        success: true,
        value: undefined,
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useRemovePatientFromSchedule(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync(1);
      });

      expect(mockedAppointmentsApi.deleteAppointment).toHaveBeenCalledWith("1");
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["schedule"],
      });
    });

    it("should handle API error", async () => {
      mockedAppointmentsApi.deleteAppointment.mockResolvedValueOnce({
        success: false,
        error: "Delete failed",
      });

      const { result } = renderHook(() => useRemovePatientFromSchedule(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync(1)).rejects.toThrow(
        "Delete failed",
      );
    });

    it("should handle API error without message", async () => {
      mockedAppointmentsApi.deleteAppointment.mockResolvedValueOnce({
        success: false,
      });

      const { result } = renderHook(() => useRemovePatientFromSchedule(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync(1)).rejects.toThrow(
        "Failed to remove patient from schedule",
      );
    });

    it("should handle onError callback", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockedAppointmentsApi.deleteAppointment.mockResolvedValueOnce({
        success: false,
        error: "Delete failed",
      });

      const { result } = renderHook(() => useRemovePatientFromSchedule(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.mutateAsync(1);
      } catch {
        // Error expected
      }

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error removing patient from schedule:",
          new Error("Delete failed"),
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe("useAddPatientToSchedule", () => {
    const appointmentData = {
      patientId: 1,
      type: AppointmentType.ASSESSMENT,
      scheduledDate: "2025-10-27",
      scheduledTime: "09:00",
    };

    it("should add patient successfully and invalidate queries", async () => {
      const queryClient = new QueryClient({
        defaultOptions: { mutations: { retry: false } },
      });
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      mockedAppointmentsApi.createAppointment.mockResolvedValueOnce({
        success: true,
        value: createMockAppointmentResponseDto(),
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useAddPatientToSchedule(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync(appointmentData);
      });

      expect(mockedAppointmentsApi.createAppointment).toHaveBeenCalledWith(
        appointmentData,
      );
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["schedule"],
      });
    });

    it("should handle API error", async () => {
      mockedAppointmentsApi.createAppointment.mockResolvedValueOnce({
        success: false,
        error: "Creation failed",
      });

      const { result } = renderHook(() => useAddPatientToSchedule(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync(appointmentData)).rejects.toThrow(
        "Creation failed",
      );
    });

    it("should handle API error without message", async () => {
      mockedAppointmentsApi.createAppointment.mockResolvedValueOnce({
        success: false,
      });

      const { result } = renderHook(() => useAddPatientToSchedule(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync(appointmentData)).rejects.toThrow(
        "Failed to add patient to schedule",
      );
    });

    it("should handle onError callback", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockedAppointmentsApi.createAppointment.mockResolvedValueOnce({
        success: false,
        error: "Creation failed",
      });

      const { result } = renderHook(() => useAddPatientToSchedule(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.mutateAsync(appointmentData);
      } catch {
        // Error expected
      }

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error adding patient to schedule:",
          new Error("Creation failed"),
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe("useRefreshSchedule", () => {
    it("should invalidate schedule queries", () => {
      const queryClient = new QueryClient();
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useRefreshSchedule(), { wrapper });

      act(() => {
        result.current();
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["schedule"],
      });
    });
  });
});
