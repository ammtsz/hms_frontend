export interface AbsenceJustification {
  appointmentId?: number;
  patientId: number;
  patientName: string;
  appointmentType: string;
  justified?: boolean; // Optional until user selects
  justification?: string;
}

export interface ScheduledAbsence {
  appointmentId?: number;
  patientId: number;
  patientName: string;
  appointmentType: string;
}
