import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useBoardWorkflow } from "../useBoardWorkflow";
import { useBoardState } from "@/features/board/hooks/useBoardState";
import { getIncompleteAppointments } from "../../utils/appointmentDataUtils";
import * as appointmentQueries from "@/api/query/hooks/useAppointmentQueries";

// Mock dependencies
jest.mock("@/features/board/hooks/useBoardState");
jest.mock("@/api/query/hooks/useAppointmentQueries");
jest.mock("@/stores");
jest.mock("@/api/query/hooks/useDayFinalizationQueries", () => ({
  useDayFinalizationStatus: jest.fn(() => ({
    data: { isFinalized: false },
    isLoading: false,
  })),
}));
jest.mock("../../utils/appointmentDataUtils", () => ({
  getIncompleteAppointments: jest.fn(() => []),
  getDefaultCollapsedForDate: jest.fn(() => ({
    assessment: true,
    physiotherapy: true,
    tens: true,
    combined: true,
  })),
}));

const mockUseAppointmentsBoardState =
  useBoardState as jest.MockedFunction<
    typeof useBoardState
  >;
const mockGetIncompleteAppointments =
  getIncompleteAppointments as jest.MockedFunction<
    typeof getIncompleteAppointments
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

(appointmentQueries.useCompleteAppointment as jest.Mock).mockReturnValue(
  mockCompleteMutation,
);
(appointmentQueries.useUpdateAppointment as jest.Mock).mockReturnValue(
  mockUpdateMutation,
);

// Mock console.error to prevent test noise
const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

describe("useBoardWorkflow", () => {
  let queryClient: QueryClient;

  const createWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const defaultMockContext = {
    appointmentsByDate: null,
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
    (mockUseAppointmentsBoardState as jest.Mock).mockReturnValue(
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
      const { result } = renderHook(() => useBoardWorkflow(), {
        wrapper: createWrapper,
      });
      // With appointmentsByDate null, all sections start collapsed (true)
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
      const { result } = renderHook(() => useBoardWorkflow(), {
        wrapper: createWrapper,
      });
      // With appointmentsByDate null, all sections start collapsed (true)
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
      const { result } = renderHook(() => useBoardWorkflow(), {
        wrapper: createWrapper,
      });
      // With appointmentsByDate null, sections start collapsed; toggle to expanded then back to collapsed then to expanded
      act(() => {
        result.current.toggleCollapsed("assessment");
        result.current.toggleCollapsed("assessment");
        result.current.toggleCollapsed("assessment"); // Back to expanded
      });

      expect(result.current.collapsed.assessment).toBe(false);
    });
  });

  describe("Appointment status operations", () => {
    it("should handle null appointmentsByDate when completing appointment", async () => {
      const { result } = renderHook(() => useBoardWorkflow(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.handleAppointmentCompletion(2);
      });

      expect(consoleSpy).toHaveBeenCalledWith("No appointment data available");
      expect(mockCompleteMutation.mutateAsync).not.toHaveBeenCalled();
    });

    it("should handle null appointmentsByDate when rescheduling appointment", async () => {
      const { result } = renderHook(() => useBoardWorkflow(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.handleAppointmentReschedule(2);
      });

      expect(consoleSpy).toHaveBeenCalledWith("No appointment data available");
      expect(mockUpdateMutation.mutateAsync).not.toHaveBeenCalled();
    });

    it("should successfully complete appointment when found in incomplete appointments", async () => {
      const mockAppointmentsByDate = {
        "2024-01-15": [
          {
            appointmentId: 123,
            status: "in_progress",
            patientName: "Test Patient",
          },
        ],
      };
      const mockContext = {
        ...defaultMockContext,
        appointmentsByDate: mockAppointmentsByDate,
      };

      // Mock getIncompleteAppointments to return the appointment
      mockGetIncompleteAppointments.mockReturnValue([
        {
          appointmentId: 123,
          name: "Test Patient",
          priority: "3",
          appointmentType: "assessment",
        },
      ]);

      (mockUseAppointmentsBoardState as jest.Mock).mockReturnValue(mockContext);

      const { result } = renderHook(() => useBoardWorkflow(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.handleAppointmentCompletion(123);
      });

      expect(mockCompleteMutation.mutateAsync).toHaveBeenCalledWith({
        id: "123",
      });
      expect(mockContext.refreshCurrentDate).toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalledWith("Appointment not found:", 123);
    });

    it("should handle appointment not found during completion", async () => {
      const mockAppointmentsByDate = {
        "2024-01-15": [
          {
            appointmentId: 999,
            status: "in_progress",
            patientName: "Test Patient",
          },
        ],
      };
      const mockContext = {
        ...defaultMockContext,
        appointmentsByDate: mockAppointmentsByDate,
      };

      // Mock getIncompleteAppointments to return empty array (appointment not found)
      mockGetIncompleteAppointments.mockReturnValue([]);

      (mockUseAppointmentsBoardState as jest.Mock).mockReturnValue(mockContext);

      const { result } = renderHook(() => useBoardWorkflow(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.handleAppointmentCompletion(123);
      });

      expect(consoleSpy).toHaveBeenCalledWith("Appointment not found:", 123);
      expect(mockCompleteMutation.mutateAsync).not.toHaveBeenCalled();
      expect(mockContext.refreshCurrentDate).not.toHaveBeenCalled();
    });

    it("should handle error during appointment completion", async () => {
      const mockAppointmentsByDate = {
        "2024-01-15": [
          {
            appointmentId: 123,
            status: "in_progress",
            patientName: "Test Patient",
          },
        ],
      };
      const mockContext = {
        ...defaultMockContext,
        appointmentsByDate: mockAppointmentsByDate,
      };

      mockGetIncompleteAppointments.mockReturnValue([
        {
          appointmentId: 123,
          name: "Test Patient",
          priority: "3",
          appointmentType: "assessment",
        },
      ]);

      (mockUseAppointmentsBoardState as jest.Mock).mockReturnValue(mockContext);

      // Mock mutation to throw an error
      const testError = new Error("Update failed");
      mockCompleteMutation.mutateAsync.mockRejectedValue(testError);

      const { result } = renderHook(() => useBoardWorkflow(), {
        wrapper: createWrapper,
      });

      await expect(async () => {
        await act(async () => {
          await result.current.handleAppointmentCompletion(123);
        });
      }).rejects.toThrow("Update failed");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error completing appointment:",
        testError,
      );
      expect(mockContext.refreshCurrentDate).not.toHaveBeenCalled();
    });

    it("should successfully reschedule appointment when found in incomplete appointments", async () => {
      const mockAppointmentsByDate = {
        "2024-01-15": [
          {
            appointmentId: 456,
            status: "in_progress",
            patientName: "Test Patient",
          },
        ],
      };
      const mockContext = {
        ...defaultMockContext,
        appointmentsByDate: mockAppointmentsByDate,
      };

      mockGetIncompleteAppointments.mockReturnValue([
        {
          appointmentId: 456,
          name: "Test Patient",
          priority: "3",
          appointmentType: "assessment",
        },
      ]);

      (mockUseAppointmentsBoardState as jest.Mock).mockReturnValue(mockContext);

      const { result } = renderHook(() => useBoardWorkflow(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.handleAppointmentReschedule(456);
      });

      expect(mockUpdateMutation.mutateAsync).toHaveBeenCalledWith({
        id: "456",
        status: "scheduled",
      });
      expect(mockContext.refreshCurrentDate).toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalledWith("Appointment not found:", 456);
    });

    it("should handle appointment not found during rescheduling", async () => {
      const mockAppointmentsByDate = {
        "2024-01-15": [
          {
            appointmentId: 999,
            status: "in_progress",
            patientName: "Test Patient",
          },
        ],
      };
      const mockContext = {
        ...defaultMockContext,
        appointmentsByDate: mockAppointmentsByDate,
      };

      mockGetIncompleteAppointments.mockReturnValue([]);

      (mockUseAppointmentsBoardState as jest.Mock).mockReturnValue(mockContext);

      const { result } = renderHook(() => useBoardWorkflow(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.handleAppointmentReschedule(456);
      });

      expect(consoleSpy).toHaveBeenCalledWith("Appointment not found:", 456);
      expect(mockUpdateMutation.mutateAsync).not.toHaveBeenCalled();
      expect(mockContext.refreshCurrentDate).not.toHaveBeenCalled();
    });

    it("should handle error during appointment rescheduling", async () => {
      const mockAppointmentsByDate = {
        "2024-01-15": [
          {
            appointmentId: 456,
            status: "in_progress",
            patientName: "Test Patient",
          },
        ],
      };
      const mockContext = {
        ...defaultMockContext,
        appointmentsByDate: mockAppointmentsByDate,
      };

      mockGetIncompleteAppointments.mockReturnValue([
        {
          appointmentId: 456,
          name: "Test Patient",
          priority: "3",
          appointmentType: "assessment",
        },
      ]);

      (mockUseAppointmentsBoardState as jest.Mock).mockReturnValue(mockContext);

      // Mock mutation to throw an error
      const testError = new Error("Reschedule failed");
      mockUpdateMutation.mutateAsync.mockRejectedValue(testError);

      const { result } = renderHook(() => useBoardWorkflow(), {
        wrapper: createWrapper,
      });

      await expect(async () => {
        await act(async () => {
          await result.current.handleAppointmentReschedule(456);
        });
      }).rejects.toThrow("Reschedule failed");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error rescheduling appointment:",
        testError,
      );
      expect(mockContext.refreshCurrentDate).not.toHaveBeenCalled();
    });
  });

  describe("Basic functionality", () => {
    it("should return correct hook interface", () => {
      const { result } = renderHook(() => useBoardWorkflow(), {
        wrapper: createWrapper,
      });

      expect(result.current).toHaveProperty("collapsed");
      expect(result.current).toHaveProperty("isDayFinalized");
      expect(result.current).toHaveProperty("isCheckingFinalization");
      expect(result.current).toHaveProperty("toggleCollapsed");
      expect(result.current).toHaveProperty("handleAppointmentCompletion");
      expect(result.current).toHaveProperty("handleAppointmentReschedule");

      expect(typeof result.current.toggleCollapsed).toBe("function");
      expect(typeof result.current.handleAppointmentCompletion).toBe("function");
      expect(typeof result.current.handleAppointmentReschedule).toBe("function");
    });
  });
});
