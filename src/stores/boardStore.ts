/**
 * Board Store - Zustand
 *
 * Manages board UI state: selected date, drag & drop operations,
 * and endOfDay processing with optimistic updates.
 * 
 * This replaces the complex 398-line AppointmentsContext with clean,
 * performant Zustand state management.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  AppointmentStatusDetail,
  AppointmentByDate,
  AppointmentStatus
} from '@/types/types';
import type { IDraggedItem } from '@/features/board/types';
import { getTodayClinic } from '@/utils/timezoneDate';

// End-of-day workflow types
interface EndOfDayResult {
  type: 'incomplete' | 'scheduled_absences' | 'completed';
  incompleteAppointments?: AppointmentStatusDetail[];
  scheduledAbsences?: AppointmentStatusDetail[];
  completionData?: {
    totalPatients: number;
    completedPatients: number;
    missedPatients: number;
    completionTime: Date;
  };
}

// EndOfDayData interface will be added when finalizeEndOfDay is implemented

export interface BoardStore {
  // Core State
  selectedDate: string;
  loading: boolean;
  dataLoading: boolean;
  error: string | null;

  // Drag & Drop State
  draggedItem: IDraggedItem | null;
  isDragging: boolean;

  // End-of-day State
  dayFinalized: boolean;
  endOfDayStatus: EndOfDayResult | null;

  // Actions - Date Management
  setSelectedDate: (date: string) => void;
  setLoading: (loading: boolean) => void;
  setDataLoading: (dataLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Drag & Drop
  setDraggedItem: (item: IDraggedItem | null) => void;
  setIsDragging: (isDragging: boolean) => void;

  // Actions - End-of-day Workflow
  setDayFinalized: (finalized: boolean) => void;
  checkEndOfDayStatus: (appointmentsByDate: AppointmentByDate | null) => EndOfDayResult;
  finalizeEndOfDay: () => Promise<EndOfDayResult>;

  // Actions - Utilities
  resetState: () => void;
}

const initialState = {
  selectedDate: getTodayClinic(),
  loading: true,
  dataLoading: false,
  error: null,
  draggedItem: null,
  isDragging: false,
  dayFinalized: false,
  endOfDayStatus: null,
};

export const useBoardStore = create<BoardStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Date Management Actions
      setSelectedDate: (date: string) =>
        set({ selectedDate: date }, false, 'setSelectedDate'),

      setLoading: (loading: boolean) =>
        set({ loading }, false, 'setLoading'),

      setDataLoading: (dataLoading: boolean) =>
        set({ dataLoading }, false, 'setDataLoading'),

      setError: (error: string | null) =>
        set({ error }, false, 'setError'),

      // Drag & Drop Actions
      setDraggedItem: (draggedItem: IDraggedItem | null) =>
        set({ draggedItem }, false, 'setDraggedItem'),

      setIsDragging: (isDragging: boolean) =>
        set({ isDragging }, false, 'setIsDragging'),

      // End-of-day Actions
      setDayFinalized: (dayFinalized: boolean) =>
        set({ dayFinalized }, false, 'setDayFinalized'),

      checkEndOfDayStatus: (appointmentsByDate: AppointmentByDate | null): EndOfDayResult => {
        if (!appointmentsByDate) {
          return { type: 'incomplete', incompleteAppointments: [] };
        }

        const isAppointmentStatus = (value: unknown): value is AppointmentStatus => {
          const candidate = value as AppointmentStatus;
          return !!(
            value &&
            typeof value === "object" &&
            Array.isArray(candidate.scheduled) &&
            Array.isArray(candidate.checkedIn) &&
            Array.isArray(candidate.onGoing)
          );
        };

        const allAppointments = Object.values(appointmentsByDate)
          .filter(isAppointmentStatus)
          .flatMap((typeData) => [
            ...typeData.scheduled,
            ...typeData.checkedIn,
            ...typeData.onGoing,
          ]);

        const scheduledAppointments = Object.values(appointmentsByDate)
          .filter(isAppointmentStatus)
          .flatMap((typeData) => typeData.scheduled);

        if (allAppointments.length === 0) {
          return { type: 'completed' };
        }

        if (scheduledAppointments.length > 0) {
          return {
            type: 'scheduled_absences',
            scheduledAbsences: scheduledAppointments,
          };
        }

        return {
          type: 'incomplete',
          incompleteAppointments: allAppointments,
        };
      },

      finalizeEndOfDay: async (): Promise<EndOfDayResult> => {
        // TODO: Implement finalization logic with API calls
        // This will be migrated from AppointmentsContext
        return { type: 'completed' };
      },

      // Reset all state to initial values
      resetState: () =>
        set(initialState, false, 'resetState'),
    }),
    {
      name: 'board-store',
    }
  )
);