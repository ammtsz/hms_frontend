import { renderHook, waitFor } from "@testing-library/react";
import { useSelectablePrioritiesForForm } from "../useSelectablePrioritiesForForm";
import * as priorityQueries from "@/api/query/hooks/usePriorityOptionsQueries";
import { SystemOptionType } from "@/types/systemOptions";

jest.mock("@/api/query/hooks/usePriorityOptionsQueries", () => ({
  usePriorities: jest.fn(),
}));

const mockUsePriorities = priorityQueries.usePriorities as jest.MockedFunction<
  typeof priorityQueries.usePriorities
>;

const opts = [
  {
    id: 1,
    type: SystemOptionType.PRIORITY,
    value: "1",
    label: "A",
    isActive: true,
    sortOrder: 1,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: 2,
    type: SystemOptionType.PRIORITY,
    value: "2",
    label: "B",
    isActive: true,
    sortOrder: 2,
    createdAt: "",
    updatedAt: "",
  },
];

describe("useSelectablePrioritiesForForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePriorities.mockReturnValue({
      data: opts,
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof mockUsePriorities>);
  });

  it("exposes sorted priorities from usePriorities data", () => {
    const { result } = renderHook(() =>
      useSelectablePrioritiesForForm({
        enabled: true,
        currentPriority: "1",
        onInvalidPriority: jest.fn(),
      }),
    );

    expect(result.current.sortedPriorities.map((p) => p.value)).toEqual([
      "1",
      "2",
    ]);
  });

  it("calls onInvalidPriority when current value is not in list", async () => {
    const onInvalidPriority = jest.fn();
    renderHook(() =>
      useSelectablePrioritiesForForm({
        enabled: true,
        currentPriority: "5",
        onInvalidPriority,
      }),
    );

    await waitFor(() => {
      expect(onInvalidPriority).toHaveBeenCalledWith("2");
    });
  });

  it("does not sync when enabled is false", () => {
    const onInvalidPriority = jest.fn();
    renderHook(() =>
      useSelectablePrioritiesForForm({
        enabled: false,
        currentPriority: "5",
        onInvalidPriority,
      }),
    );

    expect(onInvalidPriority).not.toHaveBeenCalled();
  });

  it("does not call onInvalidPriority while loading", () => {
    mockUsePriorities.mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof mockUsePriorities>);

    const onInvalidPriority = jest.fn();
    renderHook(() =>
      useSelectablePrioritiesForForm({
        enabled: true,
        currentPriority: "5",
        onInvalidPriority,
      }),
    );

    expect(onInvalidPriority).not.toHaveBeenCalled();
  });
});
