import api from '../lib/axios';
import type { AxiosError } from 'axios';

export interface AppointmentsThresholdResponse {
  missingAppointmentsThreshold: number;
}

export type ApiResponse<T> =
  | { success: true; value: T }
  | { success: false; error: string };

function getErrorMessage(status?: number): string {
  switch (status) {
    case 400:
      return 'Valor inválido (use entre 1 e 10)';
    case 403:
      return 'Apenas administradores podem alterar este valor';
    default:
      return 'Erro ao processar requisição';
  }
}

export async function getAppointmentsThreshold(): Promise<
  ApiResponse<AppointmentsThresholdResponse>
> {
  try {
    const { data } = await api.get<AppointmentsThresholdResponse>(
      '/settings/appointments-threshold',
    );
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).response?.status);
    return { success: false, error: message };
  }
}

export async function updateAppointmentsThreshold(
  missingAppointmentsThreshold: number,
): Promise<ApiResponse<AppointmentsThresholdResponse>> {
  try {
    const { data } = await api.patch<AppointmentsThresholdResponse>(
      '/settings/appointments-threshold',
      { missingAppointmentsThreshold },
    );
    return { success: true, value: data };
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const message =
      axiosError.response?.data?.message ||
      getErrorMessage(axiosError.response?.status);
    return { success: false, error: message };
  }
}
