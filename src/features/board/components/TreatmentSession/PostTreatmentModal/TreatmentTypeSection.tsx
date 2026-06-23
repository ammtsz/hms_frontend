import React from "react";
import { getTreatmentTypeLabel, getBorderColor } from "./types";
import { TreatmentRow } from "./TreatmentRow";
import type { PostTreatmentRow } from "./types";

interface TreatmentTypeSectionProps {
  treatmentType: "physiotherapy" | "tens";
  rows: PostTreatmentRow[];
  completedAppointmentIds: Set<number>;
  cancellationReasons: Map<number, string>;
  isSubmitting: boolean;
  onToggle: (appointmentId: number) => void;
  onCancellationReasonChange: (appointmentId: number, value: string) => void;
}

export const TreatmentTypeSection: React.FC<TreatmentTypeSectionProps> = ({
  treatmentType,
  rows,
  completedAppointmentIds,
  cancellationReasons,
  isSubmitting,
  onToggle,
  onCancellationReasonChange,
}) => (
  <div
    className={`border-l-4 ${getBorderColor(treatmentType)} rounded-lg bg-white shadow-sm overflow-hidden`}
    style={{
      borderRight: "1px solid #e5e7eb",
      borderTop: "1px solid #e5e7eb",
      borderBottom: "1px solid #e5e7eb",
    }}
  >
    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
      <span className="font-semibold text-gray-900">
        {getTreatmentTypeLabel(treatmentType)}
      </span>
    </div>
    <div className="divide-y divide-gray-100">
      {rows.map((row) => (
        <TreatmentRow
          key={row.appointmentId}
          row={row}
          isChecked={completedAppointmentIds.has(row.appointmentId)}
          cancellationReason={cancellationReasons.get(row.appointmentId) ?? ""}
          isSubmitting={isSubmitting}
          onToggle={onToggle}
          onCancellationReasonChange={onCancellationReasonChange}
        />
      ))}
    </div>
  </div>
);
