import type {
  ConsultationResponseDto,
  TreatmentResponseDto,
} from "@/api/types";
import type {
  PostConsultationFormData,
  PatientStatusValue,
} from "@/features/board/components/Consultation/hooks/usePostConsultationForm";
import {
  DEFAULT_PHYSIOTHERAPY_DURATION_MINUTES,
  DEFAULT_TENS_DURATION_MINUTES,
} from "@/constants/treatment";

/** Example general-recommendation copy for tests (physiotherapy clinic context). */
export const EXAMPLE_HOME_EXERCISES =
  "3x daily: cat-camel, pelvic tilt, 10 reps each";
export const EXAMPLE_PAIN_MANAGEMENT =
  "Ice 15 min after sessions, 3x/day for 48 hours";
export const EXAMPLE_MEDICATIONS = "Diclofenac gel twice daily as directed";
export const EXAMPLE_BODY_LOCATION = "Lumbar";
export const EXAMPLE_TENS_BODY_LOCATION = "Right Ankle";

export function createMockConsultationResponse(
  id: number,
  appointmentId = 456,
  overrides: Partial<ConsultationResponseDto> = {},
): ConsultationResponseDto {
  return {
    id,
    appointmentId,
    mainConcern: "Lower back pain",
    homeExercises: EXAMPLE_HOME_EXERCISES,
    painManagement: EXAMPLE_PAIN_MANAGEMENT,
    medications: EXAMPLE_MEDICATIONS,
    physiotherapy: true,
    tens: true,
    returnWeeks: 4,
    notes: "Patient reports gradual improvement",
    createdDate: "2024-01-15",
    createdTime: "10:00:00",
    updatedDate: "2024-01-15",
    updatedTime: "10:00:00",
    ...overrides,
  };
}

export function createMockTreatmentResponse(
  overrides: Partial<TreatmentResponseDto> = {},
): TreatmentResponseDto {
  const treatmentType = overrides.treatmentType ?? "physiotherapy";
  return {
    id: 1,
    consultationId: 1,
    appointmentId: 1,
    patientId: 1,
    treatmentType,
    bodyLocation: EXAMPLE_BODY_LOCATION,
    startDate: "2025-01-15",
    plannedSessions: 10,
    completedSessions: 0,
    status: "scheduled",
    durationMinutes:
      treatmentType === "physiotherapy"
        ? DEFAULT_PHYSIOTHERAPY_DURATION_MINUTES
        : DEFAULT_TENS_DURATION_MINUTES,
    notes: "Test treatment plan",
    createdDate: "2025-01-15",
    createdTime: "10:00:00",
    updatedDate: "2025-01-15",
    updatedTime: "10:00:00",
    ...overrides,
  };
}

export function createMockPostConsultationFormData(
  overrides: Partial<PostConsultationFormData> = {},
): PostConsultationFormData {
  return {
    mainConcern: "Lower back pain",
    patientStatus: "T" as PatientStatusValue,
    startDate: "2024-01-15",
    returnWeeks: 4,
    homeExercises: EXAMPLE_HOME_EXERCISES,
    painManagement: EXAMPLE_PAIN_MANAGEMENT,
    medications: EXAMPLE_MEDICATIONS,
    recommendations: {
      physiotherapy: {
        startDate: "2024-01-15",
        treatments: [
          {
            locations: [EXAMPLE_BODY_LOCATION],
            duration: DEFAULT_PHYSIOTHERAPY_DURATION_MINUTES,
            startDate: "2024-01-15",
            quantity: 3,
          },
        ],
      },
      tens: {
        startDate: "2024-01-15",
        treatments: [
          {
            locations: [EXAMPLE_TENS_BODY_LOCATION],
            duration: DEFAULT_TENS_DURATION_MINUTES,
            startDate: "2024-01-15",
            quantity: 2,
          },
        ],
      },
      returnWeeks: 4,
      returnWhenTreatmentComplete: false,
    },
    notes: "Patient reports gradual improvement",
    noGeneralRecommendations: false,
    noTreatmentRecommendations: false,
    ...overrides,
  };
}
