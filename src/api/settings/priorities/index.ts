import api from "@/api/lib/axios";
import type { AxiosError } from "axios";
import type {
  ApiResponse,
  SystemOption,
} from "@/types/systemOptions";
import type { Priority } from "@/types/types";

import {
  PRIORITY_STATUS_MESSAGES,
  getResponseMessageOrStatusErrorMessage,
  getStatusErrorMessageFromAxios,
  includeInactiveParams,
} from "../utils";

export interface BlockingPriorityPatient {
  id: number;
  name: string;
  priority: Priority;
}

export interface DeactivatePriorityResponse {
  success: boolean;
  value?: SystemOption;
  error?: string;
  blockingPatients?: BlockingPriorityPatient[];
}

const DEFAULT_PRIORITY_ERROR_MESSAGE = "Erro ao processar requisição";

export async function getPriorities(
  includeInactive = false,
): Promise<ApiResponse<SystemOption[]>> {
  try {
    const { data } = await api.get<SystemOption[]>("/settings/priorities", {
      params: includeInactiveParams(includeInactive),
    });
    return { success: true, value: data };
  } catch (error) {
    const message = getStatusErrorMessageFromAxios(
      error,
      PRIORITY_STATUS_MESSAGES,
      DEFAULT_PRIORITY_ERROR_MESSAGE,
    );
    return { success: false, error: message };
  }
}

export async function updatePriorityOption(
  id: number,
  updates: Partial<Pick<SystemOption, "label" | "isActive" | "sortOrder">>,
): Promise<ApiResponse<SystemOption>> {
  try {
    const { data } = await api.patch<SystemOption>(`/settings/priorities/${id}`, {
      ...updates,
    });
    return { success: true, value: data };
  } catch (error) {
    const message = getResponseMessageOrStatusErrorMessage(
      error,
      PRIORITY_STATUS_MESSAGES,
      DEFAULT_PRIORITY_ERROR_MESSAGE,
    );
    return { success: false, error: message };
  }
}

export async function deactivatePriorityOption(
  id: number,
): Promise<DeactivatePriorityResponse> {
  try {
    const { data } = await api.patch<SystemOption>(
      `/settings/priorities/${id}/deactivate`,
    );
    return { success: true, value: data };
  } catch (error) {
    const axiosError = error as AxiosError<{
      message?: string;
      blockingPatients?: BlockingPriorityPatient[];
      blocking_patients?: BlockingPriorityPatient[];
    }>;

    if (axiosError.response?.status === 409) {
      const blockingPatients =
        axiosError.response.data.blockingPatients ??
        axiosError.response.data.blocking_patients;

      return {
        success: false,
        error:
          axiosError.response.data.message ||
          PRIORITY_STATUS_MESSAGES[409] ||
          DEFAULT_PRIORITY_ERROR_MESSAGE,
        blockingPatients,
      };
    }

    const message = getResponseMessageOrStatusErrorMessage(
      error,
      PRIORITY_STATUS_MESSAGES,
      DEFAULT_PRIORITY_ERROR_MESSAGE,
    );

    return { success: false, error: message };
  }
}

export async function bulkUpdatePatientsPriority(params: {
  patientIds: number[];
  priority: Priority;
}): Promise<ApiResponse<{ updatedCount: number }>> {
  try {
    const { data } = await api.patch<{ updatedCount: number }>(
      "/settings/patients/bulk-priority",
      params,
    );
    return { success: true, value: data };
  } catch (error) {
    const message = getResponseMessageOrStatusErrorMessage(
      error,
      PRIORITY_STATUS_MESSAGES,
      DEFAULT_PRIORITY_ERROR_MESSAGE,
    );
    return { success: false, error: message };
  }
}

