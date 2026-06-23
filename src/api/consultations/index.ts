import { AxiosError } from 'axios';
import api from '@/api/lib/axios';
import { getErrorMessage } from '../utils/functions';
import type {
  CreateConsultationRequest,
  UpdateConsultationRequest,
  ConsultationResponseDto,
  UpdateConsultationResponseDto,
  ApiResponse,
  AppointmentResponseDto,
} from '../types';
import { transformConsultationResponse } from '@/utils/apiTransformers';

export const getConsultations = async (): Promise<
  ApiResponse<ConsultationResponseDto[]>
> => {
  try {
    const { data } = await api.get('/consultations');
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const getConsultationByAppointment = async (
  appointmentId: string,
): Promise<ApiResponse<ConsultationResponseDto>> => {
  try {
    const { data } = await api.get(`/consultations/appointment/${appointmentId}`);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const getLatestConsultationByPatient = async (
  patientId: string,
): Promise<ApiResponse<ConsultationResponseDto | null>> => {
  try {
    const { data } = await api.get(`/consultations/patient/${patientId}/latest`);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const createConsultation = async (
  payload: CreateConsultationRequest,
): Promise<ApiResponse<UpdateConsultationResponseDto>> => {
  try {
    const { data } = await api.post('/consultations', payload);
    return { success: true, value: transformConsultationResponse(data) };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 409) {
      const preservedError = new Error(
        error.response.data?.message || 'Conflict',
      ) as Error & { axiosError: AxiosError };
      preservedError.axiosError = error;
      throw preservedError;
    }
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const updateConsultation = async (
  id: string,
  payload: UpdateConsultationRequest,
): Promise<ApiResponse<UpdateConsultationResponseDto>> => {
  try {
    const { data } = await api.patch(`/consultations/${id}`, payload);
    return { success: true, value: transformConsultationResponse(data) };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const deleteConsultation = async (
  id: string,
): Promise<ApiResponse<void>> => {
  try {
    await api.delete(`/consultations/${id}`);
    return { success: true };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const checkAndScheduleReturnAfterSessions = async (
  consultationId: number,
): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<{ success: boolean; error?: string }>(
      `/treatments/check-and-schedule-return/${consultationId}`,
    );
    if (!response.data.success && response.data.error) {
      return { success: false, error: response.data.error };
    }
    return { success: true };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

/**
 * Schedule return appointment for a consultation.
 * @param consultationId - Consultation ID
 * @param mode - 'legacy' for immediate return, 'auto-return' for deferred return after sessions
 */
export const scheduleReturnAppointment = async (
  consultationId: number,
  mode: 'legacy' | 'auto-return',
): Promise<ApiResponse<AppointmentResponseDto>> => {
  try {
    const response = await api.post<{ appointment: AppointmentResponseDto }>(
      `/consultations/${consultationId}/schedule-return`,
      { mode },
    );
    return { success: true, value: response.data.appointment };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};
