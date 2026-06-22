import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { usePriorities } from "../usePriorityOptionsQueries";
import * as prioritiesApi from "@/api/settings/priorities";
import { SystemOptionType } from "@/types/systemOptions";

jest.mock("@/api/settings/priorities");

const mockPriorities = [
  {
    id: 1,
    type: SystemOptionType.PRIORITY,
    value: "1",
    label: "Priority",
    sortOrder: 1,
    isActive: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
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

describe("usePriorityOptionsQueries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches priorities successfully (includeInactive=true)", async () => {
    (prioritiesApi.getPriorities as jest.Mock).mockResolvedValue({
      success: true,
      value: mockPriorities,
    });

    const { result } = renderHook(() => usePriorities(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPriorities);
    expect(prioritiesApi.getPriorities).toHaveBeenCalledWith(true);
  });

  it("handles fetch error", async () => {
    (prioritiesApi.getPriorities as jest.Mock).mockResolvedValue({
      success: false,
      error: "Failed to load priorities",
    });

    const { result } = renderHook(() => usePriorities(false), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
