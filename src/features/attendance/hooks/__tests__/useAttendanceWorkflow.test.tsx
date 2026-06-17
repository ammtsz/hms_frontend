import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useAttendanceWorkflow } from "../useAttendanceWorkflow";
import { useAttendanceBoardState } from "@/features/attendance/hooks/useAttendanceBoardState";
import { getIncompleteAttendances } from "../../utils/attendanceDataUtils";
import * as attendanceQueries from "@/api/query/hooks/useAttendanceQueries";

// Mock dependencies
jest.mock("@/features/attendance/hooks/useAttendanceBoardState");
jest.mock("@/api/query/hooks/useAttendanceQueries");
jest.mock("@/stores");
jest.mock("@/api/query/hooks/useDayFinalizationQueries", () => ({
  useDayFinalizationStatus: jest.fn(() => ({
    data: { isFinalized: false },
    isLoading: false,
  })),
}));
jest.mock("../../utils/attendanceDataUtils", () => ({
  getIncompleteAttendances: jest.fn(() => []),
  getDefaultCollapsedForDate: jest.fn(() => ({
    assessment: true,
    physiotherapy: true,
    tens: true,
    combined: true,
  })),
}));

const mockUseAttendanceBoardState =
  useAttendanceBoardState as jest.MockedFunction<
    typeof useAttendanceBoardState
  >;
const mockGetIncompleteAttendances =
  getIncompleteAttendances as jest.MockedFunction<
    typeof getIncompleteAttendances
  >;

// Mock React Query hooks
const mockCompleteMutation = {
  mutateAsync: jest.fn(),
  mutate: jest.fn(),
  isPending: false,
  isIdle: true,
  reset: jest.fn(),
};

const mockUpdateMutation = {
  mutateAsync: jest.fn(),
  mutate: jest.fn(),
  isPending: false,
  isIdle: true,
  reset: jest.fn(),
};

(attendanceQueries.useCompleteAttendance as jest.Mock).mockReturnValue(
  mockCompleteMutation,
);
(attendanceQueries.useUpdateAttendance as jest.Mock).mockReturnValue(
  mockUpdateMutation,
);

// Mock console.error to prevent test noise
const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

describe("useAttendanceWorkflow", () => {
  let queryClient: QueryClient;

  const createWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const defaultMockContext = {
    attendancesByDate: null,
    selectedDate: "2024-01-15",
    refreshCurrentDate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset mutation mocks
    mockCompleteMutation.mutateAsync.mockResolvedValue({});
    mockUpdateMutation.mutateAsync.mockResolvedValue({});

    // Cast to jest.Mock to avoid complex interface matching
    (mockUseAttendanceBoardState as jest.Mock).mockReturnValue(
      defaultMockContext,
    );

    consoleSpy.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe("Section collapse functionality", () => {
    it("should toggle section collapse state", () => {
      const { result } = renderHook(() => useAttendanceWorkflow(), {
        wrapper: createWrapper,
      });
      // With attendancesByDate null, all sections start collapsed (true)
      expect(result.current.collapsed.assessment).toBe(true);

      act(() => {
        result.current.toggleCollapsed("assessment");
      });

      expect(result.current.collapsed.assessment).toBe(false);
      expect(result.current.collapsed.physiotherapy).toBe(true);
      expect(result.current.collapsed.tens).toBe(true);
      expect(result.current.collapsed.combined).toBe(true);
    });

    it("should toggle multiple sections independently", () => {
      const { result } = renderHook(() => useAttendanceWorkflow(), {
        wrapper: createWrapper,
      });
      // With attendancesByDate null, all sections start collapsed (true)
      act(() => {
        result.current.toggleCollapsed("assessment");
        result.current.toggleCollapsed("physiotherapy");
      });

      expect(result.current.collapsed.assessment).toBe(false);
      expect(result.current.collapsed.physiotherapy).toBe(false);
      expect(result.current.collapsed.tens).toBe(true);
      expect(result.current.collapsed.combined).toBe(true);
    });

    it("should toggle section back to expanded", () => {
      const { result } = renderHook(() => useAttendanceWorkflow(), {
        wrapper: createWrapper,
      });
      // With attendancesByDate null, sections start collapsed; toggle to expanded then back to collapsed then to expanded
      act(() => {
        result.current.toggleCollapsed("assessment");
        result.current.toggleCollapsed("assessment");
        result.current.toggleCollapsed("assessment"); // Back to expanded
      });

      expect(result.current.collapsed.assessment).toBe(false);
    });
  });

  describe("Attendance status operations", () => {
    it("should handle null attendancesByDate when completing attendance", async () => {
      const { result } = renderHook(() => useAttendanceWorkflow(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.handleAttendanceCompletion(2);
      });

      expect(consoleSpy).toHaveBeenCalledWith("No attendance data available");
      expect(mockCompleteMutation.mutateAsync).not.toHaveBeenCalled();
    });

    it("should handle null attendancesByDate when rescheduling attendance", async () => {
      const { result } = renderHook(() => useAttendanceWorkflow(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.handleAttendanceReschedule(2);
      });

      expect(consoleSpy).toHaveBeenCalledWith("No attendance data available");
      expect(mockUpdateMutation.mutateAsync).not.toHaveBeenCalled();
    });

    it("should successfully complete attendance when found in incomplete attendances", async () => {
      const mockAttendancesByDate = {
        "2024-01-15": [
          {
            attendanceId: 123,
            status: "in_progress",
            patientName: "Test Patient",
          },
        ],
      };
      const mockContext = {
        ...defaultMockContext,
        attendancesByDate: mockAttendancesByDate,
      };

      // Mock getIncompleteAttendances to return the attendance
      mockGetIncompleteAttendances.mockReturnValue([
        {
          attendanceId: 123,
          name: "Test Patient",
          priority: "3",
          attendanceType: "assessment",
        },
      ]);

      (mockUseAttendanceBoardState as jest.Mock).mockReturnValue(mockContext);

      const { result } = renderHook(() => useAttendanceWorkflow(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.handleAttendanceCompletion(123);
      });

      expect(mockCompleteMutation.mutateAsync).toHaveBeenCalledWith({
        id: "123",
      });
      expect(mockContext.refreshCurrentDate).toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalledWith("Attendance not found:", 123);
    });

    it("should handle attendance not found during completion", async () => {
      const mockAttendancesByDate = {
        "2024-01-15": [
          {
            attendanceId: 999,
            status: "in_progress",
            patientName: "Test Patient",
          },
        ],
      };
      const mockContext = {
        ...defaultMockContext,
        attendancesByDate: mockAttendancesByDate,
      };

      // Mock getIncompleteAttendances to return empty array (attendance not found)
      mockGetIncompleteAttendances.mockReturnValue([]);

      (mockUseAttendanceBoardState as jest.Mock).mockReturnValue(mockContext);

      const { result } = renderHook(() => useAttendanceWorkflow(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.handleAttendanceCompletion(123);
      });

      expect(consoleSpy).toHaveBeenCalledWith("Attendance not found:", 123);
      expect(mockCompleteMutation.mutateAsync).not.toHaveBeenCalled();
      expect(mockContext.refreshCurrentDate).not.toHaveBeenCalled();
    });

    it("should handle error during attendance completion", async () => {
      const mockAttendancesByDate = {
        "2024-01-15": [
          {
            attendanceId: 123,
            status: "in_progress",
            patientName: "Test Patient",
          },
        ],
      };
      const mockContext = {
        ...defaultMockContext,
        attendancesByDate: mockAttendancesByDate,
      };

      mockGetIncompleteAttendances.mockReturnValue([
        {
          attendanceId: 123,
          name: "Test Patient",
          priority: "3",
          attendanceType: "assessment",
        },
      ]);

      (mockUseAttendanceBoardState as jest.Mock).mockReturnValue(mockContext);

      // Mock mutation to throw an error
      const testError = new Error("Update failed");
      mockCompleteMutation.mutateAsync.mockRejectedValue(testError);

      const { result } = renderHook(() => useAttendanceWorkflow(), {
        wrapper: createWrapper,
      });

      await expect(async () => {
        await act(async () => {
          await result.current.handleAttendanceCompletion(123);
        });
      }).rejects.toThrow("Update failed");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error completing attendance:",
        testError,
      );
      expect(mockContext.refreshCurrentDate).not.toHaveBeenCalled();
    });

    it("should successfully reschedule attendance when found in incomplete attendances", async () => {
      const mockAttendancesByDate = {
        "2024-01-15": [
          {
            attendanceId: 456,
            status: "in_progress",
            patientName: "Test Patient",
          },
        ],
      };
      const mockContext = {
        ...defaultMockContext,
        attendancesByDate: mockAttendancesByDate,
      };

      mockGetIncompleteAttendances.mockReturnValue([
        {
          attendanceId: 456,
          name: "Test Patient",
          priority: "3",
          attendanceType: "assessment",
        },
      ]);

      (mockUseAttendanceBoardState as jest.Mock).mockReturnValue(mockContext);

      const { result } = renderHook(() => useAttendanceWorkflow(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.handleAttendanceReschedule(456);
      });

      expect(mockUpdateMutation.mutateAsync).toHaveBeenCalledWith({
        id: "456",
        status: "scheduled",
      });
      expect(mockContext.refreshCurrentDate).toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalledWith("Attendance not found:", 456);
    });

    it("should handle attendance not found during rescheduling", async () => {
      const mockAttendancesByDate = {
        "2024-01-15": [
          {
            attendanceId: 999,
            status: "in_progress",
            patientName: "Test Patient",
          },
        ],
      };
      const mockContext = {
        ...defaultMockContext,
        attendancesByDate: mockAttendancesByDate,
      };

      mockGetIncompleteAttendances.mockReturnValue([]);

      (mockUseAttendanceBoardState as jest.Mock).mockReturnValue(mockContext);

      const { result } = renderHook(() => useAttendanceWorkflow(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.handleAttendanceReschedule(456);
      });

      expect(consoleSpy).toHaveBeenCalledWith("Attendance not found:", 456);
      expect(mockUpdateMutation.mutateAsync).not.toHaveBeenCalled();
      expect(mockContext.refreshCurrentDate).not.toHaveBeenCalled();
    });

    it("should handle error during attendance rescheduling", async () => {
      const mockAttendancesByDate = {
        "2024-01-15": [
          {
            attendanceId: 456,
            status: "in_progress",
            patientName: "Test Patient",
          },
        ],
      };
      const mockContext = {
        ...defaultMockContext,
        attendancesByDate: mockAttendancesByDate,
      };

      mockGetIncompleteAttendances.mockReturnValue([
        {
          attendanceId: 456,
          name: "Test Patient",
          priority: "3",
          attendanceType: "assessment",
        },
      ]);

      (mockUseAttendanceBoardState as jest.Mock).mockReturnValue(mockContext);

      // Mock mutation to throw an error
      const testError = new Error("Reschedule failed");
      mockUpdateMutation.mutateAsync.mockRejectedValue(testError);

      const { result } = renderHook(() => useAttendanceWorkflow(), {
        wrapper: createWrapper,
      });

      await expect(async () => {
        await act(async () => {
          await result.current.handleAttendanceReschedule(456);
        });
      }).rejects.toThrow("Reschedule failed");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error rescheduling attendance:",
        testError,
      );
      expect(mockContext.refreshCurrentDate).not.toHaveBeenCalled();
    });
  });

  describe("Basic functionality", () => {
    it("should return correct hook interface", () => {
      const { result } = renderHook(() => useAttendanceWorkflow(), {
        wrapper: createWrapper,
      });

      expect(result.current).toHaveProperty("collapsed");
      expect(result.current).toHaveProperty("isDayFinalized");
      expect(result.current).toHaveProperty("isCheckingFinalization");
      expect(result.current).toHaveProperty("toggleCollapsed");
      expect(result.current).toHaveProperty("handleAttendanceCompletion");
      expect(result.current).toHaveProperty("handleAttendanceReschedule");

      expect(typeof result.current.toggleCollapsed).toBe("function");
      expect(typeof result.current.handleAttendanceCompletion).toBe("function");
      expect(typeof result.current.handleAttendanceReschedule).toBe("function");
    });
  });
});
