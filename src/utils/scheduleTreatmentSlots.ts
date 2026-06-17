/**
 * Shared utilities for validating treatment (Fisioterapia / TENS) slot availability
 * by date using schedule settings. Used for inline validation and pre-submit checks.
 */

export interface ScheduleSettingForSlots {
  dayOfWeek: number;
  isActive: boolean;
  maxConcurrentPhysiotherapyTens?: number;
  maxConcurrentAssessment?: number;
}

/** User-facing message when a selected date has no treatment slots. */
export const TREATMENT_SLOTS_UNAVAILABLE_MESSAGE =
  "Esta data não possui agenda para tratamentos (Fisioterapia / TENS). Escolha uma data válida.";

/** User-facing message when a selected date has no assessment consultation slots. */
export const ASSESSMENT_SLOTS_UNAVAILABLE_MESSAGE =
  "Esta data não possui agenda para consulta de avaliação. Escolha uma data válida.";

/**
 * Returns the day of week (0 = Sunday, 6 = Saturday) for a YYYY-MM-DD date string.
 */
export function getDayOfWeekFromDateString(dateString: string): number {
  const date = new Date(dateString + "T00:00:00");
  return date.getDay();
}

/**
 * Returns whether the given date has available slots for assessment consultation.
 * Use with data from useScheduleSettings() or getScheduleSettings().
 */
export function hasSlotsForAssessmentOnDate(
  dateString: string,
  slots: ScheduleSettingForSlots[] | null | undefined,
): boolean {
  if (!slots || slots.length === 0) return false;
  const dayOfWeek = getDayOfWeekFromDateString(dateString);
  const slot = slots.find((s) => s.dayOfWeek === dayOfWeek);
  if (!slot || !slot.isActive) return false;
  return (slot.maxConcurrentAssessment ?? 0) > 0;
}

/**
 * Returns whether the given date has available slots for treatments (physiotherapy/tens).
 * Use with data from useScheduleSettings() or getScheduleSettings().
 */
export function hasSlotsForTreatmentOnDate(
  dateString: string,
  slots: ScheduleSettingForSlots[] | null | undefined,
): boolean {
  if (!slots || slots.length === 0) return false;
  const dayOfWeek = getDayOfWeekFromDateString(dateString);
  const slot = slots.find((s) => s.dayOfWeek === dayOfWeek);
  if (!slot || !slot.isActive) return false;
  return (slot.maxConcurrentPhysiotherapyTens ?? 0) > 0;
}

/** Message when selected date has no slots for any of the selected types. */
export const ALL_TYPES_SLOTS_UNAVAILABLE_MESSAGE =
  "Esta data não possui agenda para os tipos de atendimento selecionados. Escolha uma data válida.";

/**
 * Returns the date slot error message when the selected date has no slots for the
 * selected attendance types (assessment, physiotherapy, tens). Returns null when valid.
 * Use for pre-submit validation feedback.
 */
export function getDateSlotError(
  selectedDate: string,
  selectedTypes: string[],
  scheduleSettings: ScheduleSettingForSlots[] | null | undefined,
): string | null {
  if (!scheduleSettings?.length) return null;
  const hasAssessment = selectedTypes.includes("assessment");
  const hasTreatment =
    selectedTypes.includes("physiotherapy") || selectedTypes.includes("tens");
  const assessmentInvalid =
    hasAssessment && !hasSlotsForAssessmentOnDate(selectedDate, scheduleSettings);
  const treatmentInvalid =
    hasTreatment && !hasSlotsForTreatmentOnDate(selectedDate, scheduleSettings);
  if (assessmentInvalid && treatmentInvalid) {
    return ALL_TYPES_SLOTS_UNAVAILABLE_MESSAGE;
  }
  if (assessmentInvalid) return ASSESSMENT_SLOTS_UNAVAILABLE_MESSAGE;
  if (treatmentInvalid) return TREATMENT_SLOTS_UNAVAILABLE_MESSAGE;
  return null;
}

/**
 * Returns the next date (YYYY-MM-DD) on or after the given date that has treatment slots.
 * If no slots found in the next 28 days, returns the original date.
 */
export function getNextDateWithTreatmentSlots(
  fromDateString: string,
  slots: ScheduleSettingForSlots[] | null | undefined,
): string {
  if (!slots || slots.length === 0) return fromDateString;
  const [y, m, d] = fromDateString.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const maxDays = 60;
  for (let i = 0; i < maxDays; i++) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    if (hasSlotsForTreatmentOnDate(dateStr, slots)) return dateStr;
    date.setDate(date.getDate() + 1);
  }
  return fromDateString;
}

/** Treatment shape with startDate used for validation. */
export interface TreatmentWithStartDate {
  startDate: string;
}

/**
 * Returns true if any treatment (physiotherapy or tens) has a startDate that has no available slots.
 * Use to block submit when scheduling treatments.
 */
export function hasInvalidTreatmentStartDates(
  slots: ScheduleSettingForSlots[] | null | undefined,
  physiotherapyTreatments: TreatmentWithStartDate[] | undefined,
  tensTreatments: TreatmentWithStartDate[] | undefined,
): boolean {
  if (!slots || slots.length === 0) return false;
  const allStartDates = [
    ...(physiotherapyTreatments?.map((t) => t.startDate) ?? []),
    ...(tensTreatments?.map((t) => t.startDate) ?? []),
  ];
  return allStartDates.some(
    (dateStr) => !hasSlotsForTreatmentOnDate(dateStr, slots),
  );
}
