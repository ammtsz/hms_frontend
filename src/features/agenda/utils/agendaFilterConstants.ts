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
    [AttendanceStatus.SCHEDULED]: "Scheduled",
    [AttendanceStatus.CHECKED_IN]: "Checked-in",
    [AttendanceStatus.IN_PROGRESS]: "In progress",
    [AttendanceStatus.COMPLETED]: "Completed",
    [AttendanceStatus.CANCELLED]: "Cancelled",
    [AttendanceStatus.MISSED]: "Missed",
  };

export const AGENDA_PAGE_LABELS = {
  title: "Attendance Schedule",
  description: "View and manage appointments by date and attendance type",
  newAttendanceButton: "+ New Attendance",
  schedulingModalTitle: "Assessment Consultation Scheduling",
  schedulingFormLoading: "Loading scheduling form...",
} as const;

export const AGENDA_COLUMN_TITLES = {
  assessment: "Assessment Consultations",
  physiotherapy: "Physiotherapy / TENS",
} as const;

export const AGENDA_COLUMN_MESSAGES = {
  loading: "Loading appointments...",
  emptyAssessment: "No assessment consultations found.",
  emptyPhysiotherapy: "No physiotherapy/TENS found.",
  emptyHint: "Select a different date or create a New Attendance.",
  refreshing: "Refreshing...",
} as const;

export const AGENDA_FILTER_LABELS = {
  attendanceStatus: "Attendance Status",
  legend: "Legend:",
  noStatusSelected: "No status selected: showing all statuses in the period.",
} as const;

export const UPCOMING_HOLIDAYS_LABELS = {
  title: "Upcoming Holidays",
  manageLink: "Manage Holidays",
  empty: "No upcoming holidays found.",
} as const;
