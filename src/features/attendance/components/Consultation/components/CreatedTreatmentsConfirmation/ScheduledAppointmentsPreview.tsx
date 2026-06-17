import React from "react";
import { formatDateBR } from "@/utils/dateUtils";

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
    <div className="mt-3 pt-3 border-t border-gray-300 border-dashed">
      <div className="text-xs text-gray-600 mb-2 flex items-center space-x-1">
        <span className="text-sm">📅</span>
        {scheduledDates.length === 0 ? (
          <span>Todos os agendamentos foram concluídos</span>
        ) : new Date(createdDate) <
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? (
          <span>Agendamentos não concluídos:</span>
        ) : (
          <span>Próximos agendamentos:</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {scheduledDates
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, MAX_PREVIEW_DATES)
          .map((dateData, index) => (
            <span
              key={index}
              className="inline-flex flex-col items-start px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200"
            >
              <span>{formatDateBR(dateData.date)}</span>
            </span>
          ))}
        {scheduledDates.length > MAX_PREVIEW_DATES && (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
            +{scheduledDates.length - MAX_PREVIEW_DATES} mais
          </span>
        )}
      </div>
    </div>
  );
};
