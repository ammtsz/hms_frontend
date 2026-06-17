import { AxiosError } from 'axios';
import api from '@/api/lib/axios';
import { getApiErrorMessage, getErrorMessage } from '../utils/functions';
import { getTodayClinic } from '@/utils/timezoneDate';
import type {
  CreateTreatmentRequest,
  UpdateTreatmentRequest,
  CompleteTreatmentRequest,
  TreatmentResponseDto,
  BulkCreateTreatmentsRequest,
  BulkCreateTreatmentsResponse,
  ApiResponse
} from '../types';

export const getTreatmentById = async (id: string): Promise<ApiResponse<TreatmentResponseDto>> => {
  try {
    const { data } = await api.get(`/treatments/${id}`);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const getTreatmentsByPatient = async (patientId: string): Promise<ApiResponse<TreatmentResponseDto[]>> => {
  try {
    const { data } = await api.get(`/treatments/patient/${patientId}`);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const createTreatment = async (treatmentData: CreateTreatmentRequest): Promise<ApiResponse<TreatmentResponseDto>> => {
  try {
    const { data } = await api.post('/treatments', treatmentData);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const bulkCreateTreatments = async (
  bulkData: BulkCreateTreatmentsRequest
): Promise<ApiResponse<BulkCreateTreatmentsResponse>> => {
  try {
    const { data } = await api.post('/treatments/bulk', bulkData);
    return { success: true, value: data };
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string | string[] }>;
    return { success: false, error: getApiErrorMessage(axiosError) };
  }
};

export const updateTreatment = async (id: string, treatmentData: UpdateTreatmentRequest): Promise<ApiResponse<TreatmentResponseDto>> => {
  try {
    const { data } = await api.put(`/treatments/${id}`, treatmentData);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const completeTreatment = async (id: string, completionData: CompleteTreatmentRequest): Promise<ApiResponse<TreatmentResponseDto>> => {
  try {
    // Use the general update endpoint to mark as completed
    const updateData = {
      endDate: getTodayClinic(),
      notes: completionData.completionNotes || 'Treatment plan completed'
    };
    const { data } = await api.put(`/treatments/${id}`, updateData);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const cancelTreatment = async (id: string): Promise<ApiResponse<TreatmentResponseDto>> => {
  try {
    const { data } = await api.put(`/treatments/${id}/cancel`);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const bulkCancelTreatments = async (treatmentIds: number[], cancellationReason?: string): Promise<ApiResponse<{ cancelledCount: number; errors: string[] }>> => {
  try {
    const { data } = await api.post('/treatments/bulk-cancel', { treatmentIds, cancellationReason });
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const deleteTreatment = async (id: string): Promise<ApiResponse<void>> => {
  try {
    await api.delete(`/treatments/${id}`);
    return { success: true };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};
