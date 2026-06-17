import React from "react";

interface AttendanceMetadataProps {
  createdDate: string; // YYYY-MM-DD format
  updatedDate: string; // YYYY-MM-DD format
  cancelledDate?: string; // YYYY-MM-DD
}

/**
 * Displays metadata about attendance (created/updated/cancelled dates)
 * - Always shows created date
 * - Shows updated date only if different from created date
 * - Shows cancelled date for cancelled attendances
 */
export const AttendanceMetadata: React.FC<AttendanceMetadataProps> = ({
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

  // Format date as DD/MM/YYYY for display
  const formatDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-1">
      <div>
        <span className="font-medium">Criado em:</span>{" "}
        {formatDate(createdDate)}
      </div>
      {showUpdated && (
        <div>
          <span className="font-medium">Atualizado em:</span>{" "}
          {formatDate(updatedDate)}
        </div>
      )}
      {cancelledDate && (
        <div>
          <span className="font-medium">Cancelado em:</span>{" "}
          {formatDate(cancelledDate)}
        </div>
      )}
    </div>
  );
};
