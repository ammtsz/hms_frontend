import React from "react";
import type { SessionAppointmentStatus } from "@/api/types";

interface SessionCirclesProps {
  /** Session numbers and statuses for circles, ordered by sessionNumber */
  sessionStatuses: Array<{
    sessionNumber: number;
    status: SessionAppointmentStatus;
  }>;
  plannedSessions: number;
  /** Session number of the row for this appointment (being completed/cancelled) */
  currentSessionNumber: number;
  /** When true, the current session circle is green (will be completed); when false, red (will be cancelled) */
  currentSessionMarkedAsCompleted: boolean;
}

const statusToColor = (status: SessionAppointmentStatus): string => {
  switch (status) {
    case "completed":
      return "bg-green-500";
    case "cancelled":
    case "missed":
      return "bg-red-500";
    default:
      return "bg-gray-300";
  }
};

export const SessionCircles: React.FC<SessionCirclesProps> = ({
  sessionStatuses,
  plannedSessions,
  currentSessionNumber,
  currentSessionMarkedAsCompleted,
}) => {
  const statusByNumber = new Map(
    sessionStatuses.map((s) => [s.sessionNumber, s.status]),
  );
  const completedCount = sessionStatuses.filter(
    (s) => s.status === "completed",
  ).length;

  const getCircleColor = (num: number): string => {
    if (num === currentSessionNumber) {
      return currentSessionMarkedAsCompleted ? "bg-green-500" : "bg-red-500";
    }
    const status = statusByNumber.get(num) ?? "scheduled";
    return statusToColor(status);
  };

  const completedSessions =
    completedCount + (currentSessionMarkedAsCompleted ? 1 : 0);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1">
        {Array.from({ length: plannedSessions }, (_, i) => i + 1).map((num) => {
          const status =
            num === currentSessionNumber
              ? currentSessionMarkedAsCompleted
                ? "completed"
                : "cancelled"
              : (statusByNumber.get(num) ?? "scheduled");
          return (
            <div
              key={num}
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${getCircleColor(num)}`}
              title={`Session ${num}: ${status}`}
            />
          );
        })}
      </div>
      <div className="text-xs text-gray-600">
        Session {currentSessionNumber} of {plannedSessions}
      </div>
      {completedCount > 0 && (
        <div className="text-xs text-gray-500">
          {completedSessions}{" "}
          {completedSessions === 1 ? "session completed" : "completed sessions"}
        </div>
      )}
    </div>
  );
};
