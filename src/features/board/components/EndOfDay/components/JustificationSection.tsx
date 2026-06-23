import React from "react";
import type { AbsenceJustification } from "../types";
import type { AppointmentType } from "@/types/types";
import { Field, Radio, Textarea } from "@/components/ui";

interface JustificationSectionProps {
  patientId: number;
  sectionType: "all" | "assessment" | "treatments";
  sectionLabel: string | null;
  justification?: AbsenceJustification;
  onJustificationChange: (
    patientId: number,
    appointmentType: AppointmentType | "all" | "treatments",
    justified: boolean,
    justification?: string,
  ) => void;
}

export const JustificationSection: React.FC<JustificationSectionProps> = ({
  patientId,
  sectionType,
  sectionLabel,
  justification,
  onJustificationChange,
}) => {
  return (
    <div
      className={sectionLabel ? "border border-gray-300 rounded-md p-3" : ""}
    >
      {sectionLabel && (
        <h5 className="text-sm font-medium text-gray-700 mb-2">
          {sectionLabel}
        </h5>
      )}

      <div className="space-y-3">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <Radio
              name={`absence-${patientId}-${sectionType}`}
              checked={justification?.justified === true}
              onChange={() =>
                onJustificationChange(patientId, sectionType, true)
              }
            />
            <span className="ml-2 text-sm text-gray-700">
              Justified absence
            </span>
          </label>
          <label className="flex items-center">
            <Radio
              name={`absence-${patientId}-${sectionType}`}
              checked={justification?.justified === false}
              onChange={() =>
                onJustificationChange(patientId, sectionType, false)
              }
            />
            <span className="ml-2 text-sm text-gray-700">
              Unjustified absence
            </span>
          </label>
        </div>

        {justification?.justified === true && (
          <Field
            label="Justification"
            htmlFor={`justification-${patientId}-${sectionType}`}
          >
            <Textarea
              id={`justification-${patientId}-${sectionType}`}
              value={justification.justification || ""}
              onChange={(e) =>
                onJustificationChange(
                  patientId,
                  sectionType,
                  true,
                  e.target.value,
                )
              }
              placeholder="Describe the reason for the absence..."
              rows={2}
            />
          </Field>
        )}
      </div>
    </div>
  );
};
