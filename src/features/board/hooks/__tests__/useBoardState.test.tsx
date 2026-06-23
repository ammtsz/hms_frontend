/**
 * useBoardState Tests
 *
 * Test suite for the hybrid appointment management hook that combines
 * React Query server state and Zustand UI state.
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { ClinicTimezoneProvider } from "@/contexts/ClinicTimezoneContext";
import * as timezoneDate from "@/utils/timezoneDate";
import { useBoardState } from "../useBoardState";
import { useDateHelpers } from "@/hooks/useDateHelpers";
import {
  useAppointmentsByDate,
  useNextAppointmentDate,
} from "@/api/query/hooks/useAppointmentQueries";

// Type the mocked hooks
const mockUseAppointmentsByDate = useAppointmentsByDate as jest.MockedFunction<
  typeof useAppointmentsByDate
>;
const mockUseNextAppointmentDate = useNextAppointmentDate as jest.MockedFunction<
  typeof useNextAppointmentDate
>;

// Mock next/navigation for URL param sync
const mockReplace = jest.fn();
const mockSearchParamsGet = jest.fn((key: string): string | null =>
  key === "date" ? null : null,
);
const mockUsePathname = jest.fn(() => "/");
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockUsePathname(),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParamsGet(key),
    toString: () => {
      const d = mockSearchParamsGet("date");
      return d ? `date=${d}` : "";
    },
  }),
}));

// Mock the React Query hooks
jest.mock("@/api/query/hooks/useAppointmentQueries", () => ({
  useAppointmentsByDate: jest.fn(() => ({
    data: {
      assessment: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
      physiotherapy: {
        scheduled: [],
        checkedIn: [],
        onGoing: [],
        completed: [],
      },
      tens: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  useNextAppointmentDate: jest.fn(() => ({
    data: "2024-01-15",
    isLoading: false,
  })),
  useCreateAppointment: jest.fn(() => ({
    mutateAsync: jest.fn(),
  })),
  useUpdateAppointment: jest.fn(() => ({
    mutateAsync: jest.fn(),
  })),
  useCompleteAppointment: jest.fn(() => ({
    mutateAsync: jest.fn(),
  })),
  useMarkAppointmentAsMissed: jest.fn(() => ({
    mutateAsync: jest.fn(),
  })),
  useDeleteAppointment: jest.fn(() => ({
    mutateAsync: jest.fn(),
  })),
  useCheckInAppointment: jest.fn(() => ({
    mutateAsync: jest.fn(),
  })),
  useHandleIncompleteAppointments: jest.fn(() => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true }),
  })),
  useHandleAbsenceJustifications: jest.fn(() => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true }),
  })),
  useRefreshAppointments: jest.fn(() => jest.fn()),
}));

// Mock store hooks (define before jest.mock)
const mockUseSelectedDate = jest.fn();
const mockUseAppointmentError = jest.fn();
const mockSetSelectedDate = jest.fn();
const mockSetError = jest.fn();

jest.mock("@/stores", () => ({
  useSelectedDate: () => mockUseSelectedDate(),
  useAppointmentLoading: jest.fn(() => false),
  useBoardDataLoading: jest.fn(() => false),
  useAppointmentError: () => mockUseAppointmentError(),
  useSetSelectedDate: jest.fn(() => mockSetSelectedDate),
  useSetAppointmentLoading: jest.fn(() => jest.fn()),
  useSetAppointmentDataLoading: jest.fn(() => jest.fn()),
  useSetAppointmentError: jest.fn(() => mockSetError),
  useCheckEndOfDayStatus: jest.fn(() => () => ({ type: "completed" })),
  useDayFinalized: jest.fn(() => false),
  useEndOfDayStatus: jest.fn(() => null),
  useBoardStore: {
    getState: () => ({
      resetState: jest.fn(),
    }),
  },
}));

describe("useBoardState", () => {
  let queryClient: QueryClient;

  const createWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ClinicTimezoneProvider>{children}</ClinicTimezoneProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset mock state
    mockUseSelectedDate.mockReset();
    mockUseSelectedDate.mockReturnValue("2024-01-15");
    mockUseAppointmentError.mockReturnValue(null);
    mockSetSelectedDate.mockReset();
    mockSetSelectedDate.mockImplementation((date: string) => {
      mockUseSelectedDate.mockReturnValue(date);
    });
    mockSetError.mockClear();
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === "date" ? null : null,
    );
    mockReplace.mockClear();
    mockUsePathname.mockReturnValue("/");
  });

  it("should NOT redirect when used on a different page (e.g. schedule)", () => {
    mockUsePathname.mockReturnValue("/schedule");

    const { result, rerender } = renderHook(() => useBoardState(), {
      wrapper: createWrapper,
    });

    act(() => {
      result.current.setSelectedDate("2025-01-20");
      mockUseSelectedDate.mockReturnValue("2025-01-20");
    });
    rerender();

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("should provide appointment data from React Query", async () => {
    const { result } = renderHook(() => useBoardState(), {
      wrapper: createWrapper,
    });

    expect(result.current.appointmentsByDate).toBeDefined();
    expect(result.current.appointmentsByDate?.assessment).toBeDefined();
    expect(result.current.appointmentsByDate?.physiotherapy).toBeDefined();
    expect(result.current.appointmentsByDate?.tens).toBeDefined();
  });

  it("should provide UI state from Zustand store", () => {
    const { result } = renderHook(() => useBoardState(), {
      wrapper: createWrapper,
    });

    // The selected date will be initialized by the useEffect with the mocked next date
    expect(result.current.selectedDate).toBe("2024-01-15");
    expect(result.current.loading).toBe(false);
    expect(result.current.dataLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.dayFinalized).toBe(false);
  });

  it("should update selected date via Zustand action", () => {
    const { result, rerender } = renderHook(() => useBoardState(), {
      wrapper: createWrapper,
    });

    const newDate = "2024-02-15";

    act(() => {
      result.current.setSelectedDate(newDate);
      // Simulate Zustand store update
      mockUseSelectedDate.mockReturnValue(newDate);
    });

    // Rerender to pick up the new mock value
    rerender();

    expect(mockSetSelectedDate).toHaveBeenCalledWith(newDate);
    expect(result.current.selectedDate).toBe(newDate);
  });

  it("should handle incomplete appointments", async () => {
    const { result } = renderHook(() => useBoardState(), {
      wrapper: createWrapper,
    });

    const incompleteAppointments = [
      {
        appointmentId: 1,
        name: "Patient 1",
        priority: "2" as const,
        patientName: "Patient 1",
      },
    ];

    const success = await result.current.handleIncompleteAppointments(
      incompleteAppointments,
      "complete",
    );
    expect(success).toBe(true);
  });

  it("should handle absence justifications", async () => {
    const { result } = renderHook(() => useBoardState(), {
      wrapper: createWrapper,
    });

    const justifications = [
      {
        appointmentId: 1,
        patientName: "Patient 1",
        justified: true,
        notes: "Called to reschedule",
      },
    ];

    const success =
      await result.current.handleAbsenceJustifications(justifications);
    expect(success).toBe(true);
  });

  it("should check endOfDay status", () => {
    const { result } = renderHook(() => useBoardState(), {
      wrapper: createWrapper,
    });

    const status = result.current.checkEndOfDayStatus();
    expect(status.type).toBe("completed"); // Empty data means completed
  });

  it("should provide bridge methods for existing callers", () => {
    const { result } = renderHook(() => useBoardState(), {
      wrapper: createWrapper,
    });

    // Bridge method delegates to a refresh and should not throw.
    expect(() => {
      result.current.setAppointmentsByDate(null);
    }).not.toThrow();

    expect(typeof result.current.loadAppointmentsByDate).toBe("function");
    expect(typeof result.current.initializeSelectedDate).toBe("function");
    expect(typeof result.current.refreshCurrentDate).toBe("function");
  });

  it("should update URL when selected date changes (only on appointment page)", () => {
    mockUsePathname.mockReturnValue("/board");

    const { result, rerender } = renderHook(() => useBoardState(), {
      wrapper: createWrapper,
    });

    act(() => {
      result.current.setSelectedDate("2025-01-20");
      mockUseSelectedDate.mockReturnValue("2025-01-20");
    });
    rerender();

    expect(mockReplace).toHaveBeenCalledWith("/board?date=2025-01-20", {
      scroll: false,
    });

    mockUsePathname.mockReturnValue("/");
  });

  it("should update URL to today when user selects today while URL has a past date", () => {
    mockUsePathname.mockReturnValue("/board");
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === "date" ? "2026-03-17" : null,
    );

    const { result: dateHelpersResult } = renderHook(() => useDateHelpers(), {
      wrapper: createWrapper,
    });
    const todayFromContext = dateHelpersResult.current.getTodayDate();

    mockUseSelectedDate.mockReturnValue("2026-03-17");

    const { result, rerender } = renderHook(() => useBoardState(), {
      wrapper: createWrapper,
    });

    // Let initial URL → store sync complete (avoids hasCompletedInitialUrlSync guard)
    rerender();
    mockReplace.mockClear();

    act(() => {
      result.current.setSelectedDate(todayFromContext);
      mockUseSelectedDate.mockReturnValue(todayFromContext);
    });
    rerender();

    expect(mockReplace).toHaveBeenCalledWith(
      `/board?date=${todayFromContext}`,
      { scroll: false },
    );
    mockUsePathname.mockReturnValue("/");
  });

  it("should NOT overwrite URL with today when loading page with a different date (avoids infinite redirect loop)", () => {
    mockUsePathname.mockReturnValue("/board");
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === "date" ? "2026-03-17" : null,
    );

    const { result: dateHelpersResult } = renderHook(() => useDateHelpers(), {
      wrapper: createWrapper,
    });
    const todayFromContext = dateHelpersResult.current.getTodayDate();
    mockUseSelectedDate.mockReturnValue(todayFromContext);

    renderHook(() => useBoardState(), {
      wrapper: createWrapper,
    });

    // Must not replace URL with today; otherwise we get 2026-03-17 → today → 2026-03-17 → ...
    expect(mockReplace).not.toHaveBeenCalled();
    mockUsePathname.mockReturnValue("/");
  });

  it("should sync date from URL params to store when valid", async () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === "date" ? "2025-02-15" : null,
    );
    mockUseSelectedDate.mockReturnValue("2024-01-15"); // Different from URL

    renderHook(() => useBoardState(), {
      wrapper: createWrapper,
    });

    await waitFor(() => {
      expect(mockSetSelectedDate).toHaveBeenCalledWith("2025-02-15");
    });
  });

  it("should ignore invalid date in URL params", async () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === "date" ? "invalid-date" : null,
    );

    renderHook(() => useBoardState(), {
      wrapper: createWrapper,
    });

    await waitFor(() => {
      expect(mockSetSelectedDate).not.toHaveBeenCalled();
    });
  });

  it("should expose the appointment board hook contract", () => {
    const { result } = renderHook(() => useBoardState(), {
      wrapper: createWrapper,
    });

    // Verify all expected properties exist
    const expectedProperties = [
      "appointmentsByDate",
      "selectedDate",
      "loading",
      "dataLoading",
      "error",
      "dayFinalized",
      "endOfDayStatus",
      "setSelectedDate",
      "setAppointmentsByDate",
      "loadAppointmentsByDate",
      "initializeSelectedDate",
      "refreshCurrentDate",
      "checkEndOfDayStatus",
      "handleIncompleteAppointments",
      "handleAbsenceJustifications",
    ];

    expectedProperties.forEach((prop) => {
      expect(result.current).toHaveProperty(prop);
    });
  });

  it("should initialize selected date from next available date", async () => {
    const { result } = renderHook(() => useBoardState(), {
      wrapper: createWrapper,
    });

    await waitFor(() => {
      result.current.initializeSelectedDate();
    });

    // Should use the mocked next date
    expect(result.current.selectedDate).toBe("2024-01-15");
  });

  describe("error handling", () => {
    const {
      useAppointmentsByDate,
      useNextAppointmentDate,
      useHandleIncompleteAppointments,
      useHandleAbsenceJustifications,
    } = jest.requireMock("@/api/query/hooks/useAppointmentQueries");

    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      // Mock console.error to avoid noise in test output
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    });

    afterEach(() => {
      if (consoleErrorSpy) {
        consoleErrorSpy.mockRestore();
      }
      // Reset all mocks to their default state
      useAppointmentsByDate.mockReturnValue({
        data: {
          assessment: {
            scheduled: [],
            checkedIn: [],
            onGoing: [],
            completed: [],
          },
          physiotherapy: {
            scheduled: [],
            checkedIn: [],
            onGoing: [],
            completed: [],
          },
          tens: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      useNextAppointmentDate.mockReturnValue({
        data: "2024-01-15",
        isLoading: false,
      });
      useHandleIncompleteAppointments.mockReturnValue({
        mutateAsync: jest.fn().mockResolvedValue({ success: true }),
      });
      useHandleAbsenceJustifications.mockReturnValue({
        mutateAsync: jest.fn().mockResolvedValue({ success: true }),
      });
    });

    it("should handle errors in loadAppointmentsByDate", async () => {
      const mockRefetch = jest.fn().mockRejectedValue(new Error("API Error"));

      useAppointmentsByDate.mockReturnValue({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: null as any,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper,
      });

      const resultData =
        await result.current.loadAppointmentsByDate("2024-01-15");

      expect(resultData).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        "Error loading appointments by date:",
        expect.any(Error),
      );
    });

    it("should handle errors in initializeSelectedDate without nextDate", async () => {
      mockUseNextAppointmentDate.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        isError: false,
        isPending: false,
        isSuccess: true,
        status: "success" as const,
        refetch: jest.fn(),
        fetchStatus: "idle" as const,
        isRefetching: false,
        isStale: false,
        isFetching: false,
        isInitialLoading: false,
        isPlaceholderData: false,
        isLoadingError: false,
        isRefetchError: false,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        isFetchedAfterMount: true,
        isPaused: false,
        errorUpdateCount: 0,
        isFetched: true,
        isEnabled: true,
        promise: Promise.resolve(null),
      });

      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.initializeSelectedDate();
      });

      // Should use timezone-aware current date (matches useDateHelpers.getTodayDate)
      const expectedDate = timezoneDate.getTodayClinic();
      expect(mockSetSelectedDate).toHaveBeenCalledWith(expectedDate);
    });

    it("should handle errors in initializeSelectedDate with exception", async () => {
      // Clear the console spy for this specific test
      consoleErrorSpy.mockClear();

      // Mock setSelectedDate to throw an error only the first time, succeed the second time
      let callCount = 0;
      mockSetSelectedDate.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error("Date setting failed");
        }
        // Second call (in catch block) should succeed
        return;
      });

      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.initializeSelectedDate();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error initializing selected date:",
        expect.any(Error),
      );
    });

    it("should handle errors in handleIncompleteAppointments", async () => {
      useHandleIncompleteAppointments.mockReturnValue({
        mutateAsync: jest
          .fn()
          .mockRejectedValue(new Error("Handle incomplete failed")),
      });

      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper,
      });

      const incompleteAppointments = [
        {
          appointmentId: 1,
          name: "Patient 1",
          priority: "2" as const,
          patientName: "Patient 1",
        },
      ];

      const success = await result.current.handleIncompleteAppointments(
        incompleteAppointments,
        "complete",
      );

      expect(success).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        "Error handling incomplete appointments:",
        expect.any(Error),
      );
    });

    it("should handle errors in handleAbsenceJustifications", async () => {
      useHandleAbsenceJustifications.mockReturnValue({
        mutateAsync: jest
          .fn()
          .mockRejectedValue(new Error("Handle absence failed")),
      });

      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper,
      });

      const justifications = [
        {
          appointmentId: 1,
          patientName: "Patient 1",
          justified: true,
          notes: "Called to reschedule",
        },
      ];

      const success =
        await result.current.handleAbsenceJustifications(justifications);

      expect(success).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        "Error handling absence justifications:",
        expect.any(Error),
      );
    });

    it("should handle error state sync from React Query", async () => {
      // Clear the console spy for this specific test
      consoleErrorSpy.mockClear();

      const mockError = new Error("Query failed");

      // First set up the mocked hook to return the error
      mockUseAppointmentsByDate.mockReturnValue({
        data: {
          date: timezoneDate.getTodayClinic(),
          assessment: {
            scheduled: [],
            checkedIn: [],
            onGoing: [],
            completed: [],
          },
          physiotherapy: {
            scheduled: [],
            checkedIn: [],
            onGoing: [],
            completed: [],
          },
          tens: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
          combined: {
            scheduled: [],
            checkedIn: [],
            onGoing: [],
            completed: [],
          },
        },
        isLoading: false,
        error: mockError,
        isError: true,
        isPending: false,
        isSuccess: false,
        status: "error" as const,
        refetch: jest.fn(),
        fetchStatus: "idle" as const,
        isRefetching: false,
        isStale: false,
        isFetching: false,
        isInitialLoading: false,
        isPlaceholderData: false,
        isLoadingError: false,
        isRefetchError: true,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: Date.now(),
        failureCount: 1,
        failureReason: mockError,
        isFetchedAfterMount: true,
        isPaused: false,
        errorUpdateCount: 1,
        isFetched: true,
        isEnabled: true,
        promise: Promise.resolve(null),
      });

      renderHook(() => useBoardState(), {
        wrapper: createWrapper,
      });

      // The useEffect in the hook should sync the error
      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith("Query failed");
      });
    });

    it("should handle loadAppointmentsByDate with same date (refetch path)", async () => {
      const mockRefetch = jest.fn().mockResolvedValue({ data: null });

      useAppointmentsByDate.mockReturnValue({
        data: {
          assessment: {
            scheduled: [],
            checkedIn: [],
            onGoing: [],
            completed: [],
          },
          physiotherapy: {
            scheduled: [],
            checkedIn: [],
            onGoing: [],
            completed: [],
          },
          tens: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper,
      });

      // Load the same date that's already selected
      const currentDate = result.current.selectedDate;
      const resultData =
        await result.current.loadAppointmentsByDate(currentDate);

      expect(mockRefetch).toHaveBeenCalled();
      expect(resultData).toBeDefined();
    });
  });
});
