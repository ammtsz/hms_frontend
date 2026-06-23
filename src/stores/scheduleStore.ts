/**
 * Schedule Store - Zustand
 *
 * Manages calendar and scheduling UI state that was previously
 * mixed with server state in ScheduleContext.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AppointmentStatus } from '@/api/types';
import { AppointmentType } from '@/types/types';

export const SCHEDULE_DAY_WINDOW_OPTIONS = [1, 7, 15, 30, 60, 90] as const;
export type ScheduleDayWindowDays = (typeof SCHEDULE_DAY_WINDOW_OPTIONS)[number];

const ALLOWED_DAY_WINDOWS = new Set<number>(SCHEDULE_DAY_WINDOW_OPTIONS);

export const defaultScheduleCalendarStatusFilters = (): AppointmentStatus[] => [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CHECKED_IN,
  AppointmentStatus.IN_PROGRESS,
];

// Confirm remove modal state
interface ConfirmRemoveState {
  id: string;
  date: string; // YYYY-MM-DD format
  name: string;
  type: AppointmentType;
  appointmentIds: number[]; // Changed from single appointmentId to array
}

export interface ScheduleStore {
  // UI State
  selectedDate: Date;
  selectedTimeSlot: string | null;

  // Navigation State
  currentMonth: number;
  currentYear: number;

  // Modal States
  isSchedulingModalOpen: boolean;
  isEditingAppointment: boolean;
  editingAppointmentId: string | null;

  // UI Loading States (separate from data loading)
  isNavigating: boolean;
  isProcessingSchedule: boolean;

  // Calendar-specific state
  selectedDateString: string;
  /** Forward-only window length in days from selected date (inclusive). */
  scheduleDayWindowDays: ScheduleDayWindowDays;
  /** Empty array = request all statuses on the API. */
  scheduleStatusFilters: AppointmentStatus[];
  patientFilter: string;
  confirmRemove: ConfirmRemoveState | null;
  showNewAppointment: boolean;
  openAssessmentIdx: number[];
  openPhysiotherapyIdx: number[];

  // Actions - View Management
  setSelectedDate: (date: Date) => void;
  setSelectedTimeSlot: (timeSlot: string | null) => void;

  // Actions - Navigation
  setCurrentMonth: (month: number) => void;
  setCurrentYear: (year: number) => void;
  navigateToDate: (date: Date) => void;
  navigateToToday: () => void;

  // Actions - Modal Management
  openSchedulingModal: (timeSlot?: string) => void;
  closeSchedulingModal: () => void;
  startEditingAppointment: (appointmentId: string) => void;
  stopEditingAppointment: () => void;

  // Actions - UI Loading
  setIsNavigating: (isNavigating: boolean) => void;
  setIsProcessingSchedule: (isProcessing: boolean) => void;

  // Calendar-specific actions
  setSelectedDateString: (date: string) => void;
  setScheduleDayWindowDays: (days: ScheduleDayWindowDays) => void;
  setScheduleStatusFilters: (filters: AppointmentStatus[]) => void;
  setPatientFilter: (filter: string) => void;
  setConfirmRemove: (confirmRemove: ConfirmRemoveState | null) => void;
  setShowNewAppointment: (show: boolean) => void;
  setOpenAssessmentIdx: (idx: number[]) => void;
  setOpenPhysiotherapyIdx: (idx: number[]) => void;

  // Actions - Utilities
  resetState: () => void;
}

const today = new Date();
const initialState = {
  selectedDate: today,
  selectedTimeSlot: null,
  currentMonth: today.getMonth(),
  currentYear: today.getFullYear(),
  isSchedulingModalOpen: false,
  isEditingAppointment: false,
  editingAppointmentId: null,
  isNavigating: false,
  isProcessingSchedule: false,
  // Calendar-specific defaults
  selectedDateString: '',
  scheduleDayWindowDays: 30 as ScheduleDayWindowDays,
  scheduleStatusFilters: defaultScheduleCalendarStatusFilters(),
  patientFilter: '',
  confirmRemove: null,
  showNewAppointment: false,
  openAssessmentIdx: [],
  openPhysiotherapyIdx: [],
};

export const useScheduleStore = create<ScheduleStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // View Management Actions
        setSelectedDate: (selectedDate: Date) =>
          set(
            {
              selectedDate,
              currentMonth: selectedDate.getMonth(),
              currentYear: selectedDate.getFullYear(),
            },
            false,
            'setSelectedDate',
          ),

        setSelectedTimeSlot: (selectedTimeSlot: string | null) =>
          set({ selectedTimeSlot }, false, 'setSelectedTimeSlot'),

        // Navigation Actions
        setCurrentMonth: (currentMonth: number) =>
          set({ currentMonth }, false, 'setCurrentMonth'),

        setCurrentYear: (currentYear: number) =>
          set({ currentYear }, false, 'setCurrentYear'),

        navigateToDate: (date: Date) =>
          set(
            {
              selectedDate: date,
              currentMonth: date.getMonth(),
              currentYear: date.getFullYear(),
            },
            false,
            'navigateToDate',
          ),

        navigateToToday: () => {
          const now = new Date();
          set(
            {
              selectedDate: now,
              currentMonth: now.getMonth(),
              currentYear: now.getFullYear(),
            },
            false,
            'navigateToToday',
          );
        },

        // Modal Management Actions
        openSchedulingModal: (timeSlot?: string) =>
          set(
            {
              isSchedulingModalOpen: true,
              selectedTimeSlot: timeSlot || null,
            },
            false,
            'openSchedulingModal',
          ),

        closeSchedulingModal: () =>
          set(
            {
              isSchedulingModalOpen: false,
              selectedTimeSlot: null,
            },
            false,
            'closeSchedulingModal',
          ),

        startEditingAppointment: (editingAppointmentId: string) =>
          set(
            {
              isEditingAppointment: true,
              editingAppointmentId,
            },
            false,
            'startEditingAppointment',
          ),

        stopEditingAppointment: () =>
          set(
            {
              isEditingAppointment: false,
              editingAppointmentId: null,
            },
            false,
            'stopEditingAppointment',
          ),

        // UI Loading Actions
        setIsNavigating: (isNavigating: boolean) =>
          set({ isNavigating }, false, 'setIsNavigating'),

        setIsProcessingSchedule: (isProcessingSchedule: boolean) =>
          set({ isProcessingSchedule }, false, 'setIsProcessingSchedule'),

        // Calendar-specific actions
        setSelectedDateString: (selectedDateString: string) =>
          set({ selectedDateString }, false, 'setSelectedDateString'),

        setScheduleDayWindowDays: (scheduleDayWindowDays: ScheduleDayWindowDays) =>
          set(
            {
              scheduleDayWindowDays: ALLOWED_DAY_WINDOWS.has(scheduleDayWindowDays)
                ? scheduleDayWindowDays
                : (30 as ScheduleDayWindowDays),
            },
            false,
            'setScheduleDayWindowDays',
          ),

        setScheduleStatusFilters: (scheduleStatusFilters: AppointmentStatus[]) =>
          set({ scheduleStatusFilters }, false, 'setScheduleStatusFilters'),

        setPatientFilter: (patientFilter: string) =>
          set({ patientFilter }, false, 'setPatientFilter'),

        setConfirmRemove: (confirmRemove: ConfirmRemoveState | null) =>
          set({ confirmRemove }, false, 'setConfirmRemove'),

        setShowNewAppointment: (showNewAppointment: boolean) =>
          set({ showNewAppointment }, false, 'setShowNewAppointment'),

        setOpenAssessmentIdx: (openAssessmentIdx: number[]) =>
          set({ openAssessmentIdx }, false, 'setOpenAssessmentIdx'),

        setOpenPhysiotherapyIdx: (openPhysiotherapyIdx: number[]) =>
          set({ openPhysiotherapyIdx }, false, 'setOpenPhysiotherapyIdx'),

        // Reset all state to initial values
        resetState: () =>
          set(
            {
              ...initialState,
              scheduleStatusFilters: defaultScheduleCalendarStatusFilters(),
            },
            false,
            'resetState',
          ),
      }),
      {
        name: 'hms-frontend-schedule-calendar-ui',
        partialize: (state) => ({
          scheduleDayWindowDays: state.scheduleDayWindowDays,
          scheduleStatusFilters: state.scheduleStatusFilters,
        }),
      },
    ),
    {
      name: 'schedule-store',
    },
  ),
);
