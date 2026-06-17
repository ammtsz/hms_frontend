import { AttendanceStatus } from "@/api/types";

/** All workflow statuses available in the agenda status filter */
export const ALL_AGENDA_FILTER_STATUSES: AttendanceStatus[] = [
  AttendanceStatus.SCHEDULED,
  AttendanceStatus.CHECKED_IN,
  AttendanceStatus.IN_PROGRESS,
  AttendanceStatus.COMPLETED,
  AttendanceStatus.CANCELLED,
  AttendanceStatus.MISSED,
];

export const AGENDA_STATUS_CHECKBOX_LABELS: Record<AttendanceStatus, string> =
  {
    [AttendanceStatus.SCHEDULED]: "Agendado",
    [AttendanceStatus.CHECKED_IN]: "Checked-in",
    [AttendanceStatus.IN_PROGRESS]: "Em andamento",
    [AttendanceStatus.COMPLETED]: "Concluído",
    [AttendanceStatus.CANCELLED]: "Cancelado",
    [AttendanceStatus.MISSED]: "Falta",
  };
