import type {
  SessionResponseDto,
  TreatmentResponseDto,
} from "@/api/types";

export interface PostTreatmentRow {
  attendanceId: number;
  treatmentType: "physiotherapy" | "tens";
  bodyLocation: string;
  color?: string;
  durationMinutes?: number;
  plannedSessions: number;
  completedSessions: number;
  sessionNumber: number;
  /** Parent treatment plan row (`hms_treatment.id`) */
  treatmentId: number;
  /** The scheduled `hms_session` row for this attendance */
  sessionRow: SessionResponseDto;
  /** Parent treatment plan (`hms_treatment`) */
  treatment: TreatmentResponseDto;
  allSessions: SessionResponseDto[];
}

export const getTreatmentTypeLabel = (type: "physiotherapy" | "tens"): string =>
  type === "physiotherapy" ? "Physiotherapy" : "TENS";

export const getBorderColor = (type: "physiotherapy" | "tens"): string =>
  type === "physiotherapy" ? "border-l-yellow-400" : "border-l-blue-400";
