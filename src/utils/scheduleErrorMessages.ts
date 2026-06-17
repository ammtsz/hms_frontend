/** Day-of-week names in Portuguese (getDay(): 0=Sunday .. 6=Saturday) */
export const DAY_NAMES_PT = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
] as const;

/**
 * If the error is about no schedule for the selected date (backend "scheduling settings"
 * or "Não há configuração de agenda"), returns a friendly reason with day name when
 * the error contains "day N". Otherwise returns null.
 */
export function getNoScheduleReasonForNewPatient(
  errorMessage: string
): string | null {
  const noSchedule =
    /scheduling settings|não há configuração de agenda|day\s*\d/i.test(
      errorMessage
    );
  if (!noSchedule) return null;
  const match = errorMessage.match(/day\s*(\d)/i);
  const dayNum = match ? parseInt(match[1], 10) : null;
  if (dayNum !== null && dayNum >= 0 && dayNum <= 6) {
    return `não há atendimentos de ${DAY_NAMES_PT[dayNum]}`;
  }
  return "não há atendimentos para o dia selecionado";
}
