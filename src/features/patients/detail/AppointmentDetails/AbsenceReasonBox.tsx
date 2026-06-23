import React from "react";
import { Info } from "lucide-react";
import { getAbsenceStyles, type AbsenceStatus } from "@/utils/absenceStyles";
import { formatNotes } from "@/utils/appointmentHistoryUtils";

interface AbsenceReasonBoxProps {
  status: AbsenceStatus;
  reason: string;
  isJustified?: boolean;
}

/**
 * Displays absence/cancellation reason with appropriate styling
 * Used in both AppointmentHistory and ScheduledAppointments
 */
export const AbsenceReasonBox: React.FC<AbsenceReasonBoxProps> = ({
  status,
  reason,
  isJustified = false,
}) => {
  if (status === "none" && !reason) return null;

  const styles = getAbsenceStyles(status);

  const label =
    status === "missed"
      ? isJustified
        ? "Justified absence:"
        : "Reason:"
      : status === "cancelled"
        ? "Reason:"
        : "Notes:";

  return (
    <div
      className={`mb-3 p-3 ${styles.reasonBoxClass} border-l-4 ${styles.reasonBorderClass} rounded`}
    >
      <div className="flex items-start gap-2">
        {status !== "none" && (
          <Info
            size={16}
            className={`${styles.iconColor} mt-0.5 flex-shrink-0`}
          />
        )}
        <div className="text-sm">
          <span className="font-medium text-gray-900">{label}</span>
          <span className="text-gray-700 ml-1 whitespace-pre-line">
            {formatNotes(reason) || "Not justified"}
          </span>
        </div>
      </div>
    </div>
  );
};
