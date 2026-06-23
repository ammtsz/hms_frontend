import { AttendanceType, AttendanceProgression } from "@/types/types";

export interface IDraggedItem {
  type: AttendanceType;
  status: AttendanceProgression;
  idx: number;
  patientId: number; // Use patient ID for better tracking with sorted lists
  isCombinedTreatment?: boolean; // Flag to indicate if this is a combined treatment card
  treatmentTypes?: AttendanceType[]; // All treatment types for combined cards
}
