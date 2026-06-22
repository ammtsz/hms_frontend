/** Day-of-week names in English (getDay(): 0=Sunday .. 6=Saturday) */
export const DAY_NAMES_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * If the error is about no schedule for the selected date (backend "scheduling settings"
 * or "No schedule configuration"), returns a friendly reason with day name when
 * the error contains "day N". Otherwise returns null.
 */
export function getNoScheduleReasonForNewPatient(
  errorMessage: string
): string | null {
  const noSchedule =
    /scheduling settings|no schedule configuration|day\s*\d/i.test(
      errorMessage
    );
  if (!noSchedule) return null;
  const match = errorMessage.match(/day\s*(\d)/i);
  const dayNum = match ? parseInt(match[1], 10) : null;
  if (dayNum !== null && dayNum >= 0 && dayNum <= 6) {
    return `there are no appointments on ${DAY_NAMES_EN[dayNum]}`;
  }
  return "there are no appointments for the selected day";
}
