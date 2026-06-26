// API Response types that match backend DTOs

// Enums matching backend
export enum PatientPriority {
  LEVEL_1 = "1",
  LEVEL_2 = "2",
  LEVEL_3 = "3",
  LEVEL_4 = "4",
  LEVEL_5 = "5",
}

/** Lifecycle status on patient and consultation snapshot (N/T/D/C). */
export enum PatientStatus {
  NEW_PATIENT = "N",
  IN_TREATMENT = "T",
  DISCHARGED = "D",
  CONSECUTIVE_NO_SHOWS = "C",
}

export enum AppointmentType {
  ASSESSMENT = "assessment",
  PHYSIOTHERAPY = "physiotherapy",
  TENS = "tens",
}

export enum AppointmentStatus {
  SCHEDULED = "scheduled",
  CHECKED_IN = "checked_in",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  MISSED = "missed",
}

// API Response DTOs matching backend (note: responses are automatically converted to camelCase by axios interceptor)
export interface PatientResponseDto {
  id: number;
  name: string;
  phone?: string;
  priority: PatientPriority;
  patientStatus: PatientStatus;
  birthDate?: string; // ISO date string
  mainConcern?: string;
  dischargeDate?: string; // ISO date string
  startDate: string; // ISO date string
  missingAppointmentsStreak: number;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

export interface AppointmentResponseDto {
  id: number;
  patientId: number;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  checkedInTime?: string; // HH:mm:ss
  startedTime?: string; // HH:mm:ss
  completedTime?: string; // HH:mm:ss
  cancelledDate?: string; // YYYY-MM-DD (only cancellation might happen on different date)
  absenceJustified?: boolean;
  absenceNotes?: string; // Notes explaining reason for absence
  notes?: string;
  parentAppointmentId?: number; // Links follow-ups and generated treatments to original consultation
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
  patient?: PatientResponseDto; // Optional patient data
}

// Optimized DTOs for specific use cases
export interface AppointmentScheduleDto {
  id: number;
  patientId: number;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledDate: string; // YYYY-MM-DD
  notes?: string;
  patientName: string;
  patientPriority: string;
}

export interface NextAppointmentDateDto {
  nextDate: string; // YYYY-MM-DD
}

export interface ConsultationResponseDto {
  id: number;
  appointmentId: number;
  mainConcern?: string;
  patientStatus?: string; // N, T, D, or C
  homeExercises?: string;
  painManagement?: string;
  medications?: string;
  physiotherapy?: boolean;
  tens?: boolean;
  returnWeeks?: number;
  returnWhenTreatmentComplete?: boolean; // Whether to schedule return after treatment completion
  notes?: string;
  startTime?: string; // HH:mm:ss - when consultation started
  endTime?: string; // HH:mm:ss - when consultation completed
  createdDate: string; // YYYY-MM-DD - date from backend
  createdTime: string; // HH:mm:ss - time from backend
  updatedDate: string; // YYYY-MM-DD - date from backend
  updatedTime: string; // HH:mm:ss - time from backend
}

/** Item returned when appointments were cancelled (e.g. status D or C) */
export interface CancelledAppointmentItemDto {
  id: number;
  type: string;
  scheduledDate: string;
}

export interface TreatmentResultDto {
  success: boolean;
  errors: string[];
}

export interface TreatmentsResultDto {
  physiotherapyResult?: TreatmentResultDto;
  tensResult?: TreatmentResultDto;
}

export interface UpdateConsultationResponseDto {
  consultation: ConsultationResponseDto;
  treatments?: TreatmentsResultDto;
  /** Present when treatment status was set to Discharged (D) or Consecutive no-shows (C) */
  cancelledAppointments?: CancelledAppointmentItemDto[];
}

export interface ScheduleSettingResponseDto {
  id: number;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  maxConcurrentAssessment: number;
  maxConcurrentPhysiotherapyTens: number;
  isActive: boolean;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

// API Request types (note: requests are automatically converted to snake_case by axios interceptor, so use camelCase here)
export interface CreatePatientRequest {
  name: string;
  phone?: string;
  priority?: PatientPriority;
  patientStatus?: PatientStatus;
  birthDate?: string; // ISO date string
  mainConcern?: string;
  timezone?: string;
}

export interface UpdatePatientRequest {
  name?: string;
  phone?: string;
  priority?: PatientPriority;
  patientStatus?: PatientStatus;
  birthDate?: string; // ISO date string
  timezone?: string;
  mainConcern?: string;
  dischargeDate?: string; // ISO date string
  cancellationReason?: string;
}

export interface CreateAppointmentRequest {
  patientId: number;
  type: AppointmentType;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  notes?: string;
  parentAppointmentId?: number; // Link to original consultation
  status?: AppointmentStatus; // Optional initial status (defaults to scheduled)
}

export interface UpdateAppointmentRequest {
  type?: AppointmentType;
  status?: AppointmentStatus;
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  checkedInDate?: string; // YYYY-MM-DD
  checkedInTime?: string; // HH:mm:ss
  startedDate?: string; // YYYY-MM-DD
  startedTime?: string; // HH:mm:ss
  completedDate?: string; // YYYY-MM-DD
  completedTime?: string; // HH:mm:ss
  cancelledDate?: string; // YYYY-MM-DD
  cancelledTime?: string; // HH:mm:ss
  absenceJustified?: boolean;
  absenceNotes?: string; // Notes explaining reason for absence
  notes?: string;
  parentAppointmentId?: number; // Link to original consultation
}

export interface CreateConsultationRequest {
  appointmentId: number;
  mainConcern?: string;
  patientStatus?: string; // N, T, D, or C - Stored on consultation and used for patient update
  homeExercises?: string;
  painManagement?: string;
  medications?: string;
  physiotherapy?: boolean;
  tens?: boolean;
  returnWeeks?: number; // 1-52 weeks
  returnWhenTreatmentComplete?: boolean; // When true, return is scheduled after last treatment row completes
  notes?: string;
  startTime?: string; // HH:mm:ss - when consultation started
  endTime?: string; // HH:mm:ss - when consultation completed
}

export interface UpdateConsultationRequest {
  appointmentId?: number;
  mainConcern?: string;
  patientStatus?: string; // N, T, D, or C - Stored on consultation and used for patient update
  homeExercises?: string;
  painManagement?: string;
  medications?: string;
  physiotherapy?: boolean;
  tens?: boolean;
  returnWeeks?: number; // 1-52 weeks
  returnWhenTreatmentComplete?: boolean; // When true, return is scheduled after last treatment row completes
  notes?: string;
  startTime?: string; // HH:mm:ss
  endTime?: string; // HH:mm:ss
}

export interface CreateScheduleSettingRequest {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  maxConcurrentAssessment?: number;
  maxConcurrentPhysiotherapyTens?: number;
  isActive?: boolean;
}

export interface UpdateScheduleSettingRequest {
  dayOfWeek?: number; // 0 = Sunday, 6 = Saturday
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  maxConcurrentAssessment?: number;
  maxConcurrentPhysiotherapyTens?: number;
  isActive?: boolean;
}

// Common API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  value?: T;
  error?: string;
}

/** Workflow status for a treatment plan row (`hms_treatment`). */
export type TreatmentPlanStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

/** One treatment plan row (`hms_treatment`) from the API. */
export interface TreatmentResponseDto {
  id: number;
  consultationId: number;
  appointmentId: number;
  patientId: number;
  treatmentType: "physiotherapy" | "tens";
  bodyLocation: string;
  startDate: string; // ISO date string
  plannedSessions: number;
  completedSessions: number;
  endDate?: string; // ISO date string
  status: string;
  durationMinutes?: number;
  notes?: string;
  cancellationReason?: string;
  sessions?: SessionResponseDto[];
  createdDate: string; // YYYY-MM-DD
  createdTime: string; // HH:mm:ss
  updatedDate: string;
  updatedTime: string;
}

export interface CreateTreatmentRequest {
  consultationId: number;
  appointmentId: number;
  patientId: number;
  treatmentType: "physiotherapy" | "tens";
  bodyLocation: string;
  startDate: string; // ISO date string
  plannedSessions: number;
  endDate?: string; // ISO date string
  durationMinutes?: number;
  notes?: string;
  /**
   * When true, the first `hms_session` row reuses an existing appointment instead of
   * creating a new scheduled appointment for the start date. Set when
   * adding a new body location from the EditTreatmentModal (the treatment
   * is happening at the current appointment, not a future one).
   */
  reuseAppointmentForFirstSession?: boolean;
  /**
   * The appointment ID to use for the first session row when
   * `reuseAppointmentForFirstSession` is true. This must be the visit appointment
   * (session row appointmentId), NOT the prescription appointment on the treatment.
   * Falls back to `appointmentId` if omitted.
   */
  firstSessionAppointmentId?: number;
}

export interface UpdateTreatmentRequest {
  completedSessions?: number;
  endDate?: string; // ISO date string
  notes?: string;
  /** Edit config: only allowed when treatment has no completed session rows */
  bodyLocation?: string;
  durationMinutes?: number;
}

export interface BulkCreateTreatmentsRequest {
  treatments: CreateTreatmentRequest[];
  consultationId: number;
  autoScheduleReturn?: boolean;
  physiotherapyNotes?: string;
  tensNotes?: string;
}

export interface BulkCreateTreatmentsResponse {
  createdTreatments: TreatmentResponseDto[];
  failedTreatments: Array<{
    treatment: CreateTreatmentRequest;
    error: string;
  }>;
  returnScheduled: boolean;
  returnSchedulingError?: string;
}

/** Row status for one scheduled occurrence (`hms_session`). */
export type SessionAppointmentStatus =
  | "scheduled"
  | "completed"
  | "missed"
  | "cancelled";

/** One session row (`hms_session`), optionally hydrated with parent treatment fields. */
export interface SessionResponseDto {
  id: number;
  treatmentId: number;
  appointmentId?: number;
  sessionNumber: number;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  status: SessionAppointmentStatus;
  notes?: string;
  missedReason?: string;
  performedBy?: string;
  createdDate: string;
  createdTime: string;
  updatedDate: string;
  updatedTime: string;
  treatmentType?: "physiotherapy" | "tens";
  bodyLocation?: string;
  plannedSessions?: number;
  completedSessions?: number;
  durationMinutes?: number;
  treatmentNotes?: string;
  cancellationReason?: string;
  /** Status of the parent treatment plan (`hms_treatment.status`). */
  treatmentStatus?: TreatmentPlanStatus;
}

export interface CreateSessionRequest {
  treatmentId: number;
  appointmentId?: number;
  sessionNumber: number;
  scheduledDate: string; // ISO date string
  scheduledTime: string; // HH:mm
  notes?: string;
}

export interface UpdateSessionRequest {
  scheduledDate?: string; // ISO date string
  scheduledTime?: string; // HH:mm
  notes?: string;
}

export interface CompleteSessionRequest {
  notes?: string;
  appointmentId?: number;
}

export interface CompleteTreatmentRequest {
  completionNotes?: string;
}

export interface SuspendTreatmentRequest {
  suspensionReason?: string;
}

// Patient Notes types

export type NoteCategory = string;

export interface PatientNoteResponseDto {
  id: number;
  patientId: number;
  noteContent: string;
  category: string;
  createdDate: string; // YYYY-MM-DD
  createdTime: string; // HH:mm:ss
  updatedDate: string; // YYYY-MM-DD
  updatedTime: string; // HH:mm:ss
}

export interface CreatePatientNoteRequest {
  noteContent: string;
  category?: NoteCategory;
}

export interface UpdatePatientNoteRequest {
  noteContent?: string;
  category?: NoteCategory;
}
