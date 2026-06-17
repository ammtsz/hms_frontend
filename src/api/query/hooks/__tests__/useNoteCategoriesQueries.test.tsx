import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useNoteCategories } from "../useNoteCategoriesQueries";
import * as noteCategoriesApi from "@/api/settings/note-categories";
import { SystemOptionType } from "@/types/systemOptions";

jest.mock("@/api/settings/note-categories");

const mockNoteCategories = [
  {
    id: 1,
    type: SystemOptionType.NOTE_CATEGORY,
    value: "general",
    label: "Geral",
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

describe("useNoteCategoriesQueries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches note categories successfully", async () => {
    (noteCategoriesApi.getNoteCategories as jest.Mock).mockResolvedValue({
      success: true,
      value: mockNoteCategories,
    });

    const { result } = renderHook(() => useNoteCategories(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockNoteCategories);
    expect(noteCategoriesApi.getNoteCategories).toHaveBeenCalledWith(true);
  });

  it("handles fetch error", async () => {
    (noteCategoriesApi.getNoteCategories as jest.Mock).mockResolvedValue({
      success: false,
      error: "Falha ao carregar categorias",
    });

    const { result } = renderHook(() => useNoteCategories(false), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
