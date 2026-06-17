import { getTodayClinic } from "@/utils/timezoneDate";
import { formatDateBR } from "@/utils/dateUtils";
import { getDayFinalizationStatus } from "@/api/day-finalization";
import { checkIfHolidayForTreatmentType } from "@/api/holidays";
import { getAttendancesByDate } from "@/api/attendances";
import { transformAttendanceWithPatientByDate } from "@/utils/apiTransformers";
import { isPatientAlreadyScheduledForAssessment } from "@/utils/businessRules";
import { SCHEDULED_TIME } from "@/utils/constants";
import type { AttendanceByDate } from "@/types/types";

/** Treatment type to display name mapping */
const TREATMENT_NAMES: Record<string, string> = {
  assessment: "Consulta de Avaliação",
  physiotherapy: "Fisioterapia",
  tens: "TENS",
};

/** Map frontend treatment type to API format */
function toApiTreatmentType(type: string): "assessment" | "physiotherapy" | "tens" {
  if (type === "assessment") return "assessment";
  if (type === "physiotherapy") return "physiotherapy";
  return "tens";
}

/** Get display name for a treatment type */
export function getTreatmentDisplayName(type: string): string {
  return TREATMENT_NAMES[type] ?? type;
}

/** Validate basic form inputs (name and selected types). Returns error message or null if valid. */
export function validateBasicInputs(
  name: string,
  selectedTypes: string[]
): string | null {
  if (!name || selectedTypes.length === 0) {
    return "Por favor, preencha o nome do paciente e selecione pelo menos um tipo de atendimento.";
  }
  return null;
}

/** Validate date slot availability. Returns error message or null if valid. */
export function validateDateSlot(
  showDateField: boolean,
  dateSlotError: string | null
): string | null {
  if (showDateField && dateSlotError) return dateSlotError;
  return null;
}

/** Check if target date is finalized. Returns error message or null if scheduling is allowed. */
export async function validateDayNotFinalized(
  targetDate: string
): Promise<string | null> {
  const result = await getDayFinalizationStatus(targetDate);
  if (result.success && result.value?.isFinalized) {
    return "Dia já finalizado. Não é mais possível agendar atendimentos para este dia.";
  }
  return null;
}

/** Check if any selected treatment type is blocked by holiday. Returns error message or null. */
export async function validateHolidayBlocking(
  targetDate: string,
  selectedTypes: string[]
): Promise<string | null> {
  const blocked: string[] = [];
  const allowed: string[] = [];

  for (const treatmentType of selectedTypes) {
    const apiType = toApiTreatmentType(treatmentType);
    const response = await checkIfHolidayForTreatmentType(targetDate, apiType);

    if (!response.success) {
      return "Erro ao verificar feriados. Por favor, tente novamente.";
    }

    const displayName = getTreatmentDisplayName(treatmentType);
    if (response.value) {
      blocked.push(displayName);
    } else {
      allowed.push(displayName);
    }
  }

  if (blocked.length === 0) return null;
  if (allowed.length > 0) {
    return (
      `Esta data é feriado e bloqueia: ${blocked.join(", ")}. ` +
      `Você ainda pode agendar: ${allowed.join(", ")}.`
    );
  }
  return "Esta data é feriado, selecione uma nova data.";
}

/** Fetch attendances for target date, or use context attendances if same date. */
export async function getAttendancesForTargetDate(
  targetDate: string,
  attendancesByDate: AttendanceByDate | null
): Promise<AttendanceByDate | null> {
  const currentContextDate = getTodayClinic();
  if (targetDate === currentContextDate) return attendancesByDate;

  const response = await getAttendancesByDate(targetDate);
  if (!response.success || !response.value?.length) return attendancesByDate;

  return transformAttendanceWithPatientByDate(response.value, targetDate);
}

/** Build date text for duplicate schedule error message */
function getDuplicateScheduleDateText(
  targetDate: string,
  validationDate: string | undefined
): string {
  const currentContextDate = getTodayClinic();
  if (targetDate !== currentContextDate) return `para ${formatDateBR(targetDate)}`;
  if (validationDate && validationDate !== getTodayClinic()) {
    return `para ${formatDateBR(validationDate)}`;
  }
  return "para hoje";
}

/** BR-306: duplicate check for walkIn / manual registration (assessment only on FE). */
export function validateDuplicateSchedule(
  patientName: string,
  selectedTypes: string[],
  attendancesForTargetDate: AttendanceByDate | null,
  targetDate: string,
  validationDate?: string
): string | null {
  if (!selectedTypes.includes("assessment")) {
    return null;
  }
  if (
    !isPatientAlreadyScheduledForAssessment(
      patientName,
      attendancesForTargetDate,
    )
  ) {
    return null;
  }
  const dateText = getDuplicateScheduleDateText(targetDate, validationDate);
  return `O paciente "${patientName}" já possui consulta agendada ${dateText}. Verifique a lista de atendimentos.`;
}

/** Build success message after registration */
export function buildSuccessMessage(
  selectedTypesCount: number,
  nextAvailableDate: string
): string {
  const isToday = nextAvailableDate === getTodayClinic();
  const dateMessage = isToday ? "hoje" : `para ${nextAvailableDate}`;
  return `Agendamento criado com sucesso! ${selectedTypesCount} atendimento(s) agendado(s) ${dateMessage} às ${SCHEDULED_TIME}.`;
}

/** Check if error indicates a conflict (slot/409/Conflict) */
export function isConflictError(error: string | undefined): boolean {
  if (!error) return false;
  return (
    error.includes("409") ||
    error.includes("Conflict") ||
    error.includes("slot")
  );
}

/** Build error message when new patient was created but scheduling failed */
export function buildNewPatientSchedulingFailureMessage(
  reason: string
): string {
  return `PACIENTE CRIADO com sucesso, mas NÃO FOI POSSÍVEL AGENDAR o atendimento pois ${reason}. Desmarque a opção 'Novo paciente', selecione o paciente na lista e tente agendar novamente.`;
}

/** Build error message for generic scheduling failure (existing patient) */
export function buildSchedulingFailureMessage(
  failedCount: number,
  hasConflict: boolean,
  firstError: string | undefined
): string {
  if (hasConflict) {
    return "Conflito de horário detectado. Tente agendar para outro horário ou data.";
  }
  if (firstError) return firstError;
  return `Erro ao criar ${failedCount} atendimento(s). Algumas podem ter sido criadas com sucesso.`;
}
