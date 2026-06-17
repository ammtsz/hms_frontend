import { AxiosError } from 'axios';
import api from '@/api/lib/axios';
import { getErrorMessage } from '../utils/functions';
import type { ApiResponse } from '../types';
import type {
  Holiday,
  HolidayConflict,
  CreateHolidayRequest,
  UpdateHolidayRequest,
  UpdateHolidayGroupRequest,
  BulkCreateHolidayResult,
  CreateHolidayPeriodRequest,
} from '@/types/holiday';

/**
 * Note: Automatic case transformation (camelCase ↔ snake_case) is handled by axios interceptors.
 * No manual transformKeys calls needed.
 */

export async function getAllHolidays(year?: number): Promise<ApiResponse<Holiday[]>> {
  try {
    const params = year ? { year } : {};
    const response = await api.get('/holidays', { params });
    return { success: true, value: response.data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).response?.status);
    return { success: false, error: message };
  }
}

export async function getUpcomingHolidays(limit: number = 5): Promise<ApiResponse<Holiday[]>> {
  try {
    const response = await api.get('/holidays/upcoming', {
      params: { limit },
    });
    return { success: true, value: response.data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).response?.status);
    return { success: false, error: message };
  }
}

export async function getHolidayById(id: number): Promise<ApiResponse<Holiday>> {
  try {
    const response = await api.get(`/holidays/${id}`);
    return { success: true, value: response.data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).response?.status);
    return { success: false, error: message };
  }
}

export async function checkIfHoliday(date: string): Promise<ApiResponse<boolean>> {
  try {
    const response = await api.get(`/holidays/check/${date}`);
    return { success: true, value: response.data.isHoliday };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).response?.status);
    return { success: false, error: message };
  }
}

export async function checkIfHolidayForTreatmentType(
  date: string, 
  treatmentType: string
): Promise<ApiResponse<boolean>> {
  try {
    const url = `/holidays/check/${date}`;
    const params = { treatmentType };
    
    const response = await api.get(url, { params });
    
    return { success: true, value: response.data.isHoliday };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).response?.status);
    return { success: false, error: message };
  }
}

export async function checkHolidayConflicts(
  date: string
): Promise<ApiResponse<HolidayConflict>> {
  try {
    const response = await api.get(`/holidays/conflicts/${date}`);
    return { success: true, value: response.data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).response?.status);
    return { success: false, error: message };
  }
}

export async function createHoliday(
  data: CreateHolidayRequest
): Promise<ApiResponse<Holiday>> {
  try {
    const response = await api.post('/holidays', data);
    return { success: true, value: response.data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).response?.status);
    return { success: false, error: message };
  }
}

export async function updateHoliday(
  id: number,
  data: UpdateHolidayRequest
): Promise<ApiResponse<Holiday>> {
  try {
    const response = await api.patch(`/holidays/${id}`, data);
    return { success: true, value: response.data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).response?.status);
    return { success: false, error: message };
  }
}

export async function updateHolidayGroup(
  groupId: string,
  data: UpdateHolidayGroupRequest
): Promise<ApiResponse<Holiday[]>> {
  try {
    const response = await api.patch(`/holidays/group/${groupId}`, data);
    return { success: true, value: response.data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).response?.status);
    return { success: false, error: message };
  }
}

export async function deleteHoliday(id: number): Promise<ApiResponse<void>> {
  try {
    await api.delete(`/holidays/${id}`);
    return { success: true };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).response?.status);
    return { success: false, error: message };
  }
}

export async function createHolidayPeriod(
  data: CreateHolidayPeriodRequest
): Promise<ApiResponse<BulkCreateHolidayResult>> {
  try {
    // Transform camelCase to snake_case for backend
    const transformedData = {
      start_date: data.startDate,
      end_date: data.endDate,
      name: data.name,
      description: data.description,
      blocked_treatment_types: data.blockedTreatmentTypes,
    };
    
    const response = await api.post('/holidays/period', transformedData);
    return { success: true, value: response.data };
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string | string[] }>;
    const backendMessage = axiosError.response?.data?.message;

    if (typeof backendMessage === 'string') {
      if (backendMessage.startsWith('ATTENDANCE_CONFLICT:')) {
        const count = Number(backendMessage.split(':')[1]);
        const countText = Number.isFinite(count) ? count : undefined;
        return {
          success: false,
          error: countText
            ? `Existem ${countText} atendimento(s) agendado(s) no período informado. Remova ou reagende antes de criar o feriado.`
            : 'Existe atendimento agendado no período informado. Remova ou reagende antes de criar o feriado.',
        };
      }

      if (backendMessage === 'DUPLICATE_HOLIDAY') {
        return {
          success: false,
          error: 'Já existe um feriado no período informado.',
        };
      }
    }

    const message = getErrorMessage(axiosError.response?.status);
    return { success: false, error: message };
  }
}
