import React from "react";
import { SessionCircles } from "./SessionCircles";
import type { PostTreatmentRow } from "./types";
import { Checkbox, Field, Textarea } from "@/components/ui";

interface TreatmentRowProps {
  row: PostTreatmentRow;
  isChecked: boolean;
  cancellationReason: string;
  isSubmitting: boolean;
  onToggle: (appointmentId: number) => void;
  onCancellationReasonChange: (appointmentId: number, value: string) => void;
}

export const TreatmentRow: React.FC<TreatmentRowProps> = ({
  row,
  isChecked,
  cancellationReason,
  isSubmitting,
  onToggle,
  onCancellationReasonChange,
}) => (
  <div className="p-3">
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-start gap-2 cursor-pointer shrink-0">
        <Checkbox
          checked={isChecked}
          onChange={() => onToggle(row.appointmentId)}
          disabled={isSubmitting}
          className="mt-1"
        />
        <span className="text-sm font-medium text-gray-900">
          {row.bodyLocation}
          {row.durationMinutes != null &&
            ` • ${row.durationMinutes} min`}
        </span>
      </label>
      <div className="ml-auto shrink-0">
        <SessionCircles
          sessionStatuses={row.allSessions.map((s) => ({
            sessionNumber: s.sessionNumber,
            status: s.status,
          }))}
          plannedSessions={row.plannedSessions}
          currentSessionNumber={row.sessionNumber}
          currentSessionMarkedAsCompleted={isChecked}
        />
      </div>
    </div>
    {!isChecked && (
      <div className="mt-2 pl-6">
        <Field
          htmlFor={`cancellation-reason-${row.appointmentId}`}
          label="Reason for non-performance (required)"
        >
          <Textarea
            id={`cancellation-reason-${row.appointmentId}`}
            value={cancellationReason}
            onChange={(e) =>
              onCancellationReasonChange(row.appointmentId, e.target.value)
            }
            placeholder="Ex.: Patient did not attend at the scheduled time"
            rows={2}
            maxLength={500}
            disabled={isSubmitting}
          />
        </Field>
      </div>
    )}
  </div>
);
