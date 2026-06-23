import type { PatientBasic } from "@/types/types";
import { formatDateForInput } from "@/utils/timezoneDate";

/**
 * Mirrors the new-patient check-in form required fields so drag/drop can skip
 * the modal when the patient already has the minimum data.
 */
export function isNewPatientCheckInDataComplete(
  patient: Pick<PatientBasic, "name" | "phone" | "birthDate">,
): boolean {
  if (!patient.name?.trim()) return false;
  if (!patient.phone?.trim()) return false;

  return Boolean(formatDateForInput(patient.birthDate));
}
