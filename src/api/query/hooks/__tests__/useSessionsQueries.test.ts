import React, { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useSessionsByTreatment,
  useSessionsByAppointments,
  useCompleteSession,
  useBulkCompleteSessions,
} from "../useSessionsQueries";
import { sessionsQueryKeys } from "@/api/query/keys/sessionsQueryKeys";
import * as sessionsApi from "@/api/sessions";
import * as treatmentsApi from "@/api/treatments";

jest.mock("@/api/sessions");
jest.mock("@/api/treatments");

const mockedSessionsApi = sessionsApi as jest.Mocked<typeof sessionsApi>;
const mockedTreatmentsApi = treatmentsApi as jest.Mocked<typeof treatmentsApi>;

const createMockSessionRow = (id = 1, sessionNumber = 1) => ({
  id,
  treatmentId: 1,
  sessionNumber,
  scheduledDate: "2025-01-01",
  status: "scheduled" as const,
  startTime: "10:00",
  endTime: "11:00",
  notes: "Test notes",
  createdDate: "2025-01-01",
  createdTime: "10:00:00",
  updatedDate: "2025-01-01",
  updatedTime: "10:00:00",
});

const createMockTreatment = (id = 1) => ({
  id,
  consultationId: id * 5,
  appointmentId: id * 3,
  patientId: id * 2,
  treatmentType: "physiotherapy" as const,
  bodyLocation: "Test location",
  startDate: "2025-01-01",
  plannedSessions: 10,
  completedSessions: 2,
  status: "active",
  createdDate: "2025-01-01",
  createdTime: "10:00:00",
  updatedDate: "2025-01-01",
  updatedTime: "10:00:00",
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  return Wrapper;
};

describe("useSessionsQueries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useSessionsByAppointments", () => {
    test("should return dataByAppointment map and refetch when appointmentIds provided", async () => {
      const appointmentIds = [1, 2];
      const mockSessions1 = [createMockSessionRow(101)];
      const mockSessions2 = [createMockSessionRow(102)];

      mockedSessionsApi.getSessionsByAppointment.mockImplementation((id: number) =>
        Promise.resolve({
          success: true,
          value: id === 1 ? mockSessions1 : mockSessions2,
        }),
      );

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSessionsByAppointments(appointmentIds), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dataByAppointment.get(1)).toEqual(mockSessions1);
      expect(result.current.dataByAppointment.get(2)).toEqual(mockSessions2);
      expect(result.current.isError).toBe(false);
      expect(typeof result.current.refetch).toBe("function");

      const callCountBefore = mockedSessionsApi.getSessionsByAppointment.mock.calls.length;
      await result.current.refetch();
      await waitFor(() => {
        const callCountAfter = mockedSessionsApi.getSessionsByAppointment.mock.calls.length;
        expect(callCountAfter).toBe(callCountBefore + 2);
      });
    });

    test("should not run queries when appointmentIds is empty", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSessionsByAppointments([]), { wrapper });

      expect(result.current.dataByAppointment.size).toBe(0);
      expect(mockedSessionsApi.getSessionsByAppointment).not.toHaveBeenCalled();
    });
  });

  describe("useSessionsByTreatment", () => {
    test("should fetch sessions when treatmentId is provided", async () => {
      const treatmentId = 123;
      const mockSessions = [createMockSessionRow(1), createMockSessionRow(2)];

      mockedSessionsApi.getSessionsByTreatment.mockResolvedValueOnce({
        success: true,
        value: mockSessions,
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSessionsByTreatment(treatmentId), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSessions);
      expect(mockedSessionsApi.getSessionsByTreatment).toHaveBeenCalledWith("123");
    });

    test("should not fetch when treatmentId is zero", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSessionsByTreatment(0), { wrapper });

      expect(result.current.isPending).toBe(true);
      expect(mockedSessionsApi.getSessionsByTreatment).not.toHaveBeenCalled();
    });

    test("should not fetch when treatmentId is negative", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSessionsByTreatment(-1), { wrapper });

      expect(result.current.isPending).toBe(true);
      expect(mockedSessionsApi.getSessionsByTreatment).not.toHaveBeenCalled();
    });

    test("should handle API errors", async () => {
      const treatmentId = 123;
      const error = new Error("API Error");

      mockedSessionsApi.getSessionsByTreatment.mockRejectedValueOnce(error);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSessionsByTreatment(treatmentId), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 5000 });

      expect(result.current.error).toBe(error);
    });

    test("should handle API success false response", async () => {
      const treatmentId = 123;

      mockedSessionsApi.getSessionsByTreatment.mockResolvedValueOnce({
        success: false,
        error: "Sessions not found",
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSessionsByTreatment(treatmentId), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 5000 });
    });

    test("should handle empty array response", async () => {
      const treatmentId = 123;

      mockedSessionsApi.getSessionsByTreatment.mockResolvedValueOnce({
        success: true,
        value: [],
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSessionsByTreatment(treatmentId), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe("useCompleteSession", () => {
    test("should complete session row and update treatment successfully", async () => {
      const mockSession = createMockSessionRow(1);
      const mockTreatment = createMockTreatment(1);

      mockedSessionsApi.completeSession.mockResolvedValueOnce({
        success: true,
        value: mockSession,
      });

      mockedTreatmentsApi.updateTreatment.mockResolvedValueOnce({
        success: true,
        value: mockTreatment,
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCompleteSession(), { wrapper });

      const completionData = {
        sessionRowId: "1",
        treatmentId: "123",
        completionData: {
          notes: "Treatment completed successfully",
          appointmentId: 1,
        },
        newCompletedCount: 2,
      };

      result.current.mutate(completionData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedSessionsApi.completeSession).toHaveBeenCalledWith(
        "1",
        completionData.completionData,
      );
      expect(mockedTreatmentsApi.updateTreatment).toHaveBeenCalledWith("123", {
        completedSessions: 2,
      });
    });

    test("should handle completion API error", async () => {
      const error = new Error("Completion failed");
      mockedSessionsApi.completeSession.mockRejectedValueOnce(error);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCompleteSession(), { wrapper });

      const completionData = {
        sessionRowId: "1",
        treatmentId: "123",
        completionData: {
          notes: "Test",
          appointmentId: 1,
        },
        newCompletedCount: 2,
      };

      result.current.mutate(completionData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });

    test("should handle update treatment API error after successful completion", async () => {
      const mockSession = createMockSessionRow(1);
      const updateError = new Error("Update failed");

      mockedSessionsApi.completeSession.mockResolvedValueOnce({
        success: true,
        value: mockSession,
      });

      mockedTreatmentsApi.updateTreatment.mockRejectedValueOnce(updateError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCompleteSession(), { wrapper });

      const completionData = {
        sessionRowId: "1",
        treatmentId: "123",
        completionData: {
          notes: "Test",
          appointmentId: 1,
        },
        newCompletedCount: 2,
      };

      result.current.mutate(completionData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(updateError);
    });
  });

  describe("useBulkCompleteSessions", () => {
    test("should complete multiple session rows successfully", async () => {
      const mockRow1 = { ...createMockSessionRow(1, 2), id: 10 };
      const mockRow2 = { ...createMockSessionRow(2, 3), id: 20 };
      const mockTreatment1 = createMockTreatment(1);
      const mockTreatment2 = createMockTreatment(2);

      mockedSessionsApi.getSessionsByTreatment
        .mockResolvedValueOnce({ success: true, value: [mockRow1] })
        .mockResolvedValueOnce({ success: true, value: [mockRow2] });

      mockedSessionsApi.completeSession
        .mockResolvedValueOnce({ success: true, value: mockRow1 })
        .mockResolvedValueOnce({ success: true, value: mockRow2 });

      mockedTreatmentsApi.updateTreatment
        .mockResolvedValueOnce({ success: true, value: mockTreatment1 })
        .mockResolvedValueOnce({ success: true, value: mockTreatment2 });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useBulkCompleteSessions(), { wrapper });

      const completions = [
        {
          treatmentId: "123",
          completionData: {
            notes: "Session 1 completed",
            appointmentId: 1,
          },
          newCompletedCount: 2,
        },
        {
          treatmentId: "456",
          completionData: {
            notes: "Session 2 completed",
            appointmentId: 2,
          },
          newCompletedCount: 3,
        },
      ];

      result.current.mutate(completions);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedSessionsApi.getSessionsByTreatment).toHaveBeenCalledTimes(2);
      expect(mockedSessionsApi.completeSession).toHaveBeenCalledTimes(2);
      expect(mockedTreatmentsApi.updateTreatment).toHaveBeenCalledTimes(2);
    });

    test("should handle partial failures", async () => {
      const mockRow1 = { ...createMockSessionRow(1, 2), id: 10 };
      const mockRow2 = { ...createMockSessionRow(2, 3), id: 20 };
      const error = new Error("Second completion failed");

      mockedSessionsApi.getSessionsByTreatment
        .mockResolvedValueOnce({ success: true, value: [mockRow1] })
        .mockResolvedValueOnce({ success: true, value: [mockRow2] });

      mockedSessionsApi.completeSession
        .mockResolvedValueOnce({ success: true, value: mockRow1 })
        .mockRejectedValueOnce(error);

      mockedTreatmentsApi.updateTreatment.mockResolvedValueOnce({
        success: true,
        value: createMockTreatment(1),
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useBulkCompleteSessions(), { wrapper });

      const completions = [
        {
          treatmentId: "123",
          completionData: {
            notes: "Session 1 completed",
            appointmentId: 1,
          },
          newCompletedCount: 2,
        },
        {
          treatmentId: "456",
          completionData: {
            notes: "Session 2 completed",
            appointmentId: 2,
          },
          newCompletedCount: 3,
        },
      ];

      result.current.mutate(completions);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    test("should handle API success false response", async () => {
      const mockRow = { ...createMockSessionRow(1, 2), id: 10 };
      mockedSessionsApi.getSessionsByTreatment.mockResolvedValueOnce({
        success: true,
        value: [mockRow],
      });
      mockedSessionsApi.completeSession.mockResolvedValueOnce({
        success: false,
        error: "Completion not allowed",
        value: undefined,
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useBulkCompleteSessions(), { wrapper });

      const completions = [
        {
          treatmentId: "123",
          completionData: {
            notes: "Session 1 completed",
            appointmentId: 1,
          },
          newCompletedCount: 2,
        },
      ];

      result.current.mutate(completions);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    test("should handle treatment update failure after successful completion", async () => {
      const mockRow = { ...createMockSessionRow(1, 2), id: 10 };

      mockedSessionsApi.getSessionsByTreatment.mockResolvedValueOnce({
        success: true,
        value: [mockRow],
      });

      mockedSessionsApi.completeSession.mockResolvedValueOnce({
        success: true,
        value: mockRow,
      });

      const updateError = new Error("Treatment update failed");
      mockedTreatmentsApi.updateTreatment.mockRejectedValueOnce(updateError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useBulkCompleteSessions(), { wrapper });

      const completions = [
        {
          treatmentId: "123",
          completionData: {
            notes: "Session 1 completed",
            appointmentId: 1,
          },
          newCompletedCount: 2,
        },
      ];

      result.current.mutate(completions);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain("Failed to complete 1 session(s)");
    });

    test("should handle multiple treatment update failures", async () => {
      const mockRow1 = { ...createMockSessionRow(1, 2), id: 10 };
      const mockRow2 = { ...createMockSessionRow(2, 3), id: 20 };
      const updateError1 = new Error("First update failed");
      const updateError2 = new Error("Second update failed");

      mockedSessionsApi.getSessionsByTreatment
        .mockResolvedValueOnce({ success: true, value: [mockRow1] })
        .mockResolvedValueOnce({ success: true, value: [mockRow2] });

      mockedSessionsApi.completeSession
        .mockResolvedValueOnce({ success: true, value: mockRow1 })
        .mockResolvedValueOnce({ success: true, value: mockRow2 });

      mockedTreatmentsApi.updateTreatment
        .mockRejectedValueOnce(updateError1)
        .mockRejectedValueOnce(updateError2);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useBulkCompleteSessions(), { wrapper });

      const completions = [
        {
          treatmentId: "123",
          completionData: {
            notes: "Session 1 completed",
            appointmentId: 1,
          },
          newCompletedCount: 2,
        },
        {
          treatmentId: "456",
          completionData: {
            notes: "Session 2 completed",
            appointmentId: 2,
          },
          newCompletedCount: 3,
        },
      ];

      result.current.mutate(completions);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    test("should handle empty completions array", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useBulkCompleteSessions(), { wrapper });

      const completions: Array<{
        treatmentId: string;
        completionData: { notes?: string; appointmentId?: number };
        newCompletedCount: number;
      }> = [];

      result.current.mutate(completions);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedSessionsApi.completeSession).not.toHaveBeenCalled();
      expect(mockedTreatmentsApi.updateTreatment).not.toHaveBeenCalled();
    });

    test("should handle network errors gracefully", async () => {
      const networkError = new Error("Network unavailable");

      mockedSessionsApi.getSessionsByTreatment.mockRejectedValueOnce(networkError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useBulkCompleteSessions(), { wrapper });

      const completions = [
        {
          treatmentId: "123",
          completionData: {
            notes: "Session 1 completed",
            appointmentId: 1,
          },
          newCompletedCount: 2,
        },
      ];

      result.current.mutate(completions);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain("Failed to complete 1 session(s)");
    });
  });

  describe("sessionsQueryKeys", () => {
    test("should generate correct query keys", () => {
      expect(sessionsQueryKeys.all).toEqual(["sessions"]);
      expect(sessionsQueryKeys.byTreatment("123")).toEqual(["sessions", "treatment", "123"]);
    });

  });
});
