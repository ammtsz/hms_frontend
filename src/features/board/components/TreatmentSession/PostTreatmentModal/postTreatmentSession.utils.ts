import type { SessionResponseDto } from "@/api/types";

/** Session rows for one treatment plan (`hms_treatment`), ordered by session number. */
export type TreatmentPlanSessionHistory = Map<number, SessionResponseDto[]>;

/**
 * Indexes all of a patient's session rows by treatment plan id.
 * Each plan's rows are sorted by session number (for progress circles).
 */
export function groupPatientSessionsByTreatmentPlan(
  patientSessions: SessionResponseDto[],
): TreatmentPlanSessionHistory {
  const historyByTreatmentPlanId: TreatmentPlanSessionHistory = new Map();

  for (const session of patientSessions) {
    const planSessions =
      historyByTreatmentPlanId.get(session.treatmentId) ?? [];
    planSessions.push(session);
    historyByTreatmentPlanId.set(session.treatmentId, planSessions);
  }

  for (const [treatmentPlanId, planSessions] of historyByTreatmentPlanId) {
    planSessions.sort((a, b) => a.sessionNumber - b.sessionNumber);
    historyByTreatmentPlanId.set(treatmentPlanId, planSessions);
  }

  return historyByTreatmentPlanId;
}

/**
 * Session history for one treatment plan, used to render progress circles.
 * Prefers the patient-wide index; falls back to rows scoped to today's appointment
 * when the plan is missing from the patient list.
 */
export function resolveTreatmentPlanSessionHistory(
  patientHistoryByTreatmentPlan: TreatmentPlanSessionHistory,
  treatmentPlanId: number,
  appointmentScopedSessions: SessionResponseDto[],
): SessionResponseDto[] {
  const fromPatientIndex = patientHistoryByTreatmentPlan.get(treatmentPlanId);
  if (fromPatientIndex && fromPatientIndex.length > 0) {
    return fromPatientIndex;
  }

  return appointmentScopedSessions
    .slice()
    .sort((a, b) => a.sessionNumber - b.sessionNumber);
}
