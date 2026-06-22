import React from "react";
import { AlertTriangle } from "lucide-react";
import {
  getStatusIcon,
  getStatusLabel,
  formatTime,
  formatDate,
} from "@/utils/sessionBreakdownUtils";

export interface SessionRowSession {
  id: number;
  sessionNumber: number;
  plannedSessions?: number;
  scheduledDate: string;
  status: string;
  notes?: string;
  missedReason?: string;
  cancellationReason?: string;
  endTime?: string;
}

interface SessionRowProps {
  session: SessionRowSession;
}

export const SessionRow: React.FC<SessionRowProps> = ({ session }) => {
  return (
    <div
      className={`p-3 bg-white ${
        session.status === "completed"
          ? "border-l-4 border-green-500 rounded"
          : session.status === "missed"
            ? "border-l-4 border-red-500 rounded"
            : session.status === "cancelled"
              ? "border-l-4 border-red-400 rounded"
              : "border-l-4 border-gray-500 rounded"
      }`}
      style={{
        borderBottom: "1px solid #e5e7eb", // Tailwind's gray-200
      }}
    >
      <div className="flex items-start gap-2">
        {getStatusIcon(session.status)}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">
            Session {session.sessionNumber}
            {session.plannedSessions && `/${session.plannedSessions}`} (
            {formatDate(session.scheduledDate)}):{" "}
            {getStatusLabel(session.status)}
          </div>

          {session.notes && (
            <div className="mt-1 text-xs text-gray-700">
              <span className="font-medium">💬 </span>
              {session.notes}
            </div>
          )}

          {session.status === "missed" && session.missedReason && (
            <div className="mt-1 text-xs text-red-700 flex items-start gap-1">
              <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
              <span>
                <span className="font-medium">Reason:</span>{" "}
                {session.missedReason}
              </span>
            </div>
          )}

          {session.status === "cancelled" && session.cancellationReason && (
            <div className="mt-1 text-xs text-red-700 flex items-start gap-1">
              <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
              <span>
                <span className="font-medium">Reason:</span>{" "}
                {session.cancellationReason}
              </span>
            </div>
          )}

          {session.status === "completed" && session.endTime && (
            <div className="mt-1 text-xs text-gray-600">
              Completed at {formatTime(session.endTime)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
