import React from "react";
import {
  Calendar,
  CheckCircle2,
  CircleX,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";
import { AppointmentStatus } from "@/api/types";

const STATUS_ICON_CONFIG: Record<
  AppointmentStatus,
  {
    Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
    className: string;
  }
> = {
  [AppointmentStatus.SCHEDULED]: {
    Icon: Calendar,
    className: "text-blue-600",
  },
  [AppointmentStatus.CHECKED_IN]: {
    Icon: UserCheck,
    className: "text-yellow-600",
  },
  [AppointmentStatus.IN_PROGRESS]: {
    Icon: Clock,
    className: "text-yellow-600",
  },
  [AppointmentStatus.COMPLETED]: {
    Icon: CheckCircle2,
    className: "text-green-600",
  },
  [AppointmentStatus.CANCELLED]: {
    Icon: CircleX,
    className: "text-red-600",
  },
  [AppointmentStatus.MISSED]: {
    Icon: UserX,
    className: "text-red-600",
  },
};

interface ScheduleAppointmentStatusIconProps {
  status: AppointmentStatus;
  className?: string;
}

const ScheduleAppointmentStatusIcon: React.FC<ScheduleAppointmentStatusIconProps> = ({
  status,
  className = "h-5 w-5 shrink-0",
}) => {
  const { Icon, className: colorClass } = STATUS_ICON_CONFIG[status];
  return <Icon className={`${className} ${colorClass}`} aria-hidden />;
};

export default ScheduleAppointmentStatusIcon;

export const SCHEDULE_STATUS_LEGEND_ITEMS: Array<{
  status: AppointmentStatus;
  label: string;
}> = [
  { status: AppointmentStatus.SCHEDULED, label: "Scheduled" },
  { status: AppointmentStatus.CHECKED_IN, label: "Checked-in" },
  { status: AppointmentStatus.IN_PROGRESS, label: "In progress" },
  { status: AppointmentStatus.COMPLETED, label: "Completed" },
  { status: AppointmentStatus.CANCELLED, label: "Cancelled" },
  { status: AppointmentStatus.MISSED, label: "Missed" },
];
