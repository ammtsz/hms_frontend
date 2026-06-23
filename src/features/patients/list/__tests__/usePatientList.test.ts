import { renderHook, act } from "@testing-library/react";
import { usePatientList } from "../hooks/usePatientList";
import { usePatients } from "@/api/query/hooks/usePatientQueries";
import { usePriorities } from "@/api/query/hooks/usePriorityOptionsQueries";
import { PatientBasic } from "@/types/types";
import type { UseQueryResult } from "@tanstack/react-query";

// Mock the usePatients hook
jest.mock("@/api/query/hooks/usePatientQueries");
jest.mock("@/api/query/hooks/usePriorityOptionsQueries", () => ({
  usePriorities: jest.fn(),
}));

const mockUsePatients = usePatients as jest.MockedFunction<typeof usePatients>;
const mockUsePriorities = usePriorities as jest.MockedFunction<
  typeof usePriorities
>;

// Mock window.addEventListener and removeEventListener
Object.defineProperty(window, "addEventListener", {
  value: jest.fn(),
  writable: true,
});

Object.defineProperty(window, "removeEventListener", {
  value: jest.fn(),
  writable: true,
});

Object.defineProperty(window, "innerHeight", {
  value: 1000,
  writable: true,
});

const mockPatients: PatientBasic[] = [
  {
    id: "1",
    name: "John Smith",
    phone: "(555) 123-4567",
    priority: "1",
    status: "T",
  },
  {
    id: "2",
    name: "Emily Williams",
    phone: "(555) 987-6543",
    priority: "2",
    status: "D",
  },
  {
    id: "3",
    name: "Michael Taylor",
    phone: "(555) 456-7890",
    priority: "3",
    status: "C",
  },
  {
    id: "4",
    name: "Sarah Stevens",
    phone: "(555) 111-2222",
    priority: "1",
    status: "T",
  },
];

const createMockUsePatients = (
  overrides = {},
): UseQueryResult<PatientBasic[], Error> =>
  ({
    data: mockPatients,
    isLoading: false,
    error: null,
    refetch: jest.fn().mockResolvedValue({ data: mockPatients }),
    isError: false,
    isPending: false,
    isLoadingError: false,
    isRefetchError: false,
    isSuccess: true,
    isStale: false,
    isFetching: false,
    isFetchedAfterMount: true,
    isFetched: true,
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetching: false,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    status: "success" as const,
    fetchStatus: "idle" as const,
    remove: jest.fn(),
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    isPaused: false,
    isEnabled: true,
    isInitialLoading: false,
    ...overrides,
  }) as unknown as UseQueryResult<PatientBasic[], Error>;

const mockPriorities = [
  { value: "1", label: "Priority", isActive: true },
  { value: "2", label: "Standard", isActive: true },
  { value: "3", label: "Priority 3", isActive: true },
];

describe("usePatientList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePatients.mockReturnValue(createMockUsePatients());
    mockUsePriorities.mockReturnValue({
      data: mockPriorities,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof usePriorities>);
  });

  describe("initialization", () => {
    test("should initialize with default values", () => {
      const { result } = renderHook(() => usePatientList());

      expect(result.current.search).toBe("");
      expect(result.current.sortBy).toBe(null);
      expect(result.current.sortAsc).toBe(true);
      expect(result.current.visibleCount).toBe(20);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.filtered).toEqual(mockPatients);
      expect(result.current.paginated).toEqual(mockPatients);
    });

    test("should handle loading state", () => {
      mockUsePatients.mockReturnValue(
        createMockUsePatients({
          isLoading: true,
          data: [],
        }),
      );

      const { result } = renderHook(() => usePatientList());

      expect(result.current.loading).toBe(true);
      expect(result.current.filtered).toEqual([]);
      expect(result.current.paginated).toEqual([]);
    });

    test("should handle error state", () => {
      const errorMessage = "Failed to fetch patients";
      mockUsePatients.mockReturnValue(
        createMockUsePatients({
          error: new Error(errorMessage),
        }),
      );

      const { result } = renderHook(() => usePatientList());

      expect(result.current.error).toBe(errorMessage);
    });

    test("should handle null error", () => {
      mockUsePatients.mockReturnValue(
        createMockUsePatients({
          error: null,
        }),
      );

      const { result } = renderHook(() => usePatientList());

      expect(result.current.error).toBe(null);
    });
  });

  describe("search functionality", () => {
    test("should filter patients by search term", () => {
      const { result } = renderHook(() => usePatientList());

      act(() => {
        result.current.setSearch("John");
      });

      expect(result.current.search).toBe("John");
      expect(result.current.filtered).toEqual([
        {
          id: "1",
          name: "John Smith",
          phone: "(555) 123-4567",
          priority: "1",
          status: "T",
        },
      ]);
    });

    test("should be case insensitive", () => {
      const { result } = renderHook(() => usePatientList());

      act(() => {
        result.current.setSearch("emily");
      });

      expect(result.current.filtered).toEqual([
        {
          id: "2",
          name: "Emily Williams",
          phone: "(555) 987-6543",
          priority: "2",
          status: "D",
        },
      ]);
    });

    test("should filter by partial name match", () => {
      const { result } = renderHook(() => usePatientList());

      act(() => {
        result.current.setSearch("Sm");
      });

      expect(result.current.filtered).toEqual([
        {
          id: "1",
          name: "John Smith",
          phone: "(555) 123-4567",
          priority: "1",
          status: "T",
        },
      ]);
    });

    test("should return empty array when no matches", () => {
      const { result } = renderHook(() => usePatientList());

      act(() => {
        result.current.setSearch("xyz");
      });

      expect(result.current.filtered).toEqual([]);
    });

    test("should reset visibleCount when search changes", () => {
      const { result } = renderHook(() => usePatientList());

      // First set a different visibleCount
      act(() => {
        result.current.setVisibleCount(40);
      });

      expect(result.current.visibleCount).toBe(40);

      // Then change search - should reset visibleCount
      act(() => {
        result.current.setSearch("John");
      });

      expect(result.current.visibleCount).toBe(20);
    });
  });

  describe("sorting functionality", () => {
    test("should sort by name ascending", () => {
      const { result } = renderHook(() => usePatientList());

      act(() => {
        result.current.handleSort("name");
      });

      expect(result.current.sortBy).toBe("name");
      expect(result.current.sortAsc).toBe(true);
      expect(result.current.sorted[0].name).toBe("Emily Williams");
      expect(result.current.sorted[1].name).toBe("John Smith");
    });

    test("should toggle sort direction when clicking same column", () => {
      const { result } = renderHook(() => usePatientList());

      // First click - ascending
      act(() => {
        result.current.handleSort("name");
      });

      expect(result.current.sortAsc).toBe(true);

      // Second click - descending
      act(() => {
        result.current.handleSort("name");
      });

      expect(result.current.sortAsc).toBe(false);
      expect(result.current.sorted[0].name).toBe("Sarah Stevens");
    });

    test("should sort by priority (number)", () => {
      const { result } = renderHook(() => usePatientList());

      act(() => {
        result.current.handleSort("priority");
      });

      expect(result.current.sorted[0].priority).toBe("1"); // John Smith or Sarah Stevens
      expect(result.current.sorted[2].priority).toBe("2"); // Emily Williams
      expect(result.current.sorted[3].priority).toBe("3"); // Michael Taylor
    });

    test("should sort by status (string)", () => {
      const { result } = renderHook(() => usePatientList());

      act(() => {
        result.current.handleSort("status");
      });

      expect(result.current.sortBy).toBe("status");
      // Status C comes before D which comes before T alphabetically
      const statusOrder = result.current.sorted.map((p) => p.status);
      expect(statusOrder.indexOf("C")).toBeLessThan(statusOrder.indexOf("D"));
      expect(statusOrder.indexOf("D")).toBeLessThan(statusOrder.indexOf("T"));
    });

    test("should handle undefined values in sorting", () => {
      const patientsWithUndefined: PatientBasic[] = [
        {
          id: "1",
          name: "John Smith",
          phone: "(555) 123-4567",
          priority: "1",
          status: "T",
        },
        { id: "2", name: "", phone: "", priority: "2", status: "D" }, // Empty values
      ];

      mockUsePatients.mockReturnValue(
        createMockUsePatients({
          data: patientsWithUndefined,
        }),
      );

      const { result } = renderHook(() => usePatientList());

      act(() => {
        result.current.handleSort("name");
      });

      expect(result.current.sorted).toHaveLength(2);
    });

    test("should use natural sort for names with numbers (P1, P2, P3, P12, not P1, P12, P2, P3)", () => {
      const patientsWithNumberedNames: PatientBasic[] = [
        { id: "1", name: "P1", phone: "", priority: "1", status: "T" },
        { id: "2", name: "P2", phone: "", priority: "1", status: "T" },
        { id: "3", name: "P3", phone: "", priority: "1", status: "T" },
        { id: "4", name: "P12", phone: "", priority: "1", status: "T" },
        { id: "5", name: "P13", phone: "", priority: "1", status: "T" },
        { id: "6", name: "P14", phone: "", priority: "1", status: "T" },
        { id: "7", name: "P21", phone: "", priority: "1", status: "T" },
        { id: "8", name: "P22", phone: "", priority: "1", status: "T" },
      ];

      mockUsePatients.mockReturnValue(
        createMockUsePatients({
          data: patientsWithNumberedNames,
        }),
      );

      const { result } = renderHook(() => usePatientList());

      act(() => {
        result.current.handleSort("name");
      });

      const sortedNames = result.current.sorted.map((p) => p.name);
      expect(sortedNames).toEqual([
        "P1",
        "P2",
        "P3",
        "P12",
        "P13",
        "P14",
        "P21",
        "P22",
      ]);
    });
  });

  describe("pagination", () => {
    test("should limit initial results to visibleCount", () => {
      const { result } = renderHook(() => usePatientList());

      expect(result.current.paginated).toHaveLength(4); // All mock patients fit in 20
    });

    test("should paginate when visibleCount is less than total", () => {
      const { result } = renderHook(() => usePatientList());

      act(() => {
        result.current.setVisibleCount(2);
      });

      expect(result.current.paginated).toHaveLength(2);
      expect(result.current.paginated[0]).toEqual(mockPatients[0]);
      expect(result.current.paginated[1]).toEqual(mockPatients[1]);
    });

    test("should increase visibleCount correctly", () => {
      const { result } = renderHook(() => usePatientList());

      act(() => {
        result.current.setVisibleCount(2);
      });

      expect(result.current.visibleCount).toBe(2);

      act(() => {
        result.current.setVisibleCount((prev) => prev + 20);
      });

      expect(result.current.visibleCount).toBe(22);
    });
  });

  describe("scroll handling", () => {
    test("should set up scroll event listener", () => {
      renderHook(() => usePatientList());

      expect(window.addEventListener).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function),
      );
    });

    test("should clean up scroll event listener on unmount", () => {
      const { unmount } = renderHook(() => usePatientList());

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function),
      );
    });
  });

  describe("legend maps", () => {
    test("should provide correct status legend", () => {
      const { result } = renderHook(() => usePatientList());

      expect(result.current.statusLegend).toEqual({
        N: "New patient",
        T: "In Treatment",
        D: "Discharged",
        C: "Consecutive no-shows",
      });
    });

    test("should provide correct priority legend", () => {
      const { result } = renderHook(() => usePatientList());

      expect(result.current.priorityLegend).toEqual({
        "1": "Priority",
        "2": "Standard",
        "3": "Priority 3",
      });
    });
  });

  describe("refetch functionality", () => {
    test("should expose refreshPatients function", () => {
      const { result } = renderHook(() => usePatientList());

      expect(typeof result.current.refreshPatients).toBe("function");
    });

    test("should call refetch when refreshPatients is called", async () => {
      const mockRefetch = jest.fn().mockResolvedValue({ data: mockPatients });
      mockUsePatients.mockReturnValue(
        createMockUsePatients({
          refetch: mockRefetch,
        }),
      );

      const { result } = renderHook(() => usePatientList());

      await act(async () => {
        await result.current.refreshPatients();
      });

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("data flow integration", () => {
    test("should handle combined search and sort", () => {
      const { result } = renderHook(() => usePatientList());

      // Search for patients and then sort
      act(() => {
        result.current.setSearch("S"); // Should match Williams, Smith, and Stevens (3 patients)
      });

      // Williams, Smith, Stevens should match
      expect(result.current.filtered).toHaveLength(3);

      // Then sort by name ascending
      act(() => {
        result.current.handleSort("name");
      });

      // Should be sorted: Emily Williams, John Smith, Sarah Stevens
      expect(result.current.sorted[0].name).toBe("Emily Williams");
      expect(result.current.sorted[1].name).toBe("John Smith");
      expect(result.current.sorted[2].name).toBe("Sarah Stevens");
    });

    test("should handle search, sort, and pagination together", () => {
      const { result } = renderHook(() => usePatientList());

      // First set visible count to a small number
      act(() => {
        result.current.setVisibleCount(2);
      });

      expect(result.current.paginated).toHaveLength(2); // Should show only first 2 of all 4 patients

      // Then search and sort
      act(() => {
        result.current.setSearch("S"); // 3 matches: Williams, Smith, Stevens
        result.current.handleSort("name"); // Sort alphabetically
      });

      expect(result.current.filtered).toHaveLength(3);
      expect(result.current.sorted[0].name).toBe("Emily Williams");
      expect(result.current.sorted[1].name).toBe("John Smith");
      expect(result.current.sorted[2].name).toBe("Sarah Stevens");

      // After search, visibleCount resets to 20, so should show all 3 results
      expect(result.current.visibleCount).toBe(20);
      expect(result.current.paginated).toHaveLength(3); // All 3 search results
    });
  });

  describe("edge cases", () => {
    test("should handle empty patient list", () => {
      mockUsePatients.mockReturnValue(
        createMockUsePatients({
          data: [],
        }),
      );

      const { result } = renderHook(() => usePatientList());

      expect(result.current.filtered).toEqual([]);
      expect(result.current.sorted).toEqual([]);
      expect(result.current.paginated).toEqual([]);
    });

    test("should handle undefined data", () => {
      mockUsePatients.mockReturnValue(
        createMockUsePatients({
          data: undefined,
        }),
      );

      const { result } = renderHook(() => usePatientList());

      expect(result.current.filtered).toEqual([]);
    });
  });
});
