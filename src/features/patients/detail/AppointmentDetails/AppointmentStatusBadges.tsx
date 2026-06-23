import React from "react";
import { type AbsenceStatus } from "@/utils/absenceStyles";
import { APPOINTMENT_HISTORY_STATUS_LABELS } from "@/utils/appointmentStatusLabels";

interface StatusBadge {
  label: string;
  className: string;
}

interface AppointmentStatusBadgesProps {
  absenceStatus: AbsenceStatus;
  appointmentStatus?: string;
  statusConfig?: {
    label: string;
    badgeClass: string;
    icon: React.ReactNode;
  };
  isUpcoming?: boolean;
  isNextAppointment?: boolean;
}

/**
 * Displays status badges for appointment items
 * Handles cancelled, missed, scheduled, completed, and other statuses
 */
export const AppointmentStatusBadges: React.FC<AppointmentStatusBadgesProps> = ({
  absenceStatus,
  appointmentStatus,
  statusConfig,
  isUpcoming = false,
  isNextAppointment = false,
}) => {
  const badges: StatusBadge[] = [];

  // Add primary status badge (not shown for absences in history)
  if (absenceStatus === "none" && statusConfig) {
    badges.push({
      label: statusConfig.label,
      className: statusConfig.badgeClass,
    });
  }

  // Add scheduled appointment badges (only for scheduled status)
  if (appointmentStatus === "scheduled" || appointmentStatus === "checked_in") {
    if (isNextAppointment) {
      badges.push({
        label: APPOINTMENT_HISTORY_STATUS_LABELS.next,
        className: "bg-green-100 text-green-800 border border-green-200",
      });
    } else if (isUpcoming) {
      badges.push({
        label: APPOINTMENT_HISTORY_STATUS_LABELS.soon,
        className: "bg-orange-100 text-orange-800 border border-orange-200",
      });
    }

    // Always show "Scheduled" badge for scheduled status (unless cancelled)
    if (absenceStatus === "none") {
      badges.push({
        label: APPOINTMENT_HISTORY_STATUS_LABELS.scheduled,
        className: "bg-gray-200 text-gray-800 border border-gray-300",
      });
    }
  }

  // Add absence badges
  if (absenceStatus === "cancelled") {
    badges.push({
      label: APPOINTMENT_HISTORY_STATUS_LABELS.cancelled,
      className: "bg-orange-200 text-orange-900 border border-orange-400",
    });
  } else if (absenceStatus === "missed") {
    badges.push({
      label: APPOINTMENT_HISTORY_STATUS_LABELS.missed,
      className: "bg-red-200 text-red-900 border border-red-400",
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {badges.map((badge, index) => (
        <span
          key={index}
          className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
};
