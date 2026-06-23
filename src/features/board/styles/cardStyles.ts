import { AppointmentProgression, AppointmentType } from "@/types/types";

/** Column header labels for the appointment board kanban */
export const APPOINTMENT_BOARD_STATUS_LABELS: Record<
  AppointmentProgression,
  string
> = {
  scheduled: "Scheduled",
  checkedIn: "Waiting Room",
  onGoing: "In Progress",
  completed: "Completed",
};

/** Uppercase overlay labels on appointment board cards */
export const APPOINTMENT_CARD_OVERLAY_LABELS = {
  missed: "MISSED",
  cancelled: "CANCELLED",
  next: "Next",
} as const;

export const getTypeBasedStyles = (appointmentType: AppointmentType | "combined") => {
  const typeStyles = {
    tens: "shadow-[0_2px_6px_0_rgba(59,130,246,0.5)] border-l-4 border-l-blue-400",
    physiotherapy: "shadow-[0_2px_6px_0_rgba(251,191,36,0.5)] border-l-4 border-l-yellow-400",
    assessment: "shadow-[0_2px_6px_0_rgba(107,114,128,0.5)] border-l-4 border-l-gray-400",
    combined: "shadow-[0_2px_6px_0_rgba(34,197,94,0.5)] border-l-4 border-l-green-400",
  };
  return typeStyles[appointmentType] || typeStyles.assessment;
};

export const getStatusColor = (status: AppointmentProgression) => {
  switch (status) {
    case "scheduled":
      return "text-blue-600";
    case "checkedIn":
      return "text-red-600";
    case "onGoing":
      return "text-yellow-600";
    case "completed":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
};

export const getStatusLabel = (status: AppointmentProgression) => {
  return APPOINTMENT_BOARD_STATUS_LABELS[status] ?? status;
};
