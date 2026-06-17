import { AxiosError } from 'axios';
import api from '@/api/lib/axios';
import { getErrorMessage } from '../utils/functions';
import type {
  CreateSessionRequest,
  UpdateSessionRequest,
  CompleteSessionRequest,
  SessionResponseDto,
  ApiResponse
} from '../types';

export const getSessionById = async (id: string): Promise<ApiResponse<SessionResponseDto>> => {
  try {
    const { data } = await api.get(`/sessions/${id}`);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const getSessionsByTreatment = async (treatmentId: string): Promise<ApiResponse<SessionResponseDto[]>> => {
  try {
    const { data } = await api.get(`/sessions/treatment/${treatmentId}`);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const getSessionsByPatient = async (patientId: string): Promise<ApiResponse<SessionResponseDto[]>> => {
  try {
    const { data } = await api.get(`/sessions/patient/${patientId}`);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const getSessionsByAttendance = async (attendanceId: number): Promise<ApiResponse<SessionResponseDto[]>> => {
  try {
    const { data } = await api.get(`/sessions/attendance/${attendanceId}`);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const createSession = async (payload: CreateSessionRequest): Promise<ApiResponse<SessionResponseDto>> => {
  try {
    const { data } = await api.post('/sessions', payload);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const updateSession = async (id: string, payload: UpdateSessionRequest): Promise<ApiResponse<SessionResponseDto>> => {
  try {
    const { data } = await api.put(`/sessions/${id}`, payload);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const completeSession = async (id: string, completionData: CompleteSessionRequest): Promise<ApiResponse<SessionResponseDto>> => {
  try {
    const { data } = await api.post(`/sessions/${id}/complete`, completionData);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const deleteSession = async (id: string): Promise<ApiResponse<void>> => {
  try {
    await api.delete(`/sessions/${id}`);
    return { success: true };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};
