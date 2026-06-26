import React, { useMemo, useState } from "react";
import { TreatmentPlanWithSessionRow } from "@/api/query/hooks/useTreatmentsWithSessionRows";
import { PatientResponseDto, TreatmentResponseDto } from "@/api/types";
import {
  getEditEligibility,
  getUniqueTreatmentPlans,
  groupByTypeDuration,
  groupTreatmentPlansForEdit,
} from "./ExpandedTreatmentDetails.utils";
import EditTreatmentModal from "../TreatmentSession/EditTreatmentModal";
import { Button } from "@/components/ui";

interface ExpandedTreatmentDetailsProps {
  treatmentsWithSessionRows: TreatmentPlanWithSessionRow[];
  patientName: string;
  patientId?: number;
  appointmentId?: number;
  patientData?: PatientResponseDto | null;
  /** When true (missed/cancelled card), editing is disabled regardless of treatment state. */
  isCardDisabled?: boolean;
}

const ExpandedTreatmentDetails: React.FC<ExpandedTreatmentDetailsProps> = ({
  treatmentsWithSessionRows,
  patientName,
  patientId,
  patientData,
  isCardDisabled = false,
}) => {
  const [editModalGroup, setEditModalGroup] = useState<{
    treatmentType: "physiotherapy" | "tens";
    treatmentPlans: TreatmentResponseDto[];
    visitAppointmentId?: number;
  } | null>(null);

  const uniqueTreatmentPlans = useMemo(
    () => getUniqueTreatmentPlans(treatmentsWithSessionRows),
    [treatmentsWithSessionRows],
  );
  const currentScheduledDate = useMemo(
    () => treatmentsWithSessionRows[0]?.sessionRow.scheduledDate,
    [treatmentsWithSessionRows],
  );
  const groups = useMemo(
    () => groupTreatmentPlansForEdit(uniqueTreatmentPlans),
    [uniqueTreatmentPlans],
  );
  const displayGroups = useMemo(
    () => groupByTypeDuration(treatmentsWithSessionRows),
    [treatmentsWithSessionRows],
  );
  const editableGroups = useMemo(
    () =>
      patientId !== undefined
        ? groups.map((treatmentPlans) => ({
            treatmentPlans,
            eligibility: getEditEligibility(
              treatmentPlans,
              currentScheduledDate,
            ),
            treatmentType:
              treatmentPlans[0]?.treatmentType === "physiotherapy"
                ? ("physiotherapy" as const)
                : ("tens" as const),
          }))
        : [],
    [groups, patientId, currentScheduledDate],
  );

  if (!treatmentsWithSessionRows || treatmentsWithSessionRows.length === 0) {
    return (
      <div className="p-3 bg-gray-50 rounded text-sm text-gray-500 italic">
        No treatment session found
      </div>
    );
  }

  const hasMainConcern =
    patientData?.mainConcern && patientData.mainConcern.trim();

  const openEditForGroup = (
    treatmentType: "physiotherapy" | "tens",
    treatmentPlans: TreatmentResponseDto[],
  ) => {
    const firstTreatmentId = treatmentPlans[0]?.id;
    const visitAppointmentId = treatmentsWithSessionRows.find(
      (pair) => pair.treatment.id === firstTreatmentId,
    )?.sessionRow.appointmentId;

    setEditModalGroup({ treatmentType, treatmentPlans, visitAppointmentId });
  };

  return (
    <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
      {editableGroups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {editableGroups.map(
            ({ treatmentType, treatmentPlans, eligibility }) => {
              const canEdit = eligibility.canEdit;
              const tooltip = isCardDisabled
                ? "This appointment is not active and cannot be edited."
                : canEdit
                  ? "Edit treatment"
                  : eligibility.reason === "hasCompletedSessions"
                    ? "This treatment already has completed sessions and can no longer be edited."
                    : eligibility.reason === "notEffectiveFirstDay"
                      ? "Make necessary edits on the first effective day of treatment."
                      : "This treatment cannot be edited at this moment.";
              return (
                <Button
                  key={`edit-${treatmentType}-${treatmentPlans.map((t) => t.id).join("-")}`}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={
                    !isCardDisabled && canEdit
                      ? () => openEditForGroup(treatmentType, treatmentPlans)
                      : undefined
                  }
                  disabled={isCardDisabled || !canEdit}
                  title={tooltip}
                  className="w-full"
                >
                  Edit{" "}
                  {treatmentType === "physiotherapy" ? "Physiotherapy" : "TENS"}
                </Button>
              );
            },
          )}
        </div>
      )}

      {editModalGroup && patientId !== undefined && (
        <EditTreatmentModal
          isOpen={!!editModalGroup}
          onClose={() => setEditModalGroup(null)}
          treatmentType={editModalGroup.treatmentType}
          treatmentPlans={editModalGroup.treatmentPlans}
          patientId={patientId}
          patientName={patientName}
          onSuccess={() => setEditModalGroup(null)}
          currentAppointmentId={editModalGroup.visitAppointmentId}
        />
      )}

      {hasMainConcern && (
        <div className="bg-blue-50 rounded-lg p-3 text-sm border border-blue-200">
          <div className="font-semibold text-blue-900 mb-1">Main concern</div>
          <div className="text-blue-800 whitespace-pre-wrap">
            {patientData.mainConcern}
          </div>
        </div>
      )}

      {displayGroups.map((group, groupIndex) => (
        <div
          key={`${group.treatmentType}-${group.durationMinutes ?? ""}-${group.sessionNumber}-${group.plannedSessions}-${groupIndex}`}
          className="bg-gray-50 rounded-lg p-3 text-sm space-y-2"
        >
          <div>
            <span className="font-semibold text-gray-700">
              {group.treatmentType === "physiotherapy"
                ? "Physiotherapy"
                : "TENS"}
              {" – Session "}
              {group.sessionNumber}/{group.plannedSessions}
            </span>
          </div>

          <div>
            <span className="text-gray-700 font-semibold">
              {group.bodyLocations.length === 1 ? "Location: " : "Locations: "}
            </span>
            <span className="text-gray-800 font-normal">
              {group.bodyLocations.join(", ")}
            </span>
          </div>

          {group.durationMinutes != null && (
            <div>
              <span className="text-gray-700 font-semibold">Duration: </span>
              <span className="text-gray-800 font-normal">
                {group.durationMinutes}{" "}
                {group.durationMinutes === 1 ? "minute" : "minutes"}
              </span>
            </div>
          )}

          {group.notes && (
            <div className="text-xs text-gray-600 italic border-t border-gray-200 pt-2 mt-2">
              {group.notes}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ExpandedTreatmentDetails;
