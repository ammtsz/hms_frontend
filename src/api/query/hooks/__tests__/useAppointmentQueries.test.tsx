/**
 * useAppointmentQueries Tests
 *
 * Comprehensive test suite for all appointment-related React Query hooks
 * including server state management, CRUD operations, and endOfDay workflow.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import {
  useAppointmentsByDate,
  useNextAppointmentDate,
  useCreateAppointment,
  useUpdateAppointment,
  useCompleteAppointment,
  useMarkAppointmentAsMissed,
  useDeleteAppointment,
  useCheckInAppointment,
  useRefreshAppointments,
  useHandleIncompleteAppointments,
  useHandleAbsenceJustifications,
} from "../useAppointmentQueries";
import { appointmentKeys } from "@/api/query/keys/appointmentKeys";
import * as appointmentsApi from "@/api/appointments";
import { AppointmentStatusDetail } from "@/types/types";
import { AppointmentType, AppointmentStatus } from "@/api/types";

// Mock the API
jest.mock("@/api/appointments");
const mockApi = appointmentsApi as jest.Mocked<typeof appointmentsApi>;

// Mock transformers
jest.mock("@/utils/apiTransformers", () => ({
  transformAppointmentWithPatientByDate: jest.fn(() => ({
    assessment: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
    physiotherapy: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
    tens: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
  })),
}));

// Helper to create mock appointment response
const createMockAppointmentResponse = (overrides = {}) => ({
  id: 123,
  status: AppointmentStatus.SCHEDULED,
  patientId: 1,
  type: AppointmentType.ASSESSMENT,
  scheduledDate: "2024-01-15",
  scheduledTime: "09:00",
  createdAt: "2024-01-15T08:00:00Z",
  updatedAt: "2024-01-15T09:00:00Z",
  ...overrides,
});

// Helper to create mock AppointmentStatusDetail
const createMockAppointmentStatusDetail = (
  overrides = {},
): AppointmentStatusDetail => ({
  appointmentId: 1,
  name: "Test Patient",
  priority: "3",
  ...overrides,
});

describe("useAppointmentQueries", () => {
  let queryClient: QueryClient;

  const createWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    // Guard against fake-timer leaks from other suites in the same Jest worker.
    jest.useRealTimers();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
        },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    mockApi.getAppointmentsByDate.mockReset();
  });

  describe("useAppointmentsByDate", () => {
    it("should fetch appointments for a specific date", async () => {
      const mockDate = "2024-01-15";
      const mockResponse = {
        success: true,
        value: [
          {
            id: 1,
            patientId: 1,
            patientName: "Test Patient",
            status: AppointmentStatus.SCHEDULED,
            type: AppointmentType.ASSESSMENT,
            scheduledDate: "2024-01-15",
            scheduledTime: "09:00",
            createdAt: "2024-01-15T08:00:00Z",
            updatedAt: "2024-01-15T08:00:00Z",
          },
        ],
      };

      mockApi.getAppointmentsByDate.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAppointmentsByDate(mockDate), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.getAppointmentsByDate).toHaveBeenCalledWith(mockDate);
      expect(result.current.data).toBeDefined();
    });

    it("should handle fetch errors gracefully", async () => {
      const mockDate = "2024-01-15";
      mockApi.getAppointmentsByDate.mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const { result } = renderHook(() => useAppointmentsByDate(mockDate), {
        wrapper: createWrapper,
      });

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 5000 },
      );

      expect(result.current.isFetching).toBe(false);
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe("Database error");
    });

    it("does not fetch when date string is invalid", async () => {
      const { result } = renderHook(() => useAppointmentsByDate("2025-0"), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      expect(mockApi.getAppointmentsByDate).not.toHaveBeenCalled();
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  describe("useNextAppointmentDate", () => {
    it("should fetch next appointment date", async () => {
      const mockResponse = {
        success: true,
        value: { nextDate: "2024-01-16" },
      };

      mockApi.getNextAppointmentDate.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useNextAppointmentDate(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe("2024-01-16");
    });

    it("should fallback to today when no next date available", async () => {
      mockApi.getNextAppointmentDate.mockResolvedValue({
        success: true,
        value: undefined,
      });

      const { result } = renderHook(() => useNextAppointmentDate(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toMatch(/\d{4}-\d{2}-\d{2}/); // Today's date format
    });

    it("should handle API error and fallback to today", async () => {
      mockApi.getNextAppointmentDate.mockRejectedValue(
        new Error("Network error"),
      );

      const { result } = renderHook(() => useNextAppointmentDate(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toMatch(/\d{4}-\d{2}-\d{2}/); // Today's date format
    });
  });

  describe("useCreateAppointment", () => {
    it("should create new appointment successfully", async () => {
      const mockResponse = {
        success: true,
        value: createMockAppointmentResponse({ id: 123 }),
      };

      mockApi.createAppointment.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateAppointment(), {
        wrapper: createWrapper,
      });

      const createParams = {
        patientId: 1,
        appointmentType: AppointmentType.ASSESSMENT,
        scheduledDate: "2024-01-15",
      };

      await waitFor(async () => {
        await result.current.mutateAsync(createParams);
      });

      expect(mockApi.createAppointment).toHaveBeenCalledWith({
        patientId: 1,
        type: AppointmentType.ASSESSMENT,
        scheduledDate: "2024-01-15",
        scheduledTime: "09:00",
        parentAppointmentId: undefined,
        status: undefined,
      });
    });

    it("should forward parentAppointmentId for return consultations (IN_TREATMENT)", async () => {
      const mockResponse = {
        success: true,
        value: createMockAppointmentResponse({
          id: 456,
          parentAppointmentId: 42,
        }),
      };
      mockApi.createAppointment.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateAppointment(), {
        wrapper: createWrapper,
      });

      await waitFor(async () => {
        await result.current.mutateAsync({
          patientId: 1,
          appointmentType: AppointmentType.ASSESSMENT,
          scheduledDate: "2024-01-20",
          parentAppointmentId: 42,
        });
      });

      expect(mockApi.createAppointment).toHaveBeenCalledWith({
        patientId: 1,
        type: AppointmentType.ASSESSMENT,
        scheduledDate: "2024-01-20",
        scheduledTime: "09:00",
        parentAppointmentId: 42,
        status: undefined,
      });
    });

    it("should handle creation errors", async () => {
      mockApi.createAppointment.mockResolvedValue({
        success: false,
        error: "Patient not found",
      });

      const { result } = renderHook(() => useCreateAppointment(), {
        wrapper: createWrapper,
      });

      const createParams = {
        patientId: 999,
        appointmentType: AppointmentType.ASSESSMENT,
      };

      await expect(result.current.mutateAsync(createParams)).rejects.toThrow(
        "Patient not found",
      );
    });
  });

  describe("useUpdateAppointment", () => {
    it("should update appointment status", async () => {
      const mockResponse = {
        success: true,
        value: createMockAppointmentResponse({
          id: 123,
          status: AppointmentStatus.CHECKED_IN,
        }),
      };

      mockApi.updateAppointment.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateAppointment(), {
        wrapper: createWrapper,
      });

      const updateParams = {
        id: "123",
        status: AppointmentStatus.CHECKED_IN,
      };

      await waitFor(async () => {
        await result.current.mutateAsync(updateParams);
      });

      expect(mockApi.updateAppointment).toHaveBeenCalledWith("123", {
        status: AppointmentStatus.CHECKED_IN,
        absenceJustified: undefined,
        absenceNotes: undefined,
      });
    });
  });

  describe("useCompleteAppointment", () => {
    it("should complete appointment", async () => {
      const mockResponse = {
        success: true,
        value: createMockAppointmentResponse({
          id: 123,
          status: AppointmentStatus.COMPLETED,
        }),
      };

      mockApi.completeAppointment.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCompleteAppointment(), {
        wrapper: createWrapper,
      });

      await waitFor(async () => {
        await result.current.mutateAsync({ id: "123" });
      });

      expect(mockApi.completeAppointment).toHaveBeenCalledWith("123");
    });
  });

  describe("useMarkAppointmentAsMissed", () => {
    it("should mark appointment as missed with justification", async () => {
      const mockResponse = {
        success: true,
        value: createMockAppointmentResponse({
          id: 123,
          status: AppointmentStatus.MISSED,
        }),
      };

      mockApi.markAppointmentAsMissed.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMarkAppointmentAsMissed(), {
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

      expect(mockApi.markAppointmentAsMissed).toHaveBeenCalledWith(
        "123",
        true,
        "Patient called to reschedule",
      );
    });
  });

  describe("useDeleteAppointment", () => {
    it("should delete appointment", async () => {
      const mockResponse = {
        success: true,
      };

      mockApi.deleteAppointment.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteAppointment(), {
        wrapper: createWrapper,
      });

      await waitFor(async () => {
        await result.current.mutateAsync({ appointmentId: 123 });
      });

      expect(mockApi.deleteAppointment).toHaveBeenCalledWith("123", undefined);
    });

    it("should delete appointment with cancellation reason", async () => {
      const mockResponse = {
        success: true,
      };

      mockApi.deleteAppointment.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteAppointment(), {
        wrapper: createWrapper,
      });

      await waitFor(async () => {
        await result.current.mutateAsync({
          appointmentId: 123,
          cancellationReason: "Patient requested cancellation",
        });
      });

      expect(mockApi.deleteAppointment).toHaveBeenCalledWith(
        "123",
        "Patient requested cancellation",
      );
    });
  });

  describe("useCheckInAppointment", () => {
    it("should check in appointment (alias for status update)", async () => {
      const mockResponse = {
        success: true,
        value: createMockAppointmentResponse({
          id: 123,
          status: AppointmentStatus.CHECKED_IN,
        }),
      };

      mockApi.updateAppointment.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCheckInAppointment(), {
        wrapper: createWrapper,
      });

      const checkInParams = {
        appointmentId: 123,
        patientName: "Test Patient",
      };

      await waitFor(async () => {
        await result.current.mutateAsync(checkInParams);
      });

      expect(mockApi.updateAppointment).toHaveBeenCalledWith("123", {
        status: AppointmentStatus.CHECKED_IN,
        absenceJustified: undefined,
        absenceNotes: undefined,
      });
    });
  });

  describe("useRefreshAppointments", () => {
    it("should invalidate queries for specific date", () => {
      const { result } = renderHook(() => useRefreshAppointments(), {
        wrapper: createWrapper,
      });

      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
      const testDate = "2024-01-15";

      result.current(testDate);

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: appointmentKeys.byDate(testDate),
      });
    });

    it("should invalidate all appointment queries when no date provided", () => {
      const { result } = renderHook(() => useRefreshAppointments(), {
        wrapper: createWrapper,
      });

      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      result.current();

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: appointmentKeys.all,
      });
    });
  });

  describe("useHandleIncompleteAppointments", () => {
    it("should handle incomplete appointments by completing them", async () => {
      mockApi.completeAppointment.mockResolvedValue({
        success: true,
        value: createMockAppointmentResponse({
          status: AppointmentStatus.COMPLETED,
        }),
      });

      const { result } = renderHook(() => useHandleIncompleteAppointments(), {
        wrapper: createWrapper,
      });

      const incompleteAppointments = [
        createMockAppointmentStatusDetail({
          appointmentId: 1,
          name: "Patient 1",
        }),
        createMockAppointmentStatusDetail({
          appointmentId: 2,
          name: "Patient 2",
        }),
      ];

      const params = {
        appointments: incompleteAppointments,
        action: "complete" as const,
      };

      await waitFor(async () => {
        await result.current.mutateAsync(params);
      });

      expect(mockApi.completeAppointment).toHaveBeenCalledTimes(2);
      expect(mockApi.completeAppointment).toHaveBeenCalledWith("1");
      expect(mockApi.completeAppointment).toHaveBeenCalledWith("2");
    });

    it("should handle incomplete appointments by rescheduling them", async () => {
      mockApi.updateAppointment.mockResolvedValue({
        success: true,
        value: createMockAppointmentResponse({
          status: AppointmentStatus.SCHEDULED,
        }),
      });

      const { result } = renderHook(() => useHandleIncompleteAppointments(), {
        wrapper: createWrapper,
      });

      const incompleteAppointments = [
        createMockAppointmentStatusDetail({
          appointmentId: 1,
          name: "Patient 1",
        }),
      ];

      const params = {
        appointments: incompleteAppointments,
        action: "reschedule" as const,
      };

      await waitFor(async () => {
        await result.current.mutateAsync(params);
      });

      expect(mockApi.updateAppointment).toHaveBeenCalledWith("1", {
        status: AppointmentStatus.SCHEDULED,
        absenceJustified: undefined,
        absenceNotes: undefined,
      });
    });
  });

  describe("useHandleAbsenceJustifications", () => {
    it("should handle justified and unjustified absences", async () => {
      mockApi.updateAppointment.mockResolvedValue({
        success: true,
        value: createMockAppointmentResponse({
          status: AppointmentStatus.MISSED,
        }),
      });
      mockApi.markAppointmentAsMissed.mockResolvedValue({
        success: true,
        value: createMockAppointmentResponse({
          status: AppointmentStatus.MISSED,
        }),
      });

      const { result } = renderHook(() => useHandleAbsenceJustifications(), {
        wrapper: createWrapper,
      });

      const justifications = [
        {
          appointmentId: 1,
          patientName: "Patient 1",
          justified: true,
          notes: "Called to reschedule",
        },
        {
          appointmentId: 2,
          patientName: "Patient 2",
          justified: false,
          notes: "No show",
        },
      ];

      await waitFor(async () => {
        await result.current.mutateAsync(justifications);
      });

      // Justified absence
      expect(mockApi.updateAppointment).toHaveBeenCalledWith("1", {
        absenceJustified: true,
        absenceNotes: "Called to reschedule",
        status: AppointmentStatus.MISSED,
      });

      // Unjustified absence
      expect(mockApi.markAppointmentAsMissed).toHaveBeenCalledWith(
        "2",
        false,
        "No show",
      );
    });
  });

  describe("Query Keys Factory", () => {
    it("should generate consistent query keys", () => {
      expect(appointmentKeys.all).toEqual(["appointments"]);
      expect(appointmentKeys.byDate("2024-01-15")).toEqual([
        "appointments",
        "byDate",
        "2024-01-15",
      ]);
      expect(appointmentKeys.nextDate()).toEqual(["appointments", "nextDate"]);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle network timeout errors", async () => {
      mockApi.getAppointmentsByDate.mockRejectedValue(new Error("ETIMEDOUT"));

      const { result } = renderHook(() => useAppointmentsByDate("2024-01-15"), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("ETIMEDOUT");
    });

    it("should handle server error responses", async () => {
      mockApi.updateAppointment.mockResolvedValue({
        success: false,
        error: "Internal server error",
      });

      const { result } = renderHook(() => useUpdateAppointment(), {
        wrapper: createWrapper,
      });

      await expect(
        result.current.mutateAsync({
          id: "123",
          status: AppointmentStatus.COMPLETED,
        }),
      ).rejects.toThrow("Internal server error");
    });

    it("should handle malformed API responses", async () => {
      mockApi.getNextAppointmentDate.mockResolvedValue({
        success: true,
        // @ts-expect-error - Intentionally malformed data for testing
        value: { invalid: "data" },
      });

      const { result } = renderHook(() => useNextAppointmentDate(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should fallback to today when API returns malformed data
      expect(result.current.data).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it("should handle concurrent mutations gracefully", async () => {
      mockApi.updateAppointment.mockImplementation(() =>
        Promise.resolve({
          success: true,
          value: createMockAppointmentResponse({
            status: AppointmentStatus.COMPLETED,
          }),
        }),
      );

      const { result } = renderHook(() => useUpdateAppointment(), {
        wrapper: createWrapper,
      });

      // Trigger multiple concurrent mutations
      const promises = [
        result.current.mutateAsync({
          id: "1",
          status: AppointmentStatus.COMPLETED,
        }),
        result.current.mutateAsync({
          id: "2",
          status: AppointmentStatus.COMPLETED,
        }),
        result.current.mutateAsync({
          id: "3",
          status: AppointmentStatus.COMPLETED,
        }),
      ];

      await Promise.all(promises);

      expect(mockApi.updateAppointment).toHaveBeenCalledTimes(3);
    });

    it("should handle partial batch operation failures", async () => {
      // Mock first call succeeds, second fails
      mockApi.completeAppointment
        .mockResolvedValueOnce({
          success: true,
          value: createMockAppointmentResponse({
            status: AppointmentStatus.COMPLETED,
          }),
        })
        .mockResolvedValueOnce({
          success: false,
          error: "Appointment not found",
        });

      const { result } = renderHook(() => useHandleIncompleteAppointments(), {
        wrapper: createWrapper,
      });

      const incompleteAppointments = [
        createMockAppointmentStatusDetail({
          appointmentId: 1,
          name: "Patient 1",
        }),
        createMockAppointmentStatusDetail({
          appointmentId: 2,
          name: "Patient 2",
        }),
      ];

      // Should handle mixed success/failure in batch operations
      await expect(
        result.current.mutateAsync({
          appointments: incompleteAppointments,
          action: "complete",
        }),
      ).rejects.toThrow();

      expect(mockApi.completeAppointment).toHaveBeenCalledTimes(2);
    });

    it("should validate query invalidation on successful mutations", async () => {
      mockApi.updateAppointment.mockResolvedValue({
        success: true,
        value: createMockAppointmentResponse({
          status: AppointmentStatus.COMPLETED,
        }),
      });

      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUpdateAppointment(), {
        wrapper: createWrapper,
      });

      await result.current.mutateAsync({
        id: "123",
        status: AppointmentStatus.COMPLETED,
      });

      // Should invalidate appointment queries
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: appointmentKeys.all,
      });

      // Should also invalidate schedule queries
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["schedule"],
      });
    });

    it("should handle empty batch operations", async () => {
      const { result } = renderHook(() => useHandleIncompleteAppointments(), {
        wrapper: createWrapper,
      });

      const emptyParams = {
        appointments: [],
        action: "complete" as const,
      };

      await waitFor(async () => {
        const response = await result.current.mutateAsync(emptyParams);
        expect(response.success).toBe(true);
      });

      expect(mockApi.completeAppointment).not.toHaveBeenCalled();
    });

    it("should handle appointments without IDs in batch operations", async () => {
      const { result } = renderHook(() => useHandleIncompleteAppointments(), {
        wrapper: createWrapper,
      });

      const appointmentsWithoutIds = [
        createMockAppointmentStatusDetail({
          appointmentId: undefined,
          name: "Patient 1",
        }),
        createMockAppointmentStatusDetail({
          appointmentId: 2,
          name: "Patient 2",
        }),
      ];

      mockApi.completeAppointment.mockResolvedValue({
        success: true,
        value: createMockAppointmentResponse({
          status: AppointmentStatus.COMPLETED,
        }),
      });

      await waitFor(async () => {
        await result.current.mutateAsync({
          appointments: appointmentsWithoutIds,
          action: "complete",
        });
      });

      // Should only call API for appointment with valid ID
      expect(mockApi.completeAppointment).toHaveBeenCalledTimes(1);
      expect(mockApi.completeAppointment).toHaveBeenCalledWith("2");
    });
  });
});
