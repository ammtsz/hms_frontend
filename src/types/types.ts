/**
 * Modern TypeScript Type System
 * 
 * This file defines all type definitions for the application using modern TypeScript conventions.
 * Primary types use clean names without prefixes (Priority, Status, AttendanceType, etc.).
 * Legacy I-prefixed types are maintained as aliases for backward compatibility.
 * New API types are re-exported for seamless integration.
 */

// Re-export new API types
export {
  PatientPriority,
  PatientStatus,
  type PatientResponseDto,
  type AttendanceResponseDto,
  type AttendanceScheduleDto,
  type ConsultationResponseDto,
  type CreatePatientRequest,
  type UpdatePatientRequest,
  type CreateAttendanceRequest,
  type UpdateAttendanceRequest,
  type CreateConsultationRequest,
  type UpdateConsultationRequest,
  type ScheduleSettingResponseDto
} from '@/api/types';

// Primary types (modern naming without I-prefix)
export type Priority = "1" | "2" | "3" | "4" | "5";
export type Status = "N" | "T" | "D" | "C";
export type AttendanceType = "assessment" | "physiotherapy" | "tens" | "combined"; // combined for calendar view
export type AttendanceProgression = "scheduled" | "checkedIn" | "onGoing" | "completed";

// UI section types for the room layout  
export type UISection = "assessment" | "mixed"; // assessment room and mixed room (physiotherapy + tens)

export interface Recommendations {
  food: string;
  water: string;
  ointment: string;
  physiotherapy: boolean;
  tens: boolean;
  returnWeeks: number;
  notes?: string;
}

export interface AttendanceStatusDetail {
  name: string; 
  priority: Priority; 
  checkedInTime?: string | null; 
  onGoingTime?: string | null; 
  completedTime?: string | null;
  // Backend sync data
  attendanceId?: number;
  treatmentAttendanceIds?: number[];
  patientId?: number;
  notes?: string; // Attendance notes
  // Status metadata
  isMissed?: boolean; // True if attendance status is MISSED
  isCancelled?: boolean; // True if attendance status is CANCELLED
}

export interface AttendanceStatus {
    scheduled: AttendanceStatusDetail[],
    checkedIn: AttendanceStatusDetail[],
    onGoing: AttendanceStatusDetail[],
    completed: AttendanceStatusDetail[],
  }

export type AttendanceByDate = {
  date: string; // YYYY-MM-DD format
} & {
  [type in AttendanceType]: AttendanceStatus;
};

export interface ScheduleItem {
  date: string; // YYYY-MM-DD format
  patients: {
    id: string;
    name: string;
    priority: Priority;
    attendanceId?: number; // Backend attendance ID for deletion
    attendanceType?: AttendanceType; // Specific attendance type for individual patients
    /** Attendance workflow status from API (schedule list) */
    attendanceStatus?: import("@/api/types").AttendanceStatus;
  }[];
}

export type Schedule = {
  [K in AttendanceType]: ScheduleItem[];
};

// Specialized schedule type for calendar view (combines physiotherapy and tens into physiotherapy)
export type CalendarSchedule = {
  assessment: ScheduleItem[];
  physiotherapy: ScheduleItem[];
};

export interface PatientBasic {
  name: string,
  id: string,
  phone: string,
  priority: Priority,
  status: Status,
  birthDate?: string, // YYYY-MM-DD string format (optional for backward compatibility)
}

export interface Patient extends PatientBasic {
  birthDate: string, // YYYY-MM-DD string format
  mainConcern: string,
  startDate: string, // YYYY-MM-DD string format
  dischargeDate: string | null, // YYYY-MM-DD string format or null
  timezone?: string,
  nextAttendanceDates: {
    date: string, // YYYY-MM-DD string format
    type: AttendanceType,
    status?: 'scheduled' | 'checked_in' | 'in_progress' | 'cancelled',
    absenceNotes?: string, // Cancellation reason
  }[],
  currentRecommendations: {
    date: string, // YYYY-MM-DD string format
  } & Recommendations,
  previousAttendances: PreviousAttendance[],
  /** Consecutive unjustified absences (from API; default 0) */
  missingAppointmentsStreak: number,
  /** Count of open (scheduled, checked_in, in_progress) attendances; used for status-change confirmation */
  openAttendancesCount?: number
}

export interface PreviousAttendance {
  attendanceId: string;
  date: string; // YYYY-MM-DD string format
  type: AttendanceType;
  notes: string;
  recommendations: Recommendations | null;
  status?: 'completed' | 'missed' | 'cancelled'; // Add status for display
  absenceNotes?: string; // Absence justification for missed/cancelled
  absenceJustified?: boolean; // Whether absence was justified
  createdDate: string; // YY-MM-DD 
  updatedDate: string; // YY-MM-DD 
  cancelledDate?: string; // YYYY-MM-DD (only for cancelled attendances)
}
