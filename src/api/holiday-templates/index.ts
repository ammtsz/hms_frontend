import type { ApiResponse } from '../types';
import {
  HolidayTemplate,
  CreateHolidayTemplateRequest,
  UpdateHolidayTemplateRequest,
  ApplyHolidayTemplateRequest,
  ApplyHolidayTemplateResult,
} from '@/types/holidayTemplate';
import api from '../lib/axios';
import { AxiosError } from 'axios';
import { getErrorMessage } from '../utils/functions';

const BASE_URL = '/holiday-templates';

export const getAllTemplates = async (): Promise<ApiResponse<HolidayTemplate[]>> => {
  try {
    const response = await api.get<HolidayTemplate[]>(BASE_URL);
    return { success: true, value: response.data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const getTemplateById = async (id: number): Promise<ApiResponse<HolidayTemplate>> => {
  try {
    const response = await api.get<HolidayTemplate>(`${BASE_URL}/${id}`);
    return { success: true, value: response.data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const createTemplate = async (
  data: CreateHolidayTemplateRequest
): Promise<ApiResponse<HolidayTemplate>> => {
  try {
    const response = await api.post<HolidayTemplate>(BASE_URL, data);
    return { success: true, value: response.data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const updateTemplate = async (
  id: number,
  data: UpdateHolidayTemplateRequest
): Promise<ApiResponse<HolidayTemplate>> => {
  try {
    const response = await api.patch<HolidayTemplate>(`${BASE_URL}/${id}`, data);
    return { success: true, value: response.data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const deleteTemplate = async (id: number): Promise<ApiResponse<void>> => {
  try {
    await api.delete(`${BASE_URL}/${id}`);
    return { success: true, value: undefined };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const applyTemplate = async (
  id: number,
  data: ApplyHolidayTemplateRequest
): Promise<ApiResponse<ApplyHolidayTemplateResult>> => {
  try {
    const response = await api.post<ApplyHolidayTemplateResult>(
      `${BASE_URL}/${id}/apply`,
      data
    );
    return { success: true, value: response.data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};
