import type {
  AttendanceByDate,
  AttendanceStatusDetail,
} from '@/types/types';

export interface AbsenceJustification {
  attendanceId: number;
  patientName: string;
  justified: boolean;
  notes: string;
}

export interface EndOfDayData {
  incompleteAttendances: AttendanceStatusDetail[];
  scheduledAbsences: AttendanceStatusDetail[];
  absenceJustifications: Array<{
    patientId: number;
    patientName: string;
    justified: boolean;
    notes: string;
  }>;
}

export interface EndOfDayResult {
  type: 'incomplete' | 'scheduled_absences' | 'completed';
  incompleteAttendances?: AttendanceStatusDetail[];
  scheduledAbsences?: AttendanceStatusDetail[];
  completionData?: {
    totalPatients: number;
    completedPatients: number;
    missedPatients: number;
    completionTime: Date;
  };
}

export interface UseAttendanceBoardStateReturn {
  attendancesByDate: AttendanceByDate | null;
  selectedDate: string;
  loading: boolean;
  dataLoading: boolean;
  error: string | null;
  dayFinalized: boolean;
  endOfDayStatus: EndOfDayResult | null;
  setSelectedDate: (date: string) => void;
  setAttendancesByDate: (data: AttendanceByDate | null) => void;
  loadAttendancesByDate: (date: string) => Promise<AttendanceByDate | null>;
  initializeSelectedDate: () => Promise<void>;
  refreshCurrentDate: () => Promise<void>;
  checkEndOfDayStatus: () => EndOfDayResult;
  handleIncompleteAttendances: (
    attendances: AttendanceStatusDetail[],
    action: 'complete' | 'reschedule',
  ) => Promise<boolean>;
  handleAbsenceJustifications: (
    justifications: AbsenceJustification[],
  ) => Promise<boolean>;
}
