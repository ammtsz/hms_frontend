import { AxiosError } from 'axios';
import api from '@/api/lib/axios';
import { getApiErrorMessage, getErrorMessage } from '../utils/functions';
import type {
  CreateAttendanceRequest,
  UpdateAttendanceRequest,
  AttendanceResponseDto,
  AttendanceScheduleDto,
  NextAttendanceDateDto,
  ApiResponse
} from '../types';
import { AttendanceStatus } from '../types';
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

export const getAttendances = async (): Promise<ApiResponse<AttendanceResponseDto[]>> => {
  try {
    const { data } = await api.get('/attendances');
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const getAttendanceById = async (id: string): Promise<ApiResponse<AttendanceResponseDto>> => {
  try {
    const { data } = await api.get(`/attendances/${id}`);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const getAttendancesByDate = async (date: string): Promise<ApiResponse<AttendanceResponseDto[]>> => {
  try {
    const { data } = await api.get(`/attendances/date/${date}`);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const getAttendancesByPatient = async (
  patientId: string,
  options?: { fromDate?: string; status?: string }
): Promise<ApiResponse<AttendanceResponseDto[]>> => {
  try {
    const params = new URLSearchParams({ patient_id: patientId });
    if (options?.fromDate) params.append('from_date', options.fromDate);
    if (options?.status) params.append('status', options.status);

    const { data } = await api.get(`/attendances?${params.toString()}`);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

/** Eligible parent (root) attendances for linking a new assessment consultation. Excludes finished treatments (D/C). */
export const getEligibleParentOptions = async (
  patientId: string
): Promise<ApiResponse<EligibleParentOptionsResponseDto>> => {
  try {
    const params = new URLSearchParams({ patient_id: patientId });
    const { data } = await api.get(
      `/attendances/eligible-parent-options?${params.toString()}`
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

export const createAttendance = async (attendanceData: CreateAttendanceRequest): Promise<ApiResponse<AttendanceResponseDto>> => {
  try {
    const { data } = await api.post('/attendances', attendanceData);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorFromAxios(error as AxiosError);
    return { success: false, error: message };
  }
};

export const updateAttendance = async (id: string, attendanceData: UpdateAttendanceRequest): Promise<ApiResponse<AttendanceResponseDto>> => {
  try {
    const { data } = await api.patch(`/attendances/${id}`, attendanceData);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const deleteAttendance = async (id: string, cancellationReason?: string): Promise<ApiResponse<void>> => {
  try {
    const body = cancellationReason ? { cancellationReason } : undefined;
    await api.delete(`/attendances/${id}`, { data: body });
    return { success: true };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

// Convenience methods for attendance status updates
export const checkInAttendance = async (id: string): Promise<ApiResponse<AttendanceResponseDto>> => {
  const now = new Date();
  const time = now.toTimeString().split(' ')[0]; // HH:MM:SS

  return updateAttendance(id, {
    status: AttendanceStatus.CHECKED_IN,
    checkedInTime: time
  });
};

export const startAttendance = async (id: string): Promise<ApiResponse<AttendanceResponseDto>> => {
  const now = new Date();
  const time = now.toTimeString().split(' ')[0]; // HH:MM:SS

  return updateAttendance(id, {
    status: AttendanceStatus.IN_PROGRESS,
    startedTime: time
  });
};

export const completeAttendance = async (id: string): Promise<ApiResponse<AttendanceResponseDto>> => {
  const now = new Date();
  const time = now.toTimeString().split(' ')[0]; // HH:MM:SS

  return updateAttendance(id, {
    status: AttendanceStatus.COMPLETED,
    completedTime: time
  });
};

export const cancelAttendance = async (id: string): Promise<ApiResponse<AttendanceResponseDto>> => {
  const date = getTodayClinic();

  return updateAttendance(id, {
    status: AttendanceStatus.CANCELLED,
    cancelledDate: date
  });
};

export const markAttendanceAsMissed = async (id: string, justified: boolean = false, notes: string = ""): Promise<ApiResponse<AttendanceResponseDto>> => {
  return updateAttendance(id, {
    status: AttendanceStatus.MISSED,
    absenceJustified: justified,
    absenceNotes: notes
  });
};

/**
 * Query key the schedule endpoint expects for status filters (one `status=` per value).
 * The TS filter field is {@link GetAttendancesForScheduleFilters.statuses}; the wire format
 * stays `status` to match the backend (`@Query('status')`).
 */
const SCHEDULE_STATUS_QUERY_KEY = 'status' as const;

export interface GetAttendancesForScheduleFilters {
  /**
   * Statuses to include. Each value is appended as the backend query key
   * `status` (repeated), not `statuses`. Omit or empty = all statuses.
   */
  statuses?: AttendanceStatus[];
  type?: string;
  limit?: number;
  fromDate?: string;
  toDate?: string;
}

// Optimized endpoints for specific use cases
export const getAttendancesForSchedule = async (
  filters?: GetAttendancesForScheduleFilters
): Promise<ApiResponse<AttendanceScheduleDto[]>> => {
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

    const url = `/attendances/schedule${params.toString() ? `?${params.toString()}` : ''}`;
    const { data } = await api.get(url);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const getNextAttendanceDate = async (): Promise<ApiResponse<NextAttendanceDateDto>> => {
  try {
    const { data } = await api.get('/attendances/next-date');
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

// Get attendance statistics for a specific date
export const getAttendanceStats = async (
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
    const url = date ? `/attendances/stats?date=${date}` : '/attendances/stats';
    const { data } = await api.get(url);
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

export const updateAbsenceJustifications = async (
  absenceJustifications: Array<{
    attendanceId: number;
    justified: boolean;
    justification?: string;
  }>
): Promise<ApiResponse<void>> => {
  try {
    await api.post('/attendances/absence-justifications', absenceJustifications);
    return { success: true };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

// Postpone an attendance to a specific date (or weeks from today)
export const postponeAttendance = async (
  id: string,
  newDate: string
): Promise<ApiResponse<AttendanceResponseDto>> => {
  try {
    const { data } = await api.patch(`/attendances/${id}/postpone`, { new_date: newDate });
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

// Bulk cancel multiple attendances
export const bulkCancelAttendances = async (
  attendanceIds: number[],
  cancellationReason?: string
): Promise<ApiResponse<{
  successCount: number;
  failureCount: number;
  successes: Array<{ attendanceId: number; message: string }>;
  failures: Array<{ attendanceId: number; error: string }>;
}>> => {
  try {
    const { data } = await api.post('/attendances/bulk/cancel', {
      attendance_ids: attendanceIds,
      cancellation_reason: cancellationReason,
    });
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

// Bulk postpone (reschedule) multiple attendances to a specific date
export const bulkPostponeAttendances = async (
  attendanceIds: number[],
  newDate: string,
  options?: { rescheduleReturnAssessment?: boolean },
): Promise<ApiResponse<{
  successCount: number;
  failureCount: number;
  successes: Array<{ attendanceId: number; message: string; newDate: string }>;
  failures: Array<{ attendanceId: number; error: string }>;
  autoRescheduledReturns?: Array<{
    attendanceId: number;
    patientId: number;
    patientName: string;
    oldDate: string;
    newDate: string;
  }>;
  failedReturnReschedules?: Array<{ attendanceId: number; error: string }>;
}>> => {
  try {
    const { data } = await api.post('/attendances/bulk/postpone', {
      attendance_ids: attendanceIds,
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

// Get next available reschedule date per attendance (same weekday), for preview
export const getNextRescheduleDates = async (
  attendanceIds: number[]
): Promise<ApiResponse<Record<number, string | null>>> => {
  try {
    const { data } = await api.post('/attendances/next-available-date', {
      attendance_ids: attendanceIds,
    });
    return { success: true, value: data.dates ?? {} };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

// Reschedule cancelled or missed attendances to a new date (creates new attendances; for treatments copies session records)
export const rescheduleAttendances = async (
  attendanceIds: number[],
  newScheduledDate: string
): Promise<ApiResponse<AttendanceResponseDto[]>> => {
  try {
    const { data } = await api.post('/attendances/reschedule', {
      attendanceIds,
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
  attendanceId?: number;
  patientId?: number;
  patientName?: string;
  oldDate?: string;
  newDate?: string;
}

// Recompute the return consultation date for the episode containing the given treatment attendance.
// Call once after all treatment postpones are committed (next-available mode) to anchor the return
// date to the actual max session date across all consultation treatments.
export const recomputeReturnForEpisode = async (
  attendanceId: number
): Promise<ApiResponse<RecomputeReturnResult>> => {
  try {
    const { data } = await api.post('/attendances/recompute-return-for-episode', {
      attendanceId,
    });
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};

// Get unresolved past attendances (dates before today with incomplete/in-progress statuses)
export const getUnresolvedPastAttendances = async (): Promise<ApiResponse<{
  hasUnresolved: boolean;
  dates: Array<{
    date: string;
    count: number;
    statuses: string[];
  }>;
}>> => {
  try {
    const { data } = await api.get('/attendances/unresolved-past');
    return { success: true, value: data };
  } catch (error) {
    const message = getErrorMessage((error as AxiosError).status);
    return { success: false, error: message };
  }
};
