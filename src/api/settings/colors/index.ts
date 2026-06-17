import api from "@/api/lib/axios";
import type {
  ApiResponse,
  SimilarOption,
  SystemOption,
  UpdateSystemOptionRequest,
} from "@/types/systemOptions";

import {
  getResponseMessageOrStatusErrorMessage,
  getStatusErrorMessageFromAxios,
  includeInactiveParams,
  SYSTEM_OPTION_STATUS_MESSAGES,
} from "../utils";

export async function getColors(
  includeInactive = false,
): Promise<ApiResponse<SystemOption[]>> {
  try {
    const { data } = await api.get<SystemOption[]>("/settings/colors", {
      params: includeInactiveParams(includeInactive),
    });
    return { success: true, value: data };
  } catch (error) {
    const message = getStatusErrorMessageFromAxios(
      error,
      SYSTEM_OPTION_STATUS_MESSAGES,
    );
    return { success: false, error: message };
  }
}

export async function checkSimilarColors(
  value: string,
): Promise<ApiResponse<SimilarOption[]>> {
  try {
    const { data } = await api.get<SimilarOption[]>("/settings/colors/check-similar", {
      params: { value },
    });
    return { success: true, value: data };
  } catch (error) {
    const message = getStatusErrorMessageFromAxios(
      error,
      SYSTEM_OPTION_STATUS_MESSAGES,
    );
    return { success: false, error: message };
  }
}

export async function createColor(
  value: string,
): Promise<ApiResponse<SystemOption>> {
  try {
    const { data } = await api.post<SystemOption>("/settings/colors", {
      value,
    });
    return { success: true, value: data };
  } catch (error) {
    const message = getResponseMessageOrStatusErrorMessage(
      error,
      SYSTEM_OPTION_STATUS_MESSAGES,
    );
    return { success: false, error: message };
  }
}

export async function updateColor(
  id: number,
  updates: UpdateSystemOptionRequest,
): Promise<ApiResponse<SystemOption>> {
  try {
    const { data } = await api.put<SystemOption>(`/settings/colors/${id}`, updates);
    return { success: true, value: data };
  } catch (error) {
    const message = getResponseMessageOrStatusErrorMessage(
      error,
      SYSTEM_OPTION_STATUS_MESSAGES,
    );
    return { success: false, error: message };
  }
}

export async function deleteColor(
  id: number,
): Promise<ApiResponse<void>> {
  try {
    await api.delete(`/settings/colors/${id}`);
    return { success: true };
  } catch (error) {
    const message = getResponseMessageOrStatusErrorMessage(
      error,
      SYSTEM_OPTION_STATUS_MESSAGES,
    );
    return { success: false, error: message };
  }
}

