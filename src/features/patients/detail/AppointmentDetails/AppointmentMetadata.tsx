import React from "react";
import { formatDisplayDate } from "@/utils/dateUtils";

interface AppointmentMetadataProps {
  createdDate: string; // YYYY-MM-DD format
  updatedDate: string; // YYYY-MM-DD format
  cancelledDate?: string; // YYYY-MM-DD
}

/**
 * Displays metadata about appointment (created/updated/cancelled dates)
 * - Always shows created date
 * - Shows updated date only if different from created date
 * - Shows cancelled date for cancelled appointments
 */
export const AppointmentMetadata: React.FC<AppointmentMetadataProps> = ({
  createdDate: created,
  updatedDate: updated,
  cancelledDate: cancelled,
}) => {
  const createdDate = created.split("T")[0];
  const updatedDate = updated.split("T")[0];
  const cancelledDate = cancelled?.split("T")[0] || "";

  // Show updated date only if it differs from created date and from cancelled date (if present)
  const showUpdated =
    createdDate !== updatedDate && updatedDate !== cancelledDate;

  // Format date as MM/DD/YYYY for display
  const formatDate = (dateStr: string): string => formatDisplayDate(dateStr);

  return (
    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-1">
      <div>
        <span className="font-medium">Created on:</span>{" "}
        {formatDate(createdDate)}
      </div>
      {showUpdated && (
        <div>
          <span className="font-medium">Updated on:</span>{" "}
          {formatDate(updatedDate)}
        </div>
      )}
      {cancelledDate && (
        <div>
          <span className="font-medium">Cancelled on:</span>{" "}
          {formatDate(cancelledDate)}
        </div>
      )}
    </div>
  );
};
