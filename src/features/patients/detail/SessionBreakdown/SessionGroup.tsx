import React from "react";
import { TreatmentCompletionBadge } from "./TreatmentCompletionBadge";
import { SessionRow } from "./SessionRow";
import { SessionGroup as SessionGroupType } from "./hooks/useSessionBreakdown";
import {
  getTreatmentTypeIcon,
  getTreatmentTypeLabel,
  determineGroupStatus,
} from "@/utils/sessionBreakdownUtils";
import { formatNotes } from "@/utils/attendanceHistoryUtils";

interface SessionGroupProps {
  group: SessionGroupType;
  groupIndex: number;
}

export const SessionGroup: React.FC<SessionGroupProps> = ({ group }) => {
  const groupCompletedCount = group.sessions.filter(
    (s) => s.status === "completed",
  ).length;

  // Prefer treatment session status from API; otherwise infer from session rows in the group
  const groupStatus =
    group.sessions[0]?.treatmentStatus ?? determineGroupStatus(group.sessions);

  return (
    <div
      className={`rounded-lg overflow-hidden border
        ${groupStatus === "cancelled" ? "border-red-400" : "border-gray-300"}`}
    >
      {/* Group Header */}
      <div
        className={`px-3 py-2 border-b
          ${
            groupStatus === "completed"
              ? "bg-green-50 border-gray-200"
              : groupStatus === "cancelled"
                ? "bg-red-100 border-red-300"
                : "bg-gray-50 border-gray-200"
          }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-gray-800">
              {getTreatmentTypeIcon(group.treatmentType)}
              <span
                className={
                  group.treatmentType === "physiotherapy"
                    ? "text-yellow-600"
                    : "text-blue-600"
                }
              >
                {getTreatmentTypeLabel(group.treatmentType)}
              </span>
              {group.plannedSessions ? (
                <span className="text-xs text-gray-600">
                  ({groupCompletedCount}/{group.plannedSessions} sessões)
                </span>
              ) : null}
            </div>
            <p className="break-words text-sm text-gray-800">
              {group.locations.join(", ").toUpperCase()}
              {group.color ? ` • ${group.color.toUpperCase()}` : ""}
            </p>
          </div>
          <div className="shrink-0 self-start">
            <TreatmentCompletionBadge
              completionPercentage={
                group.plannedSessions
                  ? Math.round(
                      (groupCompletedCount / group.plannedSessions) * 100,
                    )
                  : 0
              }
              status={groupStatus}
              size="sm"
              showCompletionPercentage={false}
            />
          </div>
        </div>
      </div>

      {/* Cancellation Reason */}
      {group.cancellationReason && groupStatus === "cancelled" && (
        <div className="bg-red-50 p-3 border-b border-red-200">
          <p className="text-sm text-red-800">
            <span className="font-medium">Motivo do Cancelamento:</span>
            <span className="ml-1 whitespace-pre-line">
              {formatNotes(group.cancellationReason)}
            </span>
          </p>
        </div>
      )}

      {/* Treatment Session Notes */}
      {group.treatmentNotes && (
        <div className="bg-white p-3 border-b border-gray-200">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Notas do Tratamento:</span>{" "}
            {group.treatmentNotes}
          </p>
        </div>
      )}

      {/* Sessions in this group */}
      <div className="divide-y divide-gray-200">
        {group.sessions.map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
};
