import React from "react";
import { Ban, AlertTriangle } from "lucide-react";
import { formatDisplayDate } from "@/utils/dateUtils";
import {
  getAbsenceStyles,
  getAbsenceStatus,
  type AbsenceStatus,
} from "@/utils/absenceStyles";

interface AttendanceDateHeaderProps {
  date: string;
  status: string;
  treatmentTypeLabel: string;
  daysUntilText?: string; // Optional: "today", "tomorrow", "in 5 days"
}

/**
 * Displays attendance date with status icons and treatment type
 * Handles styling for cancelled/missed statuses
 */
export const AttendanceDateHeader: React.FC<AttendanceDateHeaderProps> = ({
  date,
  status,
  treatmentTypeLabel,
  daysUntilText,
}) => {
  const absenceStatus: AbsenceStatus = getAbsenceStatus(status);
  const styles = getAbsenceStyles(absenceStatus);

  return (
    <div className="min-w-0 flex-1">
      <div>
        <div className={`font-medium break-words ${styles.dateClass}`}>
          {absenceStatus === "cancelled" && (
            <Ban size={16} className={`inline mr-1 ${styles.iconColor}`} />
          )}
          {absenceStatus === "missed" && (
            <AlertTriangle
              size={16}
              className={`inline mr-1 ${styles.iconColor}`}
            />
          )}
          {formatDisplayDate(date)}
          {daysUntilText && absenceStatus === "none" && (
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({daysUntilText})
            </span>
          )}
          {absenceStatus === "cancelled" && (
            <span className={`ml-2 text-sm font-normal ${styles.labelColor}`}>
              (CANCELLED)
            </span>
          )}
          {absenceStatus === "missed" && (
            <span className={`ml-2 text-sm font-normal ${styles.labelColor}`}>
              (MISSED)
            </span>
          )}
        </div>
        <div className={`text-sm ${styles.treatmentClass}`}>
          {treatmentTypeLabel}
        </div>
      </div>
    </div>
  );
};
