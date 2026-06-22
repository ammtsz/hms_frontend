import React from "react";
import { AlertTriangle, Ban } from "lucide-react";
import { getAttendanceTypeLabel } from "@/utils/apiTransformers";
import { ATTENDANCE_HISTORY_STATUS_LABELS } from "@/utils/attendanceStatusLabels";

export type AttendanceStatus = "completed" | "missed" | "cancelled";

export { ATTENDANCE_HISTORY_STATUS_LABELS } from "@/utils/attendanceStatusLabels";

export interface StatusConfig {
  borderColor: string;
  badgeClass: string;
  icon: React.ReactElement | null;
  label: string;
}

/**
 * Get styling configuration for attendance status
 */
export const getStatusConfig = (status?: string): StatusConfig => {
  switch (status) {
    case "missed":
      return {
        borderColor: "border border-gray-50",
        badgeClass: "bg-red-100 text-red-800 border border-red-300",
        icon: <AlertTriangle size={16} className="inline mr-1" />,
        label: ATTENDANCE_HISTORY_STATUS_LABELS.missed,
      };
    case "cancelled":
      return {
        borderColor: "border border-gray-50",
        badgeClass: "bg-orange-100 text-orange-800 border border-orange-300",
        icon: <Ban size={16} className="inline mr-1" />,
        label: ATTENDANCE_HISTORY_STATUS_LABELS.cancelled,
      };
    default: // completed
      return {
        borderColor: "border-gray-200",
        badgeClass: "bg-green-100 text-green-800 border border-green-300",
        icon: null,
        label: ATTENDANCE_HISTORY_STATUS_LABELS.completed,
      };
  }
};

/**
 * Get treatment type label from grouped attendance
 */
export const getTreatmentTypeLabel = (
  assessment: boolean,
  physiotherapy: boolean,
  tens: boolean,
): string => {
  if (assessment && physiotherapy && tens) {
    return `${getAttendanceTypeLabel("assessment")}, ${getAttendanceTypeLabel("physiotherapy")} and ${getAttendanceTypeLabel("tens")}`;
  }
  if (assessment && physiotherapy) {
    return `${getAttendanceTypeLabel("assessment")} and ${getAttendanceTypeLabel("physiotherapy")}`;
  }
  if (assessment && tens) {
    return `${getAttendanceTypeLabel("assessment")} and ${getAttendanceTypeLabel("tens")}`;
  }
  if (assessment) return getAttendanceTypeLabel("assessment");
  if (physiotherapy && tens) {
    return `${getAttendanceTypeLabel("physiotherapy")} and ${getAttendanceTypeLabel("tens")}`;
  }
  if (physiotherapy) return getAttendanceTypeLabel("physiotherapy");
  if (tens) return getAttendanceTypeLabel("tens");
  return "Not specified";
};
