import React from "react";
import { type AbsenceStatus } from "@/utils/absenceStyles";

interface StatusBadge {
  label: string;
  className: string;
}

interface AttendanceStatusBadgesProps {
  absenceStatus: AbsenceStatus;
  attendanceStatus?: string;
  statusConfig?: {
    label: string;
    badgeClass: string;
    icon: React.ReactNode;
  };
  isUpcoming?: boolean;
  isNextAppointment?: boolean;
}

/**
 * Displays status badges for attendance items
 * Handles cancelled, missed, scheduled, completed, and other statuses
 */
export const AttendanceStatusBadges: React.FC<AttendanceStatusBadgesProps> = ({
  absenceStatus,
  attendanceStatus,
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
  if (attendanceStatus === "scheduled" || attendanceStatus === "checked_in") {
    if (isNextAppointment) {
      badges.push({
        label: "Próximo",
        className: "bg-green-100 text-green-800 border border-green-200",
      });
    } else if (isUpcoming) {
      badges.push({
        label: "Em breve",
        className: "bg-orange-100 text-orange-800 border border-orange-200",
      });
    }

    // Always show "Agendado" badge for scheduled status (unless cancelled)
    if (absenceStatus === "none") {
      badges.push({
        label: "Agendado",
        className: "bg-gray-200 text-gray-800 border border-gray-300",
      });
    }
  }

  // Add absence badges
  if (absenceStatus === "cancelled") {
    badges.push({
      label: "Cancelado",
      className: "bg-orange-200 text-orange-900 border border-orange-400",
    });
  } else if (absenceStatus === "missed") {
    badges.push({
      label: "Falta",
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
