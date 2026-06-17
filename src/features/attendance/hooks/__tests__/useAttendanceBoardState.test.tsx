/**
 * useAttendanceBoardState Tests
 *
 * Test suite for the hybrid attendance management hook that combines
 * React Query server state and Zustand UI state.
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { ClinicTimezoneProvider } from "@/contexts/ClinicTimezoneContext";
import * as timezoneDate from "@/utils/timezoneDate";
import { useAttendanceBoardState } from "../useAttendanceBoardState";
import { useDateHelpers } from "@/hooks/useDateHelpers";
import {
  useAttendancesByDate,
  useNextAttendanceDate,
} from "@/api/query/hooks/useAttendanceQueries";

// Type the mocked hooks
const mockUseAttendancesByDate = useAttendancesByDate as jest.MockedFunction<
  typeof useAttendancesByDate
>;
const mockUseNextAttendanceDate = useNextAttendanceDate as jest.MockedFunction<
  typeof useNextAttendanceDate
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
jest.mock("@/api/query/hooks/useAttendanceQueries", () => ({
  useAttendancesByDate: jest.fn(() => ({
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
  useNextAttendanceDate: jest.fn(() => ({
    data: "2024-01-15",
    isLoading: false,
  })),
  useCreateAttendance: jest.fn(() => ({
    mutateAsync: jest.fn(),
  })),
  useUpdateAttendance: jest.fn(() => ({
    mutateAsync: jest.fn(),
  })),
  useCompleteAttendance: jest.fn(() => ({
    mutateAsync: jest.fn(),
  })),
  useMarkAttendanceAsMissed: jest.fn(() => ({
    mutateAsync: jest.fn(),
  })),
  useDeleteAttendance: jest.fn(() => ({
    mutateAsync: jest.fn(),
  })),
  useCheckInAttendance: jest.fn(() => ({
    mutateAsync: jest.fn(),
  })),
  useHandleIncompleteAttendances: jest.fn(() => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true }),
  })),
  useHandleAbsenceJustifications: jest.fn(() => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true }),
  })),
  useRefreshAttendances: jest.fn(() => jest.fn()),
}));

// Mock store hooks (define before jest.mock)
const mockUseSelectedDate = jest.fn();
const mockUseAttendanceError = jest.fn();
const mockSetSelectedDate = jest.fn();
const mockSetError = jest.fn();

jest.mock("@/stores", () => ({
  useSelectedDate: () => mockUseSelectedDate(),
  useAttendanceLoading: jest.fn(() => false),
  useAttendanceDataLoading: jest.fn(() => false),
  useAttendanceError: () => mockUseAttendanceError(),
  useSetSelectedDate: jest.fn(() => mockSetSelectedDate),
  useSetAttendanceLoading: jest.fn(() => jest.fn()),
  useSetAttendanceDataLoading: jest.fn(() => jest.fn()),
  useSetAttendanceError: jest.fn(() => mockSetError),
  useCheckEndOfDayStatus: jest.fn(() => () => ({ type: "completed" })),
  useDayFinalized: jest.fn(() => false),
  useEndOfDayStatus: jest.fn(() => null),
  useAttendanceStore: {
    getState: () => ({
      resetState: jest.fn(),
    }),
  },
}));

describe("useAttendanceBoardState", () => {
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
    mockUseAttendanceError.mockReturnValue(null);
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

  it("should NOT redirect when used on a different page (e.g. agenda)", () => {
    mockUsePathname.mockReturnValue("/agenda");

    const { result, rerender } = renderHook(() => useAttendanceBoardState(), {
      wrapper: createWrapper,
    });

    act(() => {
      result.current.setSelectedDate("2025-01-20");
      mockUseSelectedDate.mockReturnValue("2025-01-20");
    });
    rerender();

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("should provide attendance data from React Query", async () => {
    const { result } = renderHook(() => useAttendanceBoardState(), {
      wrapper: createWrapper,
    });

    expect(result.current.attendancesByDate).toBeDefined();
    expect(result.current.attendancesByDate?.assessment).toBeDefined();
    expect(result.current.attendancesByDate?.physiotherapy).toBeDefined();
    expect(result.current.attendancesByDate?.tens).toBeDefined();
  });

  it("should provide UI state from Zustand store", () => {
    const { result } = renderHook(() => useAttendanceBoardState(), {
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
    const { result, rerender } = renderHook(() => useAttendanceBoardState(), {
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

  it("should handle incomplete attendances", async () => {
    const { result } = renderHook(() => useAttendanceBoardState(), {
      wrapper: createWrapper,
    });

    const incompleteAttendances = [
      {
        attendanceId: 1,
        name: "Patient 1",
        priority: "2" as const,
        patientName: "Patient 1",
      },
    ];

    const success = await result.current.handleIncompleteAttendances(
      incompleteAttendances,
      "complete",
    );
    expect(success).toBe(true);
  });

  it("should handle absence justifications", async () => {
    const { result } = renderHook(() => useAttendanceBoardState(), {
      wrapper: createWrapper,
    });

    const justifications = [
      {
        attendanceId: 1,
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
    const { result } = renderHook(() => useAttendanceBoardState(), {
      wrapper: createWrapper,
    });

    const status = result.current.checkEndOfDayStatus();
    expect(status.type).toBe("completed"); // Empty data means completed
  });

  it("should provide bridge methods for existing callers", () => {
    const { result } = renderHook(() => useAttendanceBoardState(), {
      wrapper: createWrapper,
    });

    // Bridge method delegates to a refresh and should not throw.
    expect(() => {
      result.current.setAttendancesByDate(null);
    }).not.toThrow();

    expect(typeof result.current.loadAttendancesByDate).toBe("function");
    expect(typeof result.current.initializeSelectedDate).toBe("function");
    expect(typeof result.current.refreshCurrentDate).toBe("function");
  });

  it("should update URL when selected date changes (only on attendance page)", () => {
    mockUsePathname.mockReturnValue("/attendance");

    const { result, rerender } = renderHook(() => useAttendanceBoardState(), {
      wrapper: createWrapper,
    });

    act(() => {
      result.current.setSelectedDate("2025-01-20");
      mockUseSelectedDate.mockReturnValue("2025-01-20");
    });
    rerender();

    expect(mockReplace).toHaveBeenCalledWith("/attendance?date=2025-01-20", {
      scroll: false,
    });

    mockUsePathname.mockReturnValue("/");
  });

  it("should update URL to today when user selects today while URL has a past date", () => {
    mockUsePathname.mockReturnValue("/attendance");
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === "date" ? "2026-03-17" : null,
    );

    const { result: dateHelpersResult } = renderHook(() => useDateHelpers(), {
      wrapper: createWrapper,
    });
    const todayFromContext = dateHelpersResult.current.getTodayDate();

    mockUseSelectedDate.mockReturnValue("2026-03-17");

    const { result, rerender } = renderHook(() => useAttendanceBoardState(), {
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
      `/attendance?date=${todayFromContext}`,
      { scroll: false },
    );
    mockUsePathname.mockReturnValue("/");
  });

  it("should NOT overwrite URL with today when loading page with a different date (avoids infinite redirect loop)", () => {
    mockUsePathname.mockReturnValue("/attendance");
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === "date" ? "2026-03-17" : null,
    );

    const { result: dateHelpersResult } = renderHook(() => useDateHelpers(), {
      wrapper: createWrapper,
    });
    const todayFromContext = dateHelpersResult.current.getTodayDate();
    mockUseSelectedDate.mockReturnValue(todayFromContext);

    renderHook(() => useAttendanceBoardState(), {
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

    renderHook(() => useAttendanceBoardState(), {
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

    renderHook(() => useAttendanceBoardState(), {
      wrapper: createWrapper,
    });

    await waitFor(() => {
      expect(mockSetSelectedDate).not.toHaveBeenCalled();
    });
  });

  it("should expose the attendance board hook contract", () => {
    const { result } = renderHook(() => useAttendanceBoardState(), {
      wrapper: createWrapper,
    });

    // Verify all expected properties exist
    const expectedProperties = [
      "attendancesByDate",
      "selectedDate",
      "loading",
      "dataLoading",
      "error",
      "dayFinalized",
      "endOfDayStatus",
      "setSelectedDate",
      "setAttendancesByDate",
      "loadAttendancesByDate",
      "initializeSelectedDate",
      "refreshCurrentDate",
      "checkEndOfDayStatus",
      "handleIncompleteAttendances",
      "handleAbsenceJustifications",
    ];

    expectedProperties.forEach((prop) => {
      expect(result.current).toHaveProperty(prop);
    });
  });

  it("should initialize selected date from next available date", async () => {
    const { result } = renderHook(() => useAttendanceBoardState(), {
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
      useAttendancesByDate,
      useNextAttendanceDate,
      useHandleIncompleteAttendances,
      useHandleAbsenceJustifications,
    } = jest.requireMock("@/api/query/hooks/useAttendanceQueries");

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
      useAttendancesByDate.mockReturnValue({
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
      useNextAttendanceDate.mockReturnValue({
        data: "2024-01-15",
        isLoading: false,
      });
      useHandleIncompleteAttendances.mockReturnValue({
        mutateAsync: jest.fn().mockResolvedValue({ success: true }),
      });
      useHandleAbsenceJustifications.mockReturnValue({
        mutateAsync: jest.fn().mockResolvedValue({ success: true }),
      });
    });

    it("should handle errors in loadAttendancesByDate", async () => {
      const mockRefetch = jest.fn().mockRejectedValue(new Error("API Error"));

      useAttendancesByDate.mockReturnValue({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: null as any,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useAttendanceBoardState(), {
        wrapper: createWrapper,
      });

      const resultData =
        await result.current.loadAttendancesByDate("2024-01-15");

      expect(resultData).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        "Error loading attendances by date:",
        expect.any(Error),
      );
    });

    it("should handle errors in initializeSelectedDate without nextDate", async () => {
      mockUseNextAttendanceDate.mockReturnValue({
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

      const { result } = renderHook(() => useAttendanceBoardState(), {
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

      const { result } = renderHook(() => useAttendanceBoardState(), {
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

    it("should handle errors in handleIncompleteAttendances", async () => {
      useHandleIncompleteAttendances.mockReturnValue({
        mutateAsync: jest
          .fn()
          .mockRejectedValue(new Error("Handle incomplete failed")),
      });

      const { result } = renderHook(() => useAttendanceBoardState(), {
        wrapper: createWrapper,
      });

      const incompleteAttendances = [
        {
          attendanceId: 1,
          name: "Patient 1",
          priority: "2" as const,
          patientName: "Patient 1",
        },
      ];

      const success = await result.current.handleIncompleteAttendances(
        incompleteAttendances,
        "complete",
      );

      expect(success).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        "Error handling incomplete attendances:",
        expect.any(Error),
      );
    });

    it("should handle errors in handleAbsenceJustifications", async () => {
      useHandleAbsenceJustifications.mockReturnValue({
        mutateAsync: jest
          .fn()
          .mockRejectedValue(new Error("Handle absence failed")),
      });

      const { result } = renderHook(() => useAttendanceBoardState(), {
        wrapper: createWrapper,
      });

      const justifications = [
        {
          attendanceId: 1,
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
      mockUseAttendancesByDate.mockReturnValue({
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

      renderHook(() => useAttendanceBoardState(), {
        wrapper: createWrapper,
      });

      // The useEffect in the hook should sync the error
      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith("Query failed");
      });
    });

    it("should handle loadAttendancesByDate with same date (refetch path)", async () => {
      const mockRefetch = jest.fn().mockResolvedValue({ data: null });

      useAttendancesByDate.mockReturnValue({
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

      const { result } = renderHook(() => useAttendanceBoardState(), {
        wrapper: createWrapper,
      });

      // Load the same date that's already selected
      const currentDate = result.current.selectedDate;
      const resultData =
        await result.current.loadAttendancesByDate(currentDate);

      expect(mockRefetch).toHaveBeenCalled();
      expect(resultData).toBeDefined();
    });
  });
});
