import api from "@/api/lib/axios";
import type { ApiResponse, SystemOption } from "@/types/systemOptions";

import { getResponseMessageOrFallback, includeInactiveParams } from "../utils";

export async function getNoteCategories(
  includeInactive = false,
): Promise<ApiResponse<SystemOption[]>> {
  try {
    const { data } = await api.get<SystemOption[]>(
      "/settings/note-categories",
      { params: includeInactiveParams(includeInactive) },
    );
    return { success: true, value: data };
  } catch (error) {
    return {
      success: false,
      error: getResponseMessageOrFallback(
        error,
        "Failed to load note categories",
      ),
    };
  }
}

export async function createNoteCategory(params: {
  value: string;
  label: string;
  sortOrder?: number;
}): Promise<ApiResponse<SystemOption>> {
  try {
    const { data } = await api.post<SystemOption>(
      "/settings/note-categories",
      params,
    );
    return { success: true, value: data };
  } catch (error) {
    return {
      success: false,
      error: getResponseMessageOrFallback(
        error,
        "Failed to create note category",
      ),
    };
  }
}

export async function updateNoteCategory(
  id: number,
  updates: Partial<
    Pick<SystemOption, "value" | "label" | "isActive" | "sortOrder">
  >,
): Promise<ApiResponse<SystemOption>> {
  try {
    const { data } = await api.patch<SystemOption>(
      `/settings/note-categories/${id}`,
      updates,
    );
    return { success: true, value: data };
  } catch (error) {
    return {
      success: false,
      error: getResponseMessageOrFallback(
        error,
        "Failed to update note category",
      ),
    };
  }
}

export async function deleteNoteCategory(
  id: number,
): Promise<ApiResponse<void>> {
  try {
    await api.delete(`/settings/note-categories/${id}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getResponseMessageOrFallback(
        error,
        "Failed to delete note category",
      ),
    };
  }
}

