import React from "react";
import { Info } from "lucide-react";
import { getTreatmentTypeLabel } from "./utils";

interface AbsenceNoteProps {
  status: "missed" | "cancelled";
  absenceNotes?: string;
  absenceJustified?: boolean;
  hasAssessmentTreatment: boolean;
  hasPhysiotherapyTreatment: boolean;
  hasTensTreatment: boolean;
}

/**
 * Displays absence information for missed or cancelled attendances
 * Shows attendance type, reason, and justification status
 * Updated to match ScheduledAttendancesCard styling pattern
 */
export const AbsenceNote: React.FC<AbsenceNoteProps> = ({
  status,
  absenceNotes,
  absenceJustified,
  hasAssessmentTreatment,
  hasPhysiotherapyTreatment,
  hasTensTreatment,
}) => {
  const treatmentTypeLabel = getTreatmentTypeLabel(
    hasAssessmentTreatment,
    hasPhysiotherapyTreatment,
    hasTensTreatment,
  );

  const defaultMessage =
    status === "missed"
      ? "Falta não justificada"
      : "Cancelamento sem justificativa";

  return (
    <div
      className={`mt-3 p-3 rounded border-l-4 ${status === "missed" ? "bg-red-100 border-red-500" : "bg-orange-100 border-orange-500"}`}
    >
      <div className="flex items-start gap-2">
        <Info
          size={16}
          className={`${status === "missed" ? "text-red-700" : "text-orange-700"} mt-0.5 flex-shrink-0`}
        />
        <div className="text-sm w-full">
          {/* Attendance Type */}
          <div className="mb-2">
            <span className="font-medium text-gray-900">
              Tipo de atendimento:
            </span>
            <span className="text-gray-700 ml-1">{treatmentTypeLabel}</span>
          </div>

          {/* Absence Reason */}
          {absenceNotes ? (
            <>
              <span className="font-medium text-gray-900">
                {absenceJustified ? "Falta justificada:" : "Motivo:"}
              </span>
              <span className="text-gray-700 ml-1">{absenceNotes}</span>
            </>
          ) : (
            <span className="text-gray-700 italic">{defaultMessage}</span>
          )}
        </div>
      </div>
    </div>
  );
};
