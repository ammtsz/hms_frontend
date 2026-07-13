/**
 * Modern TypeScript Type System
 * 
 * This file defines all type definitions for the application using modern TypeScript conventions.
 * Primary types use clean names without prefixes (Priority, Status, AppointmentType, etc.).
 * Legacy I-prefixed types are maintained as aliases for backward compatibility.
 * New API types are re-exported for seamless integration.
 */

import { AppointmentStatus as ApiAppointmentStatus } from "@/api/types";

// Re-export new API types
export {
  PatientPriority,
  PatientStatus,
  type PatientResponseDto,
  type AppointmentResponseDto,
  type AppointmentScheduleDto,
  type ConsultationResponseDto,
  type CreatePatientRequest,
  type UpdatePatientRequest,
  type CreateAppointmentRequest,
  type UpdateAppointmentRequest,
  type CreateConsultationRequest,
  type UpdateConsultationRequest,
  type ScheduleSettingResponseDto
} from '@/api/types';

// Primary types (modern naming without I-prefix)
export type Priority = "1" | "2" | "3" | "4" | "5";
export type Status = "N" | "T" | "D" | "C";
export type AppointmentType = "assessment" | "physiotherapy" | "tens" | "combined"; // combined for calendar view
export type AppointmentProgression = "scheduled" | "checkedIn" | "onGoing" | "completed";

/** Appointment workflow status string values (API `AppointmentStatus` enum). */
export type AppointmentWorkflowStatus = `${ApiAppointmentStatus}`;

/** Open/upcoming statuses plus cancelled (scheduled lists / next appointments). */
export type UpcomingAppointmentStatus = Extract<
  AppointmentWorkflowStatus,
  "scheduled" | "checked_in" | "in_progress" | "cancelled"
>;

// UI section types for the room layout  
export type UISection = "assessment" | "mixed"; // assessment room and mixed room (physiotherapy + tens)

export interface Recommendations {
  homeExercises: string;
  painManagement: string;
  medications: string;
  physiotherapy: boolean;
  tens: boolean;
  returnWeeks: number;
  notes?: string;
}

export interface AppointmentStatusDetail {
  name: string; 
  priority: Priority; 
  checkedInTime?: string | null; 
  onGoingTime?: string | null; 
  completedTime?: string | null;
  // Backend sync data
  appointmentId?: number;
  treatmentAppointmentIds?: number[];
  patientId?: number;
  notes?: string; // Appointment notes
  // Status metadata
  isMissed?: boolean; // True if appointment status is MISSED
  isCancelled?: boolean; // True if appointment status is CANCELLED
}

export interface AppointmentStatus {
    scheduled: AppointmentStatusDetail[],
    checkedIn: AppointmentStatusDetail[],
    onGoing: AppointmentStatusDetail[],
    completed: AppointmentStatusDetail[],
  }

export type AppointmentByDate = {
  date: string; // YYYY-MM-DD format
} & {
  [type in AppointmentType]: AppointmentStatus;
};

export interface ScheduleItem {
  date: string; // YYYY-MM-DD format
  patients: {
    id: string;
    name: string;
    priority: Priority;
    appointmentId?: number; // Backend appointment ID for deletion
    appointmentType?: AppointmentType; // Specific appointment type for individual patients
    /** Appointment workflow status from API (schedule list) */
    appointmentStatus?: import("@/api/types").AppointmentStatus;
  }[];
}

export type Schedule = {
  [K in AppointmentType]: ScheduleItem[];
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
  nextAppointmentDates: {
    date: string, // YYYY-MM-DD string format
    type: AppointmentType,
    status?: UpcomingAppointmentStatus,
    absenceNotes?: string, // Cancellation reason
  }[],
  currentRecommendations: {
    date: string, // YYYY-MM-DD string format
  } & Recommendations,
  previousAppointments: PreviousAppointment[],
  /** Consecutive unjustified absences (from API; default 0) */
  missingAppointmentsStreak: number,
  /** Count of open (scheduled, checked_in, in_progress) appointments; used for status-change confirmation */
  openAppointmentsCount?: number
}

export interface PreviousAppointment {
  appointmentId: string;
  date: string; // YYYY-MM-DD string format
  type: AppointmentType;
  notes: string;
  recommendations: Recommendations | null;
  /** Includes open statuses so past unresolved slots can appear in history. */
  status?: AppointmentWorkflowStatus;
  absenceNotes?: string; // Absence justification for missed/cancelled
  absenceJustified?: boolean; // Whether absence was justified
  createdDate: string; // YY-MM-DD 
  updatedDate: string; // YY-MM-DD 
  cancelledDate?: string; // YYYY-MM-DD (only for cancelled appointments)
}
