import { AxiosError } from 'axios';
import api from '@/api/lib/axios';
import { getErrorMessage } from '../utils/functions';
import type { ApiResponse } from '../types';
import { transformProcessEndOfDayResponse } from '@/utils/apiTransformers';

interface DayFinalizationDto {
  finalizationDate: string;
  finalizedAt: string;
  finalizedBy?: string;
  notes?: string;
  createdDate: string;
  createdTime: string;
}

interface DayFinalizationStatusResponse {
  isFinalized: boolean;
  finalization?: DayFinalizationDto;
}

/**
 * Get finalization status for a specific date
 * @param date Date string in YYYY-MM-DD format
 */
export const getDayFinalizationStatus = async (
  date: string
): Promise<ApiResponse<DayFinalizationStatusResponse>> => {
  try {
    const { data } = await api.get<DayFinalizationStatusResponse>(
      `/day-finalization/${date}/status`
    );
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

/**
 * Process endOfDay: mark absences, reschedule or F+cancel, finalize
 * @param params Date and absence justifications
 */
export interface ProcessEndOfDayParams {
  date: string;
  absenceJustifications: Array<{
    attendanceId: number;
    justified: boolean;
    notes?: string;
  }>;
}

export interface ProcessEndOfDayResponse {
  rescheduled: Array<{
    attendanceId: number;
    patientId: number;
    patientName: string;
    type: string;
    oldDate: string;
    newDate: string;
  }>;
  statusChangedToF: Array<{
    patientId: number;
    patientName: string;
  }>;
  cancelledForF: Array<{
    patientId: number;
    patientName: string;
    attendances: Array<{
      id: number;
      type: string;
      scheduledDate: string;
    }>;
  }>;
  couldNotReschedule: Array<{
    attendanceId: number;
    patientId: number;
    patientName: string;
    type: string;
    reason: string;
  }>;
}

export const processEndOfDay = async (
  params: ProcessEndOfDayParams
): Promise<ApiResponse<ProcessEndOfDayResponse>> => {
  try {
    const { data } = await api.post<ProcessEndOfDayResponse>(
      '/day-finalization/process',
      params
    );
    return { success: true, value: transformProcessEndOfDayResponse(data) };
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 409) {
      return {
        success: false,
        error: 'Day already finalized',
      };
    }
    const message = getErrorMessage(axiosError.status);
    return { success: false, error: message };
  }
};
