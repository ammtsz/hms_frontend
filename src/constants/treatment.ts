/** Allowed session durations (minutes) for physiotherapy and TENS treatment plans. */
export const TREATMENT_SESSION_DURATIONS = [30, 45, 60] as const;

export type TreatmentSessionDuration =
  (typeof TREATMENT_SESSION_DURATIONS)[number];

export const DEFAULT_PHYSIOTHERAPY_DURATION_MINUTES = 45;
export const DEFAULT_TENS_DURATION_MINUTES = 30;

export function getDefaultDurationForTreatmentType(
  treatmentType: "physiotherapy" | "tens",
): TreatmentSessionDuration {
  return treatmentType === "physiotherapy"
    ? DEFAULT_PHYSIOTHERAPY_DURATION_MINUTES
    : DEFAULT_TENS_DURATION_MINUTES;
}

export function isValidTreatmentDuration(
  value: number,
): value is TreatmentSessionDuration {
  return (TREATMENT_SESSION_DURATIONS as readonly number[]).includes(value);
}

export function formatTreatmentDurationMinutes(minutes: number): string {
  return `${minutes} min`;
}
