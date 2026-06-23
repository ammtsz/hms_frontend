import type {
  AppointmentByDate,
  AppointmentStatusDetail,
} from '@/types/types';

export interface AbsenceJustification {
  appointmentId: number;
  patientName: string;
  justified: boolean;
  notes: string;
}

export interface EndOfDayData {
  incompleteAppointments: AppointmentStatusDetail[];
  scheduledAbsences: AppointmentStatusDetail[];
  absenceJustifications: Array<{
    patientId: number;
    patientName: string;
    justified: boolean;
    notes: string;
  }>;
}

export interface EndOfDayResult {
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

export interface UseAppointmentsBoardStateReturn {
  appointmentsByDate: AppointmentByDate | null;
  selectedDate: string;
  loading: boolean;
  dataLoading: boolean;
  error: string | null;
  dayFinalized: boolean;
  endOfDayStatus: EndOfDayResult | null;
  setSelectedDate: (date: string) => void;
  setAppointmentsByDate: (data: AppointmentByDate | null) => void;
  loadAppointmentsByDate: (date: string) => Promise<AppointmentByDate | null>;
  initializeSelectedDate: () => Promise<void>;
  refreshCurrentDate: () => Promise<void>;
  checkEndOfDayStatus: () => EndOfDayResult;
  handleIncompleteAppointments: (
    appointments: AppointmentStatusDetail[],
    action: 'complete' | 'reschedule',
  ) => Promise<boolean>;
  handleAbsenceJustifications: (
    justifications: AbsenceJustification[],
  ) => Promise<boolean>;
}
