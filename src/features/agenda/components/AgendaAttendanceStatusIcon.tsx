import React from "react";
import {
  Calendar,
  CheckCircle2,
  CircleX,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";
import { AttendanceStatus } from "@/api/types";

const STATUS_ICON_CONFIG: Record<
  AttendanceStatus,
  {
    Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
    className: string;
  }
> = {
  [AttendanceStatus.SCHEDULED]: {
    Icon: Calendar,
    className: "text-blue-600",
  },
  [AttendanceStatus.CHECKED_IN]: {
    Icon: UserCheck,
    className: "text-yellow-600",
  },
  [AttendanceStatus.IN_PROGRESS]: {
    Icon: Clock,
    className: "text-yellow-600",
  },
  [AttendanceStatus.COMPLETED]: {
    Icon: CheckCircle2,
    className: "text-green-600",
  },
  [AttendanceStatus.CANCELLED]: {
    Icon: CircleX,
    className: "text-red-600",
  },
  [AttendanceStatus.MISSED]: {
    Icon: UserX,
    className: "text-red-600",
  },
};

interface AgendaAttendanceStatusIconProps {
  status: AttendanceStatus;
  className?: string;
}

const AgendaAttendanceStatusIcon: React.FC<AgendaAttendanceStatusIconProps> = ({
  status,
  className = "h-5 w-5 shrink-0",
}) => {
  const { Icon, className: colorClass } = STATUS_ICON_CONFIG[status];
  return <Icon className={`${className} ${colorClass}`} aria-hidden />;
};

export default AgendaAttendanceStatusIcon;

export const AGENDA_STATUS_LEGEND_ITEMS: Array<{
  status: AttendanceStatus;
  label: string;
}> = [
  { status: AttendanceStatus.SCHEDULED, label: "Agendado" },
  { status: AttendanceStatus.CHECKED_IN, label: "Checked-in" },
  { status: AttendanceStatus.IN_PROGRESS, label: "Em andamento" },
  { status: AttendanceStatus.COMPLETED, label: "Concluído" },
  { status: AttendanceStatus.CANCELLED, label: "Cancelado" },
  { status: AttendanceStatus.MISSED, label: "Falta" },
];
