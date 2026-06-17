import { AxiosError } from 'axios';
import api from '@/api/lib/axios';
import { getErrorMessage } from '../utils/functions';
import type {
  CreateScheduleSettingRequest,
  UpdateScheduleSettingRequest,
  ScheduleSettingResponseDto,
  ApiResponse
} from '../types';

export const getScheduleSettings = async (): Promise<ApiResponse<ScheduleSettingResponseDto[]>> => {
  try {
    const { data } = await api.get('/schedule-settings');
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const getScheduleSettingById = async (id: string): Promise<ApiResponse<ScheduleSettingResponseDto>> => {
  try {
    const { data } = await api.get(`/schedule-settings/${id}`);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

/**
 * Get schedule setting for a day of week (0 = Sunday, 6 = Saturday).
 * Returns success with value: null when no setting exists for that day (404).
 */
export const getScheduleSettingByDay = async (
  dayOfWeek: number,
): Promise<ApiResponse<ScheduleSettingResponseDto | null>> => {
  try {
    const { data } = await api.get(`/schedule-settings/day/${dayOfWeek}`);
    return { success: true, value: data };
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 404) {
      return { success: true, value: null };
    }
    const message = getErrorMessage(axiosError.response?.status);
    return { success: false, error: message };
  }
};

export const createScheduleSetting = async (scheduleData: CreateScheduleSettingRequest): Promise<ApiResponse<ScheduleSettingResponseDto>> => {
  try {
    const { data } = await api.post('/schedule-settings', scheduleData);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const updateScheduleSetting = async (id: string, scheduleData: UpdateScheduleSettingRequest): Promise<ApiResponse<ScheduleSettingResponseDto>> => {
  try {
    const { data } = await api.patch(`/schedule-settings/${id}`, scheduleData);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const deleteScheduleSetting = async (id: string): Promise<ApiResponse<void>> => {
  try {
    await api.delete(`/schedule-settings/${id}`);
    return { success: true };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

// Utility functions for working with schedule settings
export const getDayName = (dayOfWeek: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || 'Unknown';
};

export const getActiveScheduleSettings = async (): Promise<ApiResponse<ScheduleSettingResponseDto[]>> => {
  try {
    const { data } = await api.get('/schedule-settings');
    if (data && Array.isArray(data)) {
      const activeSettings = data.filter((setting: { isActive: boolean }) => setting.isActive);
      return { success: true, value: activeSettings };
    }
    return { success: true, value: [] };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};
