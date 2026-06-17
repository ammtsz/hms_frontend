import api from "@/api/lib/axios";
import type {
  ApiResponse,
  SimilarOption,
  SystemOption,
  UpdateSystemOptionRequest,
} from "@/types/systemOptions";

import {
  includeInactiveParams,
  getResponseMessageOrStatusErrorMessage,
  getStatusErrorMessageFromAxios,
  SYSTEM_OPTION_STATUS_MESSAGES,
} from "../utils";

export async function getBodyLocations(
  includeInactive = false,
): Promise<ApiResponse<SystemOption[]>> {
  try {
    const { data } = await api.get<SystemOption[]>("/settings/body-locations", {
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

export async function checkSimilarBodyLocations(
  value: string,
): Promise<ApiResponse<SimilarOption[]>> {
  try {
    const { data } = await api.get<SimilarOption[]>(
      "/settings/body-locations/check-similar",
      { params: { value } },
    );
    return { success: true, value: data };
  } catch (error) {
    const message = getStatusErrorMessageFromAxios(
      error,
      SYSTEM_OPTION_STATUS_MESSAGES,
    );
    return { success: false, error: message };
  }
}

export async function createBodyLocation(
  value: string,
): Promise<ApiResponse<SystemOption>> {
  try {
    const { data } = await api.post<SystemOption>("/settings/body-locations", {
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

export async function updateBodyLocation(
  id: number,
  updates: UpdateSystemOptionRequest,
): Promise<ApiResponse<SystemOption>> {
  try {
    const { data } = await api.put<SystemOption>(
      `/settings/body-locations/${id}`,
      updates,
    );
    return { success: true, value: data };
  } catch (error) {
    const message = getResponseMessageOrStatusErrorMessage(
      error,
      SYSTEM_OPTION_STATUS_MESSAGES,
    );
    return { success: false, error: message };
  }
}

export async function deleteBodyLocation(
  id: number,
): Promise<ApiResponse<void>> {
  try {
    await api.delete(`/settings/body-locations/${id}`);
    return { success: true };
  } catch (error) {
    const message = getResponseMessageOrStatusErrorMessage(
      error,
      SYSTEM_OPTION_STATUS_MESSAGES,
    );
    return { success: false, error: message };
  }
}

