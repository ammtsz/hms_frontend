export interface Holiday {
  id: number;
  holidayDate: string; // YYYY-MM-DD
  name: string;
  description?: string;
  blockedTreatmentTypes?: string[] | null;
  holidayGroupId?: string | null; // UUID for grouping holidays into periods
  createdDate: string;
  updatedDate: string;
}

export interface HolidayConflict {
  hasConflict: boolean;
  attendanceCount: number;
  attendances?: Array<{
    id: number;
    patientName: string;
    treatmentType: string;
  }>;
}

export interface CreateHolidayRequest {
  holidayDate: string;
  name: string;
  description?: string;
  blockedTreatmentTypes?: string[] | null;
  holidayGroupId?: string | null;
}

export interface UpdateHolidayRequest {
  name?: string;
  description?: string;
  blockedTreatmentTypes?: string[] | null;
}

export interface UpdateHolidayGroupRequest {
  name?: string;
  description?: string;
  blockedTreatmentTypes?: string[] | null;
}

export interface BulkCreateHolidayResult {
  successCount: number;
  failureCount: number;
  errors: Array<{
    holiday: CreateHolidayRequest;
    error: string;
  }>;
}

export interface CreateHolidayPeriodRequest {
  startDate: string;
  endDate: string;
  name: string;
  description?: string;
  blockedTreatmentTypes?: string[] | null;
}
