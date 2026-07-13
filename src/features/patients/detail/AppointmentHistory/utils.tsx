import React from "react";
import { AlertTriangle, Ban } from "lucide-react";
import { getAppointmentTypeLabel } from "@/utils/apiTransformers";
import { APPOINTMENT_HISTORY_STATUS_LABELS } from "@/utils/appointmentStatusLabels";

export type AppointmentStatus =
  | "completed"
  | "missed"
  | "cancelled"
  | "scheduled"
  | "checked_in"
  | "in_progress";

export { APPOINTMENT_HISTORY_STATUS_LABELS } from "@/utils/appointmentStatusLabels";

export interface StatusConfig {
  borderColor: string;
  badgeClass: string;
  icon: React.ReactElement | null;
  label: string;
}

/**
 * Get styling configuration for appointment status
 */
export const getStatusConfig = (status?: string): StatusConfig => {
  switch (status) {
    case "missed":
      return {
        borderColor: "border border-gray-50",
        badgeClass: "bg-red-100 text-red-800 border border-red-300",
        icon: <AlertTriangle size={16} className="inline mr-1" />,
        label: APPOINTMENT_HISTORY_STATUS_LABELS.missed,
      };
    case "cancelled":
      return {
        borderColor: "border border-gray-50",
        badgeClass: "bg-orange-100 text-orange-800 border border-orange-300",
        icon: <Ban size={16} className="inline mr-1" />,
        label: APPOINTMENT_HISTORY_STATUS_LABELS.cancelled,
      };
    case "scheduled":
    case "checked_in":
    case "in_progress":
      return {
        borderColor: "border border-gray-50",
        badgeClass: "bg-gray-200 text-gray-800 border border-gray-300",
        icon: null,
        label:
          status === "in_progress"
            ? APPOINTMENT_HISTORY_STATUS_LABELS.inProgress
            : APPOINTMENT_HISTORY_STATUS_LABELS.scheduled,
      };
    default: // completed
      return {
        borderColor: "border-gray-200",
        badgeClass: "bg-green-100 text-green-800 border border-green-300",
        icon: null,
        label: APPOINTMENT_HISTORY_STATUS_LABELS.completed,
      };
  }
};

/**
 * Get treatment type label from grouped appointment
 */
export const getTreatmentTypeLabel = (
  assessment: boolean,
  physiotherapy: boolean,
  tens: boolean,
): string => {
  if (assessment && physiotherapy && tens) {
    return `${getAppointmentTypeLabel("assessment")}, ${getAppointmentTypeLabel("physiotherapy")} and ${getAppointmentTypeLabel("tens")}`;
  }
  if (assessment && physiotherapy) {
    return `${getAppointmentTypeLabel("assessment")} and ${getAppointmentTypeLabel("physiotherapy")}`;
  }
  if (assessment && tens) {
    return `${getAppointmentTypeLabel("assessment")} and ${getAppointmentTypeLabel("tens")}`;
  }
  if (assessment) return getAppointmentTypeLabel("assessment");
  if (physiotherapy && tens) {
    return `${getAppointmentTypeLabel("physiotherapy")} and ${getAppointmentTypeLabel("tens")}`;
  }
  if (physiotherapy) return getAppointmentTypeLabel("physiotherapy");
  if (tens) return getAppointmentTypeLabel("tens");
  return "Not specified";
};
