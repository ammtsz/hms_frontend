import { renderHook, act } from "@testing-library/react";
import { useHolidayManagement } from "../hooks/useHolidayManagement";
import { useHolidays, useDeleteHoliday } from "@/api/query/hooks/useHolidayQueries";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

jest.mock("@/api/query/hooks/useHolidayQueries");

const mockHolidays = [
  {
    id: 1,
    holidayDate: "2026-12-25",
    name: "Christmas",
    description: "Federal Statutory Holiday",
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01",
  },
  {
    id: 2,
    holidayDate: "2026-01-01",
    name: "New Year",
    description: undefined,
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01",
  },
];

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
  Wrapper.displayName = "QueryClientWrapper";
  return Wrapper;
};

describe("useHolidayManagement", () => {
  const mockMutateDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useHolidays as jest.Mock).mockReturnValue({
      data: mockHolidays,
      isLoading: false,
      error: null,
    });

    (useDeleteHoliday as jest.Mock).mockReturnValue({
      mutate: mockMutateDelete,
      isPending: false,
    });
  });

  it("initializes with current year", () => {
    const { result } = renderHook(() => useHolidayManagement(), {
      wrapper: createWrapper(),
    });
    const currentYear = new Date().getFullYear();

    expect(result.current.selectedYear).toBe(currentYear);
  });

  it("generates 5 years starting from current year", () => {
    const { result } = renderHook(() => useHolidayManagement(), {
      wrapper: createWrapper(),
    });
    const currentYear = new Date().getFullYear();

    expect(result.current.years).toHaveLength(5);
    expect(result.current.years).toEqual([
      currentYear,
      currentYear + 1,
      currentYear + 2,
      currentYear + 3,
      currentYear + 4,
    ]);
  });

  it("allows changing selected year", () => {
    const { result } = renderHook(() => useHolidayManagement(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSelectedYear(2027);
    });

    expect(result.current.selectedYear).toBe(2027);
  });

  it("returns holidays from useHolidays", () => {
    const { result } = renderHook(() => useHolidayManagement(), {
      wrapper: createWrapper(),
    });

    expect(result.current.holidays).toEqual(mockHolidays);
  });

  it("returns loading state from useHolidays", () => {
    (useHolidays as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useHolidayManagement(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("returns error state from useHolidays", () => {
    const mockError = new Error("Test error");
    (useHolidays as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useHolidayManagement(), {
      wrapper: createWrapper(),
    });

    expect(result.current.error).toBe(mockError);
  });

  it("manages create modal state", () => {
    const { result } = renderHook(() => useHolidayManagement(), {
      wrapper: createWrapper(),
    });

    expect(result.current.showCreateModal).toBe(false);

    act(() => {
      result.current.setShowCreateModal(true);
    });

    expect(result.current.showCreateModal).toBe(true);

    act(() => {
      result.current.setShowCreateModal(false);
    });

    expect(result.current.showCreateModal).toBe(false);
  });

  it("manages editing holiday state", () => {
    const { result } = renderHook(() => useHolidayManagement(), {
      wrapper: createWrapper(),
    });
    const holiday = mockHolidays[0];

    expect(result.current.editingHoliday).toBeNull();

    act(() => {
      result.current.setEditingHoliday(holiday);
    });

    expect(result.current.editingHoliday).toEqual(holiday);

    act(() => {
      result.current.setEditingHoliday(null);
    });

    expect(result.current.editingHoliday).toBeNull();
  });

  it("handles delete click to set deleting holiday", () => {
    const { result } = renderHook(() => useHolidayManagement(), {
      wrapper: createWrapper(),
    });
    const holiday = mockHolidays[0];

    act(() => {
      result.current.handleDelete(holiday);
    });

    expect(result.current.deletingHoliday).toEqual(holiday);
  });

  it("handles edit click to set editing holiday", () => {
    const { result } = renderHook(() => useHolidayManagement(), {
      wrapper: createWrapper(),
    });
    const holiday = mockHolidays[0];

    act(() => {
      result.current.handleEdit(holiday);
    });

    expect(result.current.editingHoliday).toEqual(holiday);
  });

  it("calls delete mutation when confirming delete", () => {
    const { result } = renderHook(() => useHolidayManagement(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleDelete(mockHolidays[0]);
    });

    act(() => {
      result.current.confirmDelete();
    });

    expect(mockMutateDelete).toHaveBeenCalledWith(1, expect.any(Object));
  });

  it("clears deleting holiday on successful delete", () => {
    const { result } = renderHook(() => useHolidayManagement(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleDelete(mockHolidays[0]);
    });

    act(() => {
      result.current.confirmDelete();
    });

    const onSuccessCallback = mockMutateDelete.mock.calls[0][1].onSuccess;

    act(() => {
      onSuccessCallback();
    });

    expect(result.current.deletingHoliday).toBeNull();
  });

  it("does not call delete when no holiday is being deleted", () => {
    const { result } = renderHook(() => useHolidayManagement(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.confirmDelete();
    });

    expect(mockMutateDelete).not.toHaveBeenCalled();
  });

  it("returns deleting state from useDeleteHoliday", () => {
    (useDeleteHoliday as jest.Mock).mockReturnValue({
      mutate: mockMutateDelete,
      isPending: true,
    });

    const { result } = renderHook(() => useHolidayManagement(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isDeleting).toBe(true);
  });

  it("memoizes callbacks to prevent unnecessary rerenders", () => {
    const { result, rerender } = renderHook(() => useHolidayManagement(), {
      wrapper: createWrapper(),
    });

    const firstHandleDelete = result.current.handleDelete;
    const firstHandleEdit = result.current.handleEdit;
    const firstConfirmDelete = result.current.confirmDelete;

    rerender();

    expect(result.current.handleDelete).toBe(firstHandleDelete);
    expect(result.current.handleEdit).toBe(firstHandleEdit);
    expect(result.current.confirmDelete).toBe(firstConfirmDelete);
  });
});
