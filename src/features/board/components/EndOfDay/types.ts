export interface AbsenceJustification {
  attendanceId?: number;
  patientId: number;
  patientName: string;
  attendanceType: string;
  justified?: boolean; // Optional until user selects
  justification?: string;
}

export interface ScheduledAbsence {
  attendanceId?: number;
  patientId: number;
  patientName: string;
  attendanceType: string;
}
