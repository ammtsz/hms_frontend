import { AppointmentType, AppointmentProgression } from "@/types/types";

export interface IDraggedItem {
  type: AppointmentType;
  status: AppointmentProgression;
  idx: number;
  patientId: number; // Use patient ID for better tracking with sorted lists
  isCombinedTreatment?: boolean; // Flag to indicate if this is a combined treatment card
  treatmentTypes?: AppointmentType[]; // All treatment types for combined cards
}
