/**
 * Agenda React Query Hooks Tests
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import {
  useAgendaAttendances,
  useAgenda,
  useScheduledAgenda,
  useRemovePatientFromAgenda,
  useAddPatientToAgenda,
  useRefreshAgenda,
} from "../useAgendaQueries";
import * as attendancesApi from "@/api/attendances";
import { AttendanceType, AttendanceStatus } from "@/api/types";
import { Priority } from "@/types/types";

// Mock the API
jest.mock("@/api/attendances");
const mockedAttendancesApi = attendancesApi as jest.Mocked<
  typeof attendancesApi
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
const createMockAttendanceAgendaDto = (overrides = {}) => ({
  id: 1,
  patientId: 1,
  patientName: "Test Patient",
  patientPriority: "1" as Priority,
  type: AttendanceType.ASSESSMENT,
  scheduledDate: "2025-10-27",
  status: AttendanceStatus.SCHEDULED,
  ...overrides,
});

const createMockAttendanceResponseDto = (overrides = {}) => ({
  id: 1,
  patientId: 1,
  type: AttendanceType.ASSESSMENT,
  scheduledDate: "2025-10-27",
  scheduledTime: "09:00",
  status: AttendanceStatus.SCHEDULED,
  createdAt: "2025-10-27T08:00:00Z",
  updatedAt: "2025-10-27T08:00:00Z",
  ...overrides,
});

describe("useAgendaQueries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useAgendaAttendances", () => {
    it("should fetch agenda attendances successfully", async () => {
      const mockData = [createMockAttendanceAgendaDto()];

      mockedAttendancesApi.getAttendancesForAgenda.mockResolvedValueOnce({
        success: true,
        value: mockData,
      });

      const { result } = renderHook(() => useAgendaAttendances(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedAttendancesApi.getAttendancesForAgenda).toHaveBeenCalledWith(
        undefined,
      );
    });

    it("should fetch agenda attendances with filters", async () => {
      const filters = {
        statuses: [AttendanceStatus.SCHEDULED],
        type: "assessment",
        limit: 10,
        fromDate: "2025-01-01",
        toDate: "2025-01-31",
      };
      const mockData = [createMockAttendanceAgendaDto()];

      mockedAttendancesApi.getAttendancesForAgenda.mockResolvedValueOnce({
        success: true,
        value: mockData,
      });

      const { result } = renderHook(() => useAgendaAttendances(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockedAttendancesApi.getAttendancesForAgenda).toHaveBeenCalledWith(
        filters,
      );
    });

    it("does not fetch when date range contains invalid dates", async () => {
      const filters = {
        fromDate: "2025-0",
        toDate: "2025-01-31",
      };

      const { result } = renderHook(() => useAgendaAttendances(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      expect(
        mockedAttendancesApi.getAttendancesForAgenda,
      ).not.toHaveBeenCalled();
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("should handle API error", async () => {
      mockedAttendancesApi.getAttendancesForAgenda
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

      const { result } = renderHook(() => useAgendaAttendances(), {
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
      mockedAttendancesApi.getAttendancesForAgenda
        .mockResolvedValueOnce({
          success: false,
        })
        .mockResolvedValueOnce({
          success: false,
        })
        .mockResolvedValueOnce({
          success: false,
        });

      const { result } = renderHook(() => useAgendaAttendances(), {
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

  describe("useAgenda", () => {
    it("should transform assessment attendances data", async () => {
      const mockData = [
        createMockAttendanceAgendaDto({
          id: 1,
          patientId: 1,
          patientName: "Patient 1",
          patientPriority: "1",
          type: AttendanceType.ASSESSMENT,
          scheduledDate: "2025-10-27",
        }),
        createMockAttendanceAgendaDto({
          id: 2,
          patientId: 2,
          patientName: "Patient 2",
          patientPriority: "2",
          type: AttendanceType.ASSESSMENT,
          scheduledDate: "2025-10-28",
        }),
      ];

      mockedAttendancesApi.getAttendancesForAgenda.mockResolvedValueOnce({
        success: true,
        value: mockData,
      });

      const { result } = renderHook(() => useAgenda(), {
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
                attendanceId: 1,
                attendanceType: "assessment",
                attendanceStatus: AttendanceStatus.SCHEDULED,
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
                attendanceId: 2,
                attendanceType: "assessment",
                attendanceStatus: AttendanceStatus.SCHEDULED,
              },
            ],
          },
        ],
        physiotherapy: [],
      });

      expect(result.current.agenda).toEqual({
        assessment: [
          {
            date: "2025-10-27", // String in YYYY-MM-DD format
            patients: [
              {
                id: "1",
                name: "Patient 1",
                priority: "1",
                attendanceId: 1,
                attendanceType: "assessment",
                attendanceStatus: AttendanceStatus.SCHEDULED,
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
                attendanceId: 2,
                attendanceType: "assessment",
                attendanceStatus: AttendanceStatus.SCHEDULED,
              },
            ],
          },
        ],
        physiotherapy: [],
      });
    });

    it("should transform physiotherapy and tens attendances data", async () => {
      const mockData = [
        createMockAttendanceAgendaDto({
          id: 1,
          patientId: 1,
          patientName: "Physiotherapy Patient",
          patientPriority: "1",
          type: AttendanceType.PHYSIOTHERAPY,
          scheduledDate: "2025-10-27",
        }),
        createMockAttendanceAgendaDto({
          id: 2,
          patientId: 2,
          patientName: "TENS Patient",
          patientPriority: "2",
          type: AttendanceType.TENS,
          scheduledDate: "2025-10-27",
        }),
      ];

      mockedAttendancesApi.getAttendancesForAgenda.mockResolvedValueOnce({
        success: true,
        value: mockData,
      });

      const { result } = renderHook(() => useAgenda(), {
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
                attendanceId: 1,
                attendanceType: "physiotherapy",
                attendanceStatus: AttendanceStatus.SCHEDULED,
              },
              {
                id: "2",
                name: "TENS Patient",
                priority: "2",
                attendanceId: 2,
                attendanceType: "tens",
                attendanceStatus: AttendanceStatus.SCHEDULED,
              },
            ],
          },
        ],
      });
    });

    it("should return empty agenda when no data", async () => {
      mockedAttendancesApi.getAttendancesForAgenda.mockResolvedValueOnce({
        success: true,
        value: [],
      });

      const { result } = renderHook(() => useAgenda(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        assessment: [],
        physiotherapy: [],
      });
      expect(result.current.agenda).toEqual({
        assessment: [],
        physiotherapy: [],
      });
    });

    it("should return default agenda when data is undefined", async () => {
      mockedAttendancesApi.getAttendancesForAgenda
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

      const { result } = renderHook(() => useAgenda(), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 5000 },
      );

      expect(result.current.data).toBeUndefined();
      expect(result.current.agenda).toEqual({
        assessment: [],
        physiotherapy: [],
      });
    });

    it("should group multiple patients on same date", async () => {
      const mockData = [
        createMockAttendanceAgendaDto({
          id: 1,
          patientId: 1,
          patientName: "Patient 1",
          patientPriority: "1",
          type: AttendanceType.ASSESSMENT,
          scheduledDate: "2025-10-27",
        }),
        createMockAttendanceAgendaDto({
          id: 2,
          patientId: 2,
          patientName: "Patient 2",
          patientPriority: "2",
          type: AttendanceType.ASSESSMENT,
          scheduledDate: "2025-10-27",
        }),
      ];

      mockedAttendancesApi.getAttendancesForAgenda.mockResolvedValueOnce({
        success: true,
        value: mockData,
      });

      const { result } = renderHook(() => useAgenda(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.assessment).toHaveLength(1);
      expect(result.current.data?.assessment[0].patients).toHaveLength(2);
    });
  });

  describe("useScheduledAgenda", () => {
    it("should fetch scheduled agenda with correct filters", async () => {
      const mockData = [
        createMockAttendanceAgendaDto({
          status: AttendanceStatus.SCHEDULED,
        }),
      ];

      mockedAttendancesApi.getAttendancesForAgenda.mockResolvedValueOnce({
        success: true,
        value: mockData,
      });

      const { result } = renderHook(() => useScheduledAgenda(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedAttendancesApi.getAttendancesForAgenda).toHaveBeenCalledWith(
        {
          statuses: [AttendanceStatus.SCHEDULED],
        },
      );
    });
  });

  describe("useRemovePatientFromAgenda", () => {
    it("should remove patient successfully and invalidate queries", async () => {
      const queryClient = new QueryClient({
        defaultOptions: { mutations: { retry: false } },
      });
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      mockedAttendancesApi.deleteAttendance.mockResolvedValueOnce({
        success: true,
        value: undefined,
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useRemovePatientFromAgenda(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync(1);
      });

      expect(mockedAttendancesApi.deleteAttendance).toHaveBeenCalledWith("1");
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["agenda"],
      });
    });

    it("should handle API error", async () => {
      mockedAttendancesApi.deleteAttendance.mockResolvedValueOnce({
        success: false,
        error: "Delete failed",
      });

      const { result } = renderHook(() => useRemovePatientFromAgenda(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync(1)).rejects.toThrow(
        "Delete failed",
      );
    });

    it("should handle API error without message", async () => {
      mockedAttendancesApi.deleteAttendance.mockResolvedValueOnce({
        success: false,
      });

      const { result } = renderHook(() => useRemovePatientFromAgenda(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync(1)).rejects.toThrow(
        "Failed to remove patient from agenda",
      );
    });

    it("should handle onError callback", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockedAttendancesApi.deleteAttendance.mockResolvedValueOnce({
        success: false,
        error: "Delete failed",
      });

      const { result } = renderHook(() => useRemovePatientFromAgenda(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.mutateAsync(1);
      } catch {
        // Error expected
      }

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error removing patient from agenda:",
          new Error("Delete failed"),
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe("useAddPatientToAgenda", () => {
    const attendanceData = {
      patientId: 1,
      type: AttendanceType.ASSESSMENT,
      scheduledDate: "2025-10-27",
      scheduledTime: "09:00",
    };

    it("should add patient successfully and invalidate queries", async () => {
      const queryClient = new QueryClient({
        defaultOptions: { mutations: { retry: false } },
      });
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      mockedAttendancesApi.createAttendance.mockResolvedValueOnce({
        success: true,
        value: createMockAttendanceResponseDto(),
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useAddPatientToAgenda(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync(attendanceData);
      });

      expect(mockedAttendancesApi.createAttendance).toHaveBeenCalledWith(
        attendanceData,
      );
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["agenda"],
      });
    });

    it("should handle API error", async () => {
      mockedAttendancesApi.createAttendance.mockResolvedValueOnce({
        success: false,
        error: "Creation failed",
      });

      const { result } = renderHook(() => useAddPatientToAgenda(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync(attendanceData)).rejects.toThrow(
        "Creation failed",
      );
    });

    it("should handle API error without message", async () => {
      mockedAttendancesApi.createAttendance.mockResolvedValueOnce({
        success: false,
      });

      const { result } = renderHook(() => useAddPatientToAgenda(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync(attendanceData)).rejects.toThrow(
        "Failed to add patient to agenda",
      );
    });

    it("should handle onError callback", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockedAttendancesApi.createAttendance.mockResolvedValueOnce({
        success: false,
        error: "Creation failed",
      });

      const { result } = renderHook(() => useAddPatientToAgenda(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.mutateAsync(attendanceData);
      } catch {
        // Error expected
      }

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error adding patient to agenda:",
          new Error("Creation failed"),
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe("useRefreshAgenda", () => {
    it("should invalidate agenda queries", () => {
      const queryClient = new QueryClient();
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useRefreshAgenda(), { wrapper });

      act(() => {
        result.current();
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["agenda"],
      });
    });
  });
});
