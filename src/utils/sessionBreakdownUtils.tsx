import React from "react";
import { CheckCircle, XCircle, Clock, Ban } from "lucide-react";
import { SessionResponseDto } from "@/api/types";
import { getAppointmentTypeLabel } from "@/utils/apiTransformers";
import { APPOINTMENT_HISTORY_STATUS_LABELS } from "@/utils/appointmentStatusLabels";
import { formatDisplayDate } from "@/utils/dateUtils";

export const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle size={16} className="text-green-600" />;
    case "missed":
      return <XCircle size={16} className="text-red-600" />;
    case "cancelled":
      return <Ban size={16} className="text-red-600" />;
    case "scheduled":
      return <Clock size={16} className="text-gray-400" />;
    default:
      return null;
  }
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return APPOINTMENT_HISTORY_STATUS_LABELS.completed;
    case "missed":
      return APPOINTMENT_HISTORY_STATUS_LABELS.missed;
    case "scheduled":
      return APPOINTMENT_HISTORY_STATUS_LABELS.scheduled;
    case "cancelled":
      return APPOINTMENT_HISTORY_STATUS_LABELS.cancelled;
    default:
      return status;
  }
};

export const formatTime = (time?: string) => {
  if (!time) return "";
  // Time is in HH:MM:SS format, show HH:MM
  return time.substring(0, 5);
};

/** Format as MM/DD (short US display, no year). */
export const formatDate = (dateStr: string) => {
  const datePart = dateStr.split("T")[0];
  return formatDisplayDate(datePart).slice(0, 5);
};

export const getTreatmentTypeLabel = (type?: string) => {
  if (!type) return "";
  if (type === "physiotherapy") return getAppointmentTypeLabel("physiotherapy");
  if (type === "tens") return getAppointmentTypeLabel("tens");
  return type;
};

export const getTreatmentTypeIcon = (type?: string) => {
  if (!type) return "";
  switch (type) {
    case "physiotherapy":
      return "✨";
    case "tens":
      return "🪄";
    default:
      return "";
  }
};

export type GroupStatus =
  | "completed"
  | "in_progress"
  | "cancelled"
  | "scheduled";

export const determineGroupStatus = (
  sessions: Array<{ status: string }>,
): GroupStatus => {
  const allCompleted = sessions.every((s) => s.status === "completed");
  const allCancelled = sessions.every((s) => s.status === "cancelled");
  const hasCompleted = sessions.some((s) => s.status === "completed");
  const isOngoing = hasCompleted && !allCompleted && !allCancelled;

  if (allCancelled) {
    return "cancelled";
  } else if (allCompleted) {
    return "completed";
  } else if (isOngoing) {
    return "in_progress";
  }
  return "scheduled";
};

export const getStatusDates = (
  sessions: SessionResponseDto[],
  session: SessionResponseDto,
  status: "scheduled" | "cancelled" | "missed",
) => {
  return sessions
    .filter(
      (s) =>
        s.treatmentType === session.treatmentType &&
        s.color === session.color &&
        s.plannedSessions === session.plannedSessions &&
        s.durationMinutes === session.durationMinutes &&
        s.completedSessions === session.completedSessions &&
        s.status === status &&
        s.bodyLocation === session.bodyLocation,
    )
    .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))
    .map((s) => s.scheduledDate.split("T")[0])
    .join("_");
};
