import { AppointmentStatus } from "@/api/types";

/** All workflow statuses available in the schedule status filter */
export const ALL_SCHEDULE_FILTER_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CHECKED_IN,
  AppointmentStatus.IN_PROGRESS,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.MISSED,
];

export const SCHEDULE_STATUS_CHECKBOX_LABELS: Record<
  AppointmentStatus,
  string
> = {
  [AppointmentStatus.SCHEDULED]: "Scheduled",
  [AppointmentStatus.CHECKED_IN]: "Checked-in",
  [AppointmentStatus.IN_PROGRESS]: "In progress",
  [AppointmentStatus.COMPLETED]: "Completed",
  [AppointmentStatus.CANCELLED]: "Cancelled",
  [AppointmentStatus.MISSED]: "Missed",
};

export const SCHEDULE_PAGE_LABELS = {
  title: "Appointments Schedule",
  description: "View and manage appointments by date and appointment type",
  newAppointmentButton: "+ New Appointment",
  schedulingModalTitle: "Assessment Consultation Scheduling",
  schedulingFormLoading: "Loading scheduling form...",
} as const;

export const SCHEDULE_COLUMN_TITLES = {
  assessment: "Assessment Consultations",
  physiotherapy: "Physiotherapy / TENS",
} as const;

export const SCHEDULE_COLUMN_MESSAGES = {
  loading: "Loading appointments...",
  emptyAssessment: "No assessment consultations found.",
  emptyPhysiotherapy: "No physiotherapy/TENS found.",
  emptyHint: "Select a different date or create a New Appointment.",
  refreshing: "Refreshing...",
} as const;

export const SCHEDULE_FILTER_LABELS = {
  appointmentStatus: "Appointment Status",
  legend: "Legend:",
  noStatusSelected: "No status selected: showing all statuses in the period.",
} as const;

export const UPCOMING_HOLIDAYS_LABELS = {
  title: "Upcoming Holidays",
  manageLink: "Manage Holidays",
  empty: "No upcoming holidays found.",
} as const;
