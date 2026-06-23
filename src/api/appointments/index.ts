import { AxiosError } from 'axios';
import api from '@/api/lib/axios';
import { getApiErrorMessage, getErrorMessage } from '../utils/functions';
import type {
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  AppointmentResponseDto,
  AppointmentScheduleDto,
  NextAppointmentDateDto,
  ApiResponse
} from '../types';
import { AppointmentStatus } from '../types';
import { getTodayClinic } from '@/utils/timezoneDate';

export interface EligibleParentOptionDto {
  id: number;
  date: string;
  mainConcern: string;
  label: string;
}

export interface EligibleParentOptionsResponseDto {
  options: EligibleParentOptionDto[];
}

export const getAppointments = async (): Promise<ApiResponse<AppointmentResponseDto[]>> => {
  try {
    const { data } = await api.get('/appointments');
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const getAppointmentById = async (id: string): Promise<ApiResponse<AppointmentResponseDto>> => {
  try {
    const { data } = await api.get(`/appointments/${id}`);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const getAppointmentsByDate = async (date: string): Promise<ApiResponse<AppointmentResponseDto[]>> => {
  try {
    const { data } = await api.get(`/appointments/date/${date}`);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const getAppointmentsByPatient = async (
  patientId: string,
  options?: { fromDate?: string; status?: string }
): Promise<ApiResponse<AppointmentResponseDto[]>> => {
  try {
    const params = new URLSearchParams({ patient_id: patientId });
    if (options?.fromDate) params.append('from_date', options.fromDate);
    if (options?.status) params.append('status', options.status);

    const { data } = await api.get(`/appointments?${params.toString()}`);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

/** Eligible parent (root) appointments for linking a new assessment consultation. Excludes finished treatments (D/C). */
export const getEligibleParentOptions = async (
  patientId: string
): Promise<ApiResponse<EligibleParentOptionsResponseDto>> => {
  try {
    const params = new URLSearchParams({ patient_id: patientId });
    const { data } = await api.get(
      `/appointments/eligible-parent-options?${params.toString()}`
    );
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

function getErrorFromAxios(error: AxiosError): string {
  const status = error.response?.status;
  const data = error.response?.data as { message?: string | string[] } | undefined;
  const bodyMessage = data?.message;
  if (status === 400 && bodyMessage != null) {
    return Array.isArray(bodyMessage) ? bodyMessage.join(' ') : bodyMessage;
  }
  // Use backend message for 404 when present (e.g. invalid date / no schedule)
  if (status === 404 && bodyMessage != null) {
    return Array.isArray(bodyMessage) ? bodyMessage.join(' ') : bodyMessage;
  }
  return getErrorMessage(status);
}

export const createAppointment = async (appointmentData: CreateAppointmentRequest): Promise<ApiResponse<AppointmentResponseDto>> => {
  try {
    const { data } = await api.post('/appointments', appointmentData);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorFromAxios(error as AxiosError);
    return { success: false, error: message };
  }
};

export const updateAppointment = async (id: string, appointmentData: UpdateAppointmentRequest): Promise<ApiResponse<AppointmentResponseDto>> => {
  try {
    const { data } = await api.patch(`/appointments/${id}`, appointmentData);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const deleteAppointment = async (id: string, cancellationReason?: string): Promise<ApiResponse<void>> => {
  try {
    const body = cancellationReason ? { cancellationReason } : undefined;
    await api.delete(`/appointments/${id}`, { data: body });
    return { success: true };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

// Convenience methods for appointment status updates
export const checkInAppointment = async (id: string): Promise<ApiResponse<AppointmentResponseDto>> => {
  const now = new Date();
  const time = now.toTimeString().split(' ')[0]; // HH:MM:SS

  return updateAppointment(id, {
    status: AppointmentStatus.CHECKED_IN,
    checkedInTime: time
  });
};

export const startAppointment = async (id: string): Promise<ApiResponse<AppointmentResponseDto>> => {
  const now = new Date();
  const time = now.toTimeString().split(' ')[0]; // HH:MM:SS

  return updateAppointment(id, {
    status: AppointmentStatus.IN_PROGRESS,
    startedTime: time
  });
};

export const completeAppointment = async (id: string): Promise<ApiResponse<AppointmentResponseDto>> => {
  const now = new Date();
  const time = now.toTimeString().split(' ')[0]; // HH:MM:SS

  return updateAppointment(id, {
    status: AppointmentStatus.COMPLETED,
    completedTime: time
  });
};

export const cancelAppointment = async (id: string): Promise<ApiResponse<AppointmentResponseDto>> => {
  const date = getTodayClinic();

  return updateAppointment(id, {
    status: AppointmentStatus.CANCELLED,
    cancelledDate: date
  });
};

export const markAppointmentAsMissed = async (id: string, justified: boolean = false, notes: string = ""): Promise<ApiResponse<AppointmentResponseDto>> => {
  return updateAppointment(id, {
    status: AppointmentStatus.MISSED,
    absenceJustified: justified,
    absenceNotes: notes
  });
};

/**
 * Query key the schedule endpoint expects for status filters (one `status=` per value).
 * The TS filter field is {@link GetAppointmentsForScheduleFilters.statuses}; the wire format
 * stays `status` to match the backend (`@Query('status')`).
 */
const SCHEDULE_STATUS_QUERY_KEY = 'status' as const;

export interface GetAppointmentsForScheduleFilters {
  /**
   * Statuses to include. Each value is appended as the backend query key
   * `status` (repeated), not `statuses`. Omit or empty = all statuses.
   */
  statuses?: AppointmentStatus[];
  type?: string;
  limit?: number;
  fromDate?: string;
  toDate?: string;
}

// Optimized endpoints for specific use cases
export const getAppointmentsForSchedule = async (
  filters?: GetAppointmentsForScheduleFilters
): Promise<ApiResponse<AppointmentScheduleDto[]>> => {
  try {
    const params = new URLSearchParams();
    if (filters?.statuses?.length) {
      for (const s of filters.statuses) {
        params.append(SCHEDULE_STATUS_QUERY_KEY, s);
      }
    }
    if (filters?.type) params.append('type', filters.type);
    if (filters?.limit !== undefined) {
      params.append('limit', filters.limit.toString());
    }
    if (filters?.fromDate) {
      params.append('from_date', filters.fromDate);
    }
    if (filters?.toDate) {
      params.append('to_date', filters.toDate);
    }

    const url = `/appointments/schedule${params.toString() ? `?${params.toString()}` : ''}`;
    const { data } = await api.get(url);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const getNextAppointmentDate = async (): Promise<ApiResponse<NextAppointmentDateDto>> => {
  try {
    const { data } = await api.get('/appointments/next-date');
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

// Get appointment statistics for a specific date
export const getAppointmentStats = async (
  date?: string
): Promise<ApiResponse<{
  total: number;
  scheduled: number;
  checked_in: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  by_type: Record<string, number>;
}>> => {
  try {
    const url = date ? `/appointments/stats?date=${date}` : '/appointments/stats';
    const { data } = await api.get(url);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const updateAbsenceJustifications = async (
  absenceJustifications: Array<{
    appointmentId: number;
    justified: boolean;
    justification?: string;
  }>
): Promise<ApiResponse<void>> => {
  try {
    await api.post('/appointments/absence-justifications', absenceJustifications);
    return { success: true };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

// Postpone an appointment to a specific date (or weeks from today)
export const postponeAppointment = async (
  id: string,
  newDate: string
): Promise<ApiResponse<AppointmentResponseDto>> => {
  try {
    const { data } = await api.patch(`/appointments/${id}/postpone`, { new_date: newDate });
    return { success: true, value: data };
  } catch (error) {
    const axiosError = error as AxiosError;
    // Check if it's a conflict error (slot unavailable)
    if (axiosError.response?.status === 409 || axiosError.response?.status === 400) {
      return {
        success: false,
        error: 'Date not available, try to reschedule for another date'
      };
    }
    const message = getErrorMessage(axiosError.status);
    return { success: false, error: message };
  }
};

// Bulk cancel multiple appointments
export const bulkCancelAppointments = async (
  appointmentIds: number[],
  cancellationReason?: string
): Promise<ApiResponse<{
  successCount: number;
  failureCount: number;
  successes: Array<{ appointmentId: number; message: string }>;
  failures: Array<{ appointmentId: number; error: string }>;
}>> => {
  try {
    const { data } = await api.post('/appointments/bulk/cancel', {
      appointment_ids: appointmentIds,
      cancellation_reason: cancellationReason,
    });
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

// Bulk postpone (reschedule) multiple appointments to a specific date
export const bulkPostponeAppointments = async (
  appointmentIds: number[],
  newDate: string,
  options?: { rescheduleReturnAssessment?: boolean },
): Promise<ApiResponse<{
  successCount: number;
  failureCount: number;
  successes: Array<{ appointmentId: number; message: string; newDate: string }>;
  failures: Array<{ appointmentId: number; error: string }>;
  autoRescheduledReturns?: Array<{
    appointmentId: number;
    patientId: number;
    patientName: string;
    oldDate: string;
    newDate: string;
  }>;
  failedReturnReschedules?: Array<{ appointmentId: number; error: string }>;
}>> => {
  try {
    const { data } = await api.post('/appointments/bulk/postpone', {
      appointment_ids: appointmentIds,
      new_date: newDate,
      reschedule_return_assessment: options?.rescheduleReturnAssessment ?? false,
    });
    return { success: true, value: data };
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 409 || axiosError.response?.status === 400) {
      return {
        success: false,
        error: 'Date not available for some appointments, try to reschedule for another date',
      };
    }
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

// Get next available reschedule date per appointment (same weekday), for preview
export const getNextRescheduleDates = async (
  appointmentIds: number[]
): Promise<ApiResponse<Record<number, string | null>>> => {
  try {
    const { data } = await api.post('/appointments/next-available-date', {
      appointment_ids: appointmentIds,
    });
    return { success: true, value: data.dates ?? {} };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

// Reschedule cancelled or missed appointments to a new date (creates new appointments; for treatments copies session records)
export const rescheduleAppointments = async (
  appointmentIds: number[],
  newScheduledDate: string
): Promise<ApiResponse<AppointmentResponseDto[]>> => {
  try {
    const { data } = await api.post('/appointments/reschedule', {
      appointmentIds,
      newScheduledDate,
    });
    return { success: true, value: data };
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return { success: false, error: getApiErrorMessage(axiosError) };
  }
};

export interface RecomputeReturnResult {
  rescheduled: boolean;
  appointmentId?: number;
  patientId?: number;
  patientName?: string;
  oldDate?: string;
  newDate?: string;
}

// Recompute the return consultation date for the episode containing the given treatment appointment.
// Call once after all treatment postpones are committed (next-available mode) to anchor the return
// date to the actual max session date across all consultation treatments.
export const recomputeReturnForEpisode = async (
  appointmentId: number
): Promise<ApiResponse<RecomputeReturnResult>> => {
  try {
    const { data } = await api.post('/appointments/recompute-return-for-episode', {
      appointmentId,
    });
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

// Get unresolved past appointments (dates before today with incomplete/in-progress statuses)
export const getUnresolvedPastAppointments = async (): Promise<ApiResponse<{
  hasUnresolved: boolean;
  dates: Array<{
    date: string;
    count: number;
    statuses: string[];
  }>;
}>> => {
  try {
    const { data } = await api.get('/appointments/unresolved-past');
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};
