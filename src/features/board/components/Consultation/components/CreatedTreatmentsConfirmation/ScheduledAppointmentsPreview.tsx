import React from "react";
import { formatDisplayDate } from "@/utils/dateUtils";

const MAX_PREVIEW_DATES = 10;

interface ScheduledAppointmentsPreviewProps {
  scheduledDates: Array<{ date: string; time?: string }>;
  createdDate: string;
}

/**
 * ScheduledAppointmentsPreview - Displays preview of scheduled appointments
 */
export const ScheduledAppointmentsPreview: React.FC<
  ScheduledAppointmentsPreviewProps
> = ({ scheduledDates, createdDate }) => {
  return (
    <div className="mt-3 pt-3 border-t border-dashed border-gray-300">
      <div className="mb-2 flex items-center space-x-1 text-xs text-gray-600">
        <span className="text-sm">📅</span>
        {scheduledDates.length === 0 ? (
          <span>All appointments have been completed</span>
        ) : new Date(createdDate) <
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? (
          <span>Incomplete appointments:</span>
        ) : (
          <span>Upcoming appointments:</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {scheduledDates
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, MAX_PREVIEW_DATES)
          .map((dateData, index) => (
            <span
              key={index}
              className="inline-flex flex-col items-start rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700"
            >
              <span>{formatDisplayDate(dateData.date)}</span>
            </span>
          ))}
        {scheduledDates.length > MAX_PREVIEW_DATES && (
          <span className="inline-flex items-center rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
            +{scheduledDates.length - MAX_PREVIEW_DATES} more
          </span>
        )}
      </div>
    </div>
  );
};
