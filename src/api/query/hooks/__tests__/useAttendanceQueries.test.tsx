/**
 * useAttendanceQueries Tests
 *
 * Comprehensive test suite for all attendance-related React Query hooks
 * including server state management, CRUD operations, and endOfDay workflow.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import {
  useAttendancesByDate,
  useNextAttendanceDate,
  useCreateAttendance,
  useUpdateAttendance,
  useCompleteAttendance,
  useMarkAttendanceAsMissed,
  useDeleteAttendance,
  useCheckInAttendance,
  useRefreshAttendances,
  useHandleIncompleteAttendances,
  useHandleAbsenceJustifications,
} from "../useAttendanceQueries";
import { attendanceKeys } from "@/api/query/keys/attendanceKeys";
import * as attendancesApi from "@/api/attendances";
import { AttendanceStatusDetail } from "@/types/types";
import { AttendanceType, AttendanceStatus } from "@/api/types";

// Mock the API
jest.mock("@/api/attendances");
const mockApi = attendancesApi as jest.Mocked<typeof attendancesApi>;

// Mock transformers
jest.mock("@/utils/apiTransformers", () => ({
  transformAttendanceWithPatientByDate: jest.fn(() => ({
    assessment: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
    physiotherapy: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
    tens: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
  })),
}));

// Helper to create mock attendance response
const createMockAttendanceResponse = (overrides = {}) => ({
  id: 123,
  status: AttendanceStatus.SCHEDULED,
  patientId: 1,
  type: AttendanceType.ASSESSMENT,
  scheduledDate: "2024-01-15",
  scheduledTime: "09:00",
  createdAt: "2024-01-15T08:00:00Z",
  updatedAt: "2024-01-15T09:00:00Z",
  ...overrides,
});

// Helper to create mock AttendanceStatusDetail
const createMockAttendanceStatusDetail = (
  overrides = {},
): AttendanceStatusDetail => ({
  attendanceId: 1,
  name: "Test Patient",
  priority: "3",
  ...overrides,
});

describe("useAttendanceQueries", () => {
  let queryClient: QueryClient;

  const createWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    mockApi.getAttendancesByDate.mockReset();
  });

  describe("useAttendancesByDate", () => {
    it("should fetch attendances for a specific date", async () => {
      const mockDate = "2024-01-15";
      const mockResponse = {
        success: true,
        value: [
          {
            id: 1,
            patientId: 1,
            patientName: "Test Patient",
            status: AttendanceStatus.SCHEDULED,
            type: AttendanceType.ASSESSMENT,
            scheduledDate: "2024-01-15",
            scheduledTime: "09:00",
            createdAt: "2024-01-15T08:00:00Z",
            updatedAt: "2024-01-15T08:00:00Z",
          },
        ],
      };

      mockApi.getAttendancesByDate.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAttendancesByDate(mockDate), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.getAttendancesByDate).toHaveBeenCalledWith(mockDate);
      expect(result.current.data).toBeDefined();
    });

    it("should handle fetch errors gracefully", async () => {
      const mockDate = "2024-01-15";
      mockApi.getAttendancesByDate.mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const { result } = renderHook(() => useAttendancesByDate(mockDate), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("does not fetch when date string is invalid", async () => {
      const { result } = renderHook(() => useAttendancesByDate("2025-0"), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      expect(mockApi.getAttendancesByDate).not.toHaveBeenCalled();
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  describe("useNextAttendanceDate", () => {
    it("should fetch next attendance date", async () => {
      const mockResponse = {
        success: true,
        value: { nextDate: "2024-01-16" },
      };

      mockApi.getNextAttendanceDate.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useNextAttendanceDate(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe("2024-01-16");
    });

    it("should fallback to today when no next date available", async () => {
      mockApi.getNextAttendanceDate.mockResolvedValue({
        success: true,
        value: undefined,
      });

      const { result } = renderHook(() => useNextAttendanceDate(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toMatch(/\d{4}-\d{2}-\d{2}/); // Today's date format
    });

    it("should handle API error and fallback to today", async () => {
      mockApi.getNextAttendanceDate.mockRejectedValue(
        new Error("Network error"),
      );

      const { result } = renderHook(() => useNextAttendanceDate(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toMatch(/\d{4}-\d{2}-\d{2}/); // Today's date format
    });
  });

  describe("useCreateAttendance", () => {
    it("should create new attendance successfully", async () => {
      const mockResponse = {
        success: true,
        value: createMockAttendanceResponse({ id: 123 }),
      };

      mockApi.createAttendance.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateAttendance(), {
        wrapper: createWrapper,
      });

      const createParams = {
        patientId: 1,
        attendanceType: AttendanceType.ASSESSMENT,
        scheduledDate: "2024-01-15",
      };

      await waitFor(async () => {
        await result.current.mutateAsync(createParams);
      });

      expect(mockApi.createAttendance).toHaveBeenCalledWith({
        patientId: 1,
        type: AttendanceType.ASSESSMENT,
        scheduledDate: "2024-01-15",
        scheduledTime: "09:00",
        parentAttendanceId: undefined,
        status: undefined,
      });
    });

    it("should forward parentAttendanceId for return consultations (IN_TREATMENT)", async () => {
      const mockResponse = {
        success: true,
        value: createMockAttendanceResponse({
          id: 456,
          parentAttendanceId: 42,
        }),
      };
      mockApi.createAttendance.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateAttendance(), {
        wrapper: createWrapper,
      });

      await waitFor(async () => {
        await result.current.mutateAsync({
          patientId: 1,
          attendanceType: AttendanceType.ASSESSMENT,
          scheduledDate: "2024-01-20",
          parentAttendanceId: 42,
        });
      });

      expect(mockApi.createAttendance).toHaveBeenCalledWith({
        patientId: 1,
        type: AttendanceType.ASSESSMENT,
        scheduledDate: "2024-01-20",
        scheduledTime: "09:00",
        parentAttendanceId: 42,
        status: undefined,
      });
    });

    it("should handle creation errors", async () => {
      mockApi.createAttendance.mockResolvedValue({
        success: false,
        error: "Patient not found",
      });

      const { result } = renderHook(() => useCreateAttendance(), {
        wrapper: createWrapper,
      });

      const createParams = {
        patientId: 999,
        attendanceType: AttendanceType.ASSESSMENT,
      };

      await expect(result.current.mutateAsync(createParams)).rejects.toThrow(
        "Patient not found",
      );
    });
  });

  describe("useUpdateAttendance", () => {
    it("should update attendance status", async () => {
      const mockResponse = {
        success: true,
        value: createMockAttendanceResponse({
          id: 123,
          status: AttendanceStatus.CHECKED_IN,
        }),
      };

      mockApi.updateAttendance.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateAttendance(), {
        wrapper: createWrapper,
      });

      const updateParams = {
        id: "123",
        status: AttendanceStatus.CHECKED_IN,
      };

      await waitFor(async () => {
        await result.current.mutateAsync(updateParams);
      });

      expect(mockApi.updateAttendance).toHaveBeenCalledWith("123", {
        status: AttendanceStatus.CHECKED_IN,
        absenceJustified: undefined,
        absenceNotes: undefined,
      });
    });
  });

  describe("useCompleteAttendance", () => {
    it("should complete attendance", async () => {
      const mockResponse = {
        success: true,
        value: createMockAttendanceResponse({
          id: 123,
          status: AttendanceStatus.COMPLETED,
        }),
      };

      mockApi.completeAttendance.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCompleteAttendance(), {
        wrapper: createWrapper,
      });

      await waitFor(async () => {
        await result.current.mutateAsync({ id: "123" });
      });

      expect(mockApi.completeAttendance).toHaveBeenCalledWith("123");
    });
  });

  describe("useMarkAttendanceAsMissed", () => {
    it("should mark attendance as missed with justification", async () => {
      const mockResponse = {
        success: true,
        value: createMockAttendanceResponse({
          id: 123,
          status: AttendanceStatus.MISSED,
        }),
      };

      mockApi.markAttendanceAsMissed.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMarkAttendanceAsMissed(), {
        wrapper: createWrapper,
      });

      const missedParams = {
        id: "123",
        justified: true,
        notes: "Patient called to reschedule",
      };

      await waitFor(async () => {
        await result.current.mutateAsync(missedParams);
      });

      expect(mockApi.markAttendanceAsMissed).toHaveBeenCalledWith(
        "123",
        true,
        "Patient called to reschedule",
      );
    });
  });

  describe("useDeleteAttendance", () => {
    it("should delete attendance", async () => {
      const mockResponse = {
        success: true,
      };

      mockApi.deleteAttendance.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteAttendance(), {
        wrapper: createWrapper,
      });

      await waitFor(async () => {
        await result.current.mutateAsync({ attendanceId: 123 });
      });

      expect(mockApi.deleteAttendance).toHaveBeenCalledWith("123", undefined);
    });

    it("should delete attendance with cancellation reason", async () => {
      const mockResponse = {
        success: true,
      };

      mockApi.deleteAttendance.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteAttendance(), {
        wrapper: createWrapper,
      });

      await waitFor(async () => {
        await result.current.mutateAsync({
          attendanceId: 123,
          cancellationReason: "Patient requested cancellation",
        });
      });

      expect(mockApi.deleteAttendance).toHaveBeenCalledWith(
        "123",
        "Patient requested cancellation",
      );
    });
  });

  describe("useCheckInAttendance", () => {
    it("should check in attendance (alias for status update)", async () => {
      const mockResponse = {
        success: true,
        value: createMockAttendanceResponse({
          id: 123,
          status: AttendanceStatus.CHECKED_IN,
        }),
      };

      mockApi.updateAttendance.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCheckInAttendance(), {
        wrapper: createWrapper,
      });

      const checkInParams = {
        attendanceId: 123,
        patientName: "Test Patient",
      };

      await waitFor(async () => {
        await result.current.mutateAsync(checkInParams);
      });

      expect(mockApi.updateAttendance).toHaveBeenCalledWith("123", {
        status: AttendanceStatus.CHECKED_IN,
        absenceJustified: undefined,
        absenceNotes: undefined,
      });
    });
  });

  describe("useRefreshAttendances", () => {
    it("should invalidate queries for specific date", () => {
      const { result } = renderHook(() => useRefreshAttendances(), {
        wrapper: createWrapper,
      });

      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
      const testDate = "2024-01-15";

      result.current(testDate);

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: attendanceKeys.byDate(testDate),
      });
    });

    it("should invalidate all attendance queries when no date provided", () => {
      const { result } = renderHook(() => useRefreshAttendances(), {
        wrapper: createWrapper,
      });

      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      result.current();

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: attendanceKeys.all,
      });
    });
  });

  describe("useHandleIncompleteAttendances", () => {
    it("should handle incomplete attendances by completing them", async () => {
      mockApi.completeAttendance.mockResolvedValue({
        success: true,
        value: createMockAttendanceResponse({
          status: AttendanceStatus.COMPLETED,
        }),
      });

      const { result } = renderHook(() => useHandleIncompleteAttendances(), {
        wrapper: createWrapper,
      });

      const incompleteAttendances = [
        createMockAttendanceStatusDetail({
          attendanceId: 1,
          name: "Patient 1",
        }),
        createMockAttendanceStatusDetail({
          attendanceId: 2,
          name: "Patient 2",
        }),
      ];

      const params = {
        attendances: incompleteAttendances,
        action: "complete" as const,
      };

      await waitFor(async () => {
        await result.current.mutateAsync(params);
      });

      expect(mockApi.completeAttendance).toHaveBeenCalledTimes(2);
      expect(mockApi.completeAttendance).toHaveBeenCalledWith("1");
      expect(mockApi.completeAttendance).toHaveBeenCalledWith("2");
    });

    it("should handle incomplete attendances by rescheduling them", async () => {
      mockApi.updateAttendance.mockResolvedValue({
        success: true,
        value: createMockAttendanceResponse({
          status: AttendanceStatus.SCHEDULED,
        }),
      });

      const { result } = renderHook(() => useHandleIncompleteAttendances(), {
        wrapper: createWrapper,
      });

      const incompleteAttendances = [
        createMockAttendanceStatusDetail({
          attendanceId: 1,
          name: "Patient 1",
        }),
      ];

      const params = {
        attendances: incompleteAttendances,
        action: "reschedule" as const,
      };

      await waitFor(async () => {
        await result.current.mutateAsync(params);
      });

      expect(mockApi.updateAttendance).toHaveBeenCalledWith("1", {
        status: AttendanceStatus.SCHEDULED,
        absenceJustified: undefined,
        absenceNotes: undefined,
      });
    });
  });

  describe("useHandleAbsenceJustifications", () => {
    it("should handle justified and unjustified absences", async () => {
      mockApi.updateAttendance.mockResolvedValue({
        success: true,
        value: createMockAttendanceResponse({
          status: AttendanceStatus.MISSED,
        }),
      });
      mockApi.markAttendanceAsMissed.mockResolvedValue({
        success: true,
        value: createMockAttendanceResponse({
          status: AttendanceStatus.MISSED,
        }),
      });

      const { result } = renderHook(() => useHandleAbsenceJustifications(), {
        wrapper: createWrapper,
      });

      const justifications = [
        {
          attendanceId: 1,
          patientName: "Patient 1",
          justified: true,
          notes: "Called to reschedule",
        },
        {
          attendanceId: 2,
          patientName: "Patient 2",
          justified: false,
          notes: "No show",
        },
      ];

      await waitFor(async () => {
        await result.current.mutateAsync(justifications);
      });

      // Justified absence
      expect(mockApi.updateAttendance).toHaveBeenCalledWith("1", {
        absenceJustified: true,
        absenceNotes: "Called to reschedule",
        status: AttendanceStatus.MISSED,
      });

      // Unjustified absence
      expect(mockApi.markAttendanceAsMissed).toHaveBeenCalledWith(
        "2",
        false,
        "No show",
      );
    });
  });

  describe("Query Keys Factory", () => {
    it("should generate consistent query keys", () => {
      expect(attendanceKeys.all).toEqual(["attendances"]);
      expect(attendanceKeys.byDate("2024-01-15")).toEqual([
        "attendances",
        "byDate",
        "2024-01-15",
      ]);
      expect(attendanceKeys.nextDate()).toEqual(["attendances", "nextDate"]);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle network timeout errors", async () => {
      mockApi.getAttendancesByDate.mockRejectedValue(new Error("ETIMEDOUT"));

      const { result } = renderHook(() => useAttendancesByDate("2024-01-15"), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("ETIMEDOUT");
    });

    it("should handle server error responses", async () => {
      mockApi.updateAttendance.mockResolvedValue({
        success: false,
        error: "Internal server error",
      });

      const { result } = renderHook(() => useUpdateAttendance(), {
        wrapper: createWrapper,
      });

      await expect(
        result.current.mutateAsync({
          id: "123",
          status: AttendanceStatus.COMPLETED,
        }),
      ).rejects.toThrow("Internal server error");
    });

    it("should handle malformed API responses", async () => {
      mockApi.getNextAttendanceDate.mockResolvedValue({
        success: true,
        // @ts-expect-error - Intentionally malformed data for testing
        value: { invalid: "data" },
      });

      const { result } = renderHook(() => useNextAttendanceDate(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should fallback to today when API returns malformed data
      expect(result.current.data).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it("should handle concurrent mutations gracefully", async () => {
      mockApi.updateAttendance.mockImplementation(() =>
        Promise.resolve({
          success: true,
          value: createMockAttendanceResponse({
            status: AttendanceStatus.COMPLETED,
          }),
        }),
      );

      const { result } = renderHook(() => useUpdateAttendance(), {
        wrapper: createWrapper,
      });

      // Trigger multiple concurrent mutations
      const promises = [
        result.current.mutateAsync({
          id: "1",
          status: AttendanceStatus.COMPLETED,
        }),
        result.current.mutateAsync({
          id: "2",
          status: AttendanceStatus.COMPLETED,
        }),
        result.current.mutateAsync({
          id: "3",
          status: AttendanceStatus.COMPLETED,
        }),
      ];

      await Promise.all(promises);

      expect(mockApi.updateAttendance).toHaveBeenCalledTimes(3);
    });

    it("should handle partial batch operation failures", async () => {
      // Mock first call succeeds, second fails
      mockApi.completeAttendance
        .mockResolvedValueOnce({
          success: true,
          value: createMockAttendanceResponse({
            status: AttendanceStatus.COMPLETED,
          }),
        })
        .mockResolvedValueOnce({
          success: false,
          error: "Attendance not found",
        });

      const { result } = renderHook(() => useHandleIncompleteAttendances(), {
        wrapper: createWrapper,
      });

      const incompleteAttendances = [
        createMockAttendanceStatusDetail({
          attendanceId: 1,
          name: "Patient 1",
        }),
        createMockAttendanceStatusDetail({
          attendanceId: 2,
          name: "Patient 2",
        }),
      ];

      // Should handle mixed success/failure in batch operations
      await expect(
        result.current.mutateAsync({
          attendances: incompleteAttendances,
          action: "complete",
        }),
      ).rejects.toThrow();

      expect(mockApi.completeAttendance).toHaveBeenCalledTimes(2);
    });

    it("should validate query invalidation on successful mutations", async () => {
      mockApi.updateAttendance.mockResolvedValue({
        success: true,
        value: createMockAttendanceResponse({
          status: AttendanceStatus.COMPLETED,
        }),
      });

      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUpdateAttendance(), {
        wrapper: createWrapper,
      });

      await result.current.mutateAsync({
        id: "123",
        status: AttendanceStatus.COMPLETED,
      });

      // Should invalidate attendance queries
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: attendanceKeys.all,
      });

      // Should also invalidate schedule queries
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["schedule"],
      });
    });

    it("should handle empty batch operations", async () => {
      const { result } = renderHook(() => useHandleIncompleteAttendances(), {
        wrapper: createWrapper,
      });

      const emptyParams = {
        attendances: [],
        action: "complete" as const,
      };

      await waitFor(async () => {
        const response = await result.current.mutateAsync(emptyParams);
        expect(response.success).toBe(true);
      });

      expect(mockApi.completeAttendance).not.toHaveBeenCalled();
    });

    it("should handle attendances without IDs in batch operations", async () => {
      const { result } = renderHook(() => useHandleIncompleteAttendances(), {
        wrapper: createWrapper,
      });

      const attendancesWithoutIds = [
        createMockAttendanceStatusDetail({
          attendanceId: undefined,
          name: "Patient 1",
        }),
        createMockAttendanceStatusDetail({
          attendanceId: 2,
          name: "Patient 2",
        }),
      ];

      mockApi.completeAttendance.mockResolvedValue({
        success: true,
        value: createMockAttendanceResponse({
          status: AttendanceStatus.COMPLETED,
        }),
      });

      await waitFor(async () => {
        await result.current.mutateAsync({
          attendances: attendancesWithoutIds,
          action: "complete",
        });
      });

      // Should only call API for attendance with valid ID
      expect(mockApi.completeAttendance).toHaveBeenCalledTimes(1);
      expect(mockApi.completeAttendance).toHaveBeenCalledWith("2");
    });
  });
});
