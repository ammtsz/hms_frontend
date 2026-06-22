import { AxiosError } from 'axios';
import api from '@/api/lib/axios';
import { getErrorMessage, getApiErrorMessage } from '../utils/functions';
import type {
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientResponseDto,
  PatientNoteResponseDto,
  CreatePatientNoteRequest,
  UpdatePatientNoteRequest,
  ApiResponse
} from '../types';

export const getPatients = async (): Promise<ApiResponse<PatientResponseDto[]>> => {
  try {
    const { data } = await api.get('/patients');
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const getPatientById = async (id: string): Promise<ApiResponse<PatientResponseDto>> => {
  try {
    const { data } = await api.get(`/patients/${id}`);
    return { success: true, value: data };
  } catch (error) {
    const axiosError = error as AxiosError;
    let message = getErrorMessage(axiosError.status);
    
    // Provide more specific error for patient not found
    if (axiosError.status === 404) {
      message = 'Patient not found';
    }
    
    return { success: false, error: message };
  }
};

export const createPatient = async (patientData: CreatePatientRequest): Promise<ApiResponse<PatientResponseDto>> => {
  try {
    const { data } = await api.post('/patients', patientData);
    return { success: true, value: data };
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return { success: false, error: getApiErrorMessage(axiosError) };
  }
};

export const updatePatient = async (id: string, patientData: UpdatePatientRequest): Promise<ApiResponse<PatientResponseDto>> => {
  try {
    const { data } = await api.patch(`/patients/${id}`, patientData);
    return { success: true, value: data };
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return { success: false, error: getApiErrorMessage(axiosError) };
  }
};

export const deletePatient = async (id: string): Promise<ApiResponse<void>> => {
  try {
    await api.delete(`/patients/${id}`);
    return { success: true };
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return { success: false, error: getApiErrorMessage(axiosError) };
  }
};

// Patient Notes API functions
export const getPatientNotes = async (patientId: string): Promise<ApiResponse<PatientNoteResponseDto[]>> => {
  try {
    const { data } = await api.get(`/patients/${patientId}/notes`);
    return { success: true, value: data };
  } catch (error) {
    const axiosError = error as AxiosError;
    let message = getErrorMessage(axiosError.status);
    
    if (axiosError.status === 404) {
      message = 'Patient not found';
    }
    
    return { success: false, error: message };
  }
};

export const createPatientNote = async (
  patientId: string,
  noteData: CreatePatientNoteRequest
): Promise<ApiResponse<PatientNoteResponseDto>> => {
  try {
    const { data } = await api.post(`/patients/${patientId}/notes`, noteData);
    return { success: true, value: data };
  } catch (error) {
    const axiosError = error as AxiosError;
    let message = getErrorMessage(axiosError.status);
    
    if (axiosError.status === 404) {
      message = 'Patient not found';
    }
    
    return { success: false, error: message };
  }
};

export const updatePatientNote = async (
  patientId: string,
  noteId: string,
  noteData: UpdatePatientNoteRequest
): Promise<ApiResponse<PatientNoteResponseDto>> => {
  try {
    const { data } = await api.patch(`/patients/${patientId}/notes/${noteId}`, noteData);
    return { success: true, value: data };
  } catch (error) {
    const axiosError = error as AxiosError;
    let message = getErrorMessage(axiosError.status);
    
    if (axiosError.status === 404) {
      message = 'Note not found';
    }
    
    return { success: false, error: message };
  }
};

export const deletePatientNote = async (
  patientId: string,
  noteId: string
): Promise<ApiResponse<void>> => {
  try {
    await api.delete(`/patients/${patientId}/notes/${noteId}`);
    return { success: true };
  } catch (error) {
    const axiosError = error as AxiosError;
    let message = getErrorMessage(axiosError.status);
    
    if (axiosError.status === 404) {
      message = 'Note not found';
    }
    
    return { success: false, error: message };
  }
};