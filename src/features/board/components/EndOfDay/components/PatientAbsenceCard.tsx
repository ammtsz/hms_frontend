import React from "react";
import type { AbsenceJustification } from "../types";
import type { AppointmentType } from "@/types/types";
import type { GroupedAbsence } from "../hooks/useAbsenceJustification";
import { getAppointmentTypeLabel } from "@/utils/apiTransformers";
import { JustificationSection } from "./JustificationSection";
import { Checkbox } from "@/components/ui";

interface PatientAbsenceCardProps {
  group: GroupedAbsence;
  applyToAll: boolean;
  formatAbsencesList: (group: GroupedAbsence) => string;
  getJustificationForType: (
    patientId: number,
    appointmentType: "assessment" | "treatments" | "all",
  ) => AbsenceJustification | undefined;
  handleJustificationChange: (
    patientId: number,
    appointmentType: AppointmentType | "all" | "treatments",
    justified: boolean,
    justification?: string,
  ) => void;
  toggleApplyToAll: (patientId: number) => void;
}

export const PatientAbsenceCard: React.FC<PatientAbsenceCardProps> = ({
  group,
  applyToAll,
  formatAbsencesList,
  getJustificationForType,
  handleJustificationChange,
  toggleApplyToAll,
}) => {
  const hasMultipleTypes =
    group.assessment.length > 0 && group.treatments.length > 0;

  return (
    <div
      key={group.patientId}
      className="border border-gray-200 rounded-md p-4 bg-white"
    >
      <div className="space-y-4">
        {/* Patient header */}
        <div>
          <h4 className="text-sm font-medium text-gray-900">
            {group.patientName}
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            {formatAbsencesList(group)}
          </p>
        </div>

        {/* Apply to all checkbox */}
        {hasMultipleTypes && (
          <label className="flex items-center">
            <Checkbox
              checked={applyToAll}
              onChange={() => toggleApplyToAll(group.patientId)}
            />
            <span className="ml-2 text-sm text-gray-700">
              Apply justification to all appointments
            </span>
          </label>
        )}

        {/* Justification sections */}
        {applyToAll || !hasMultipleTypes ? (
          <JustificationSection
            patientId={group.patientId}
            sectionType="all"
            sectionLabel={null}
            justification={getJustificationForType(group.patientId, "all")}
            onJustificationChange={handleJustificationChange}
          />
        ) : (
          <div className="space-y-4">
            {group.assessment.length > 0 && (
              <JustificationSection
                patientId={group.patientId}
                sectionType="assessment"
                sectionLabel={getAppointmentTypeLabel("assessment")}
                justification={getJustificationForType(
                  group.patientId,
                  "assessment",
                )}
                onJustificationChange={handleJustificationChange}
              />
            )}

            {group.treatments.length > 0 && (
              <JustificationSection
                patientId={group.patientId}
                sectionType="treatments"
                sectionLabel={formatAbsencesList({
                  ...group,
                  assessment: [],
                })}
                justification={getJustificationForType(
                  group.patientId,
                  "treatments",
                )}
                onJustificationChange={handleJustificationChange}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
