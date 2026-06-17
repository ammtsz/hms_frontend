import React from "react";
import {
  AttendanceProgression,
  AttendanceType,
  AttendanceStatusDetail,
} from "@/types/types";
import { IDraggedItem } from "../../types";
import AttendanceCard from "../Cards/AttendanceCard";
import { getStatusColor, getStatusLabel } from "../../styles/cardStyles";
import {
  countTreatmentTypes,
  type IGroupedPatient,
} from "../../utils/patientGrouping";

interface PatientWithType extends AttendanceStatusDetail {
  originalType: AttendanceType;
}

interface AttendanceColumnProps {
  status: AttendanceProgression;
  patients: (PatientWithType | IGroupedPatient)[];
  dragged: IDraggedItem | null;
  handleDragStart: (
    type: AttendanceType,
    index: number,
    status: AttendanceProgression,
    patientId?: number,
  ) => void;
  handleDragEnd: () => void;
  handleDrop: () => void;
  isDayFinalized?: boolean;
  onCompletedClick?: (
    attendanceId: number,
    patientId: number,
    patientName: string,
  ) => void;
  // Expansion props
  expandedCardId?: number | null;
  onToggleExpansion?: (patientId: number) => void;
}

const AttendanceColumn: React.FC<AttendanceColumnProps> = React.memo(
  ({
    status,
    patients,
    dragged,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    isDayFinalized = false,
    onCompletedClick,
    expandedCardId,
    onToggleExpansion,
  }) => {
    // Sort patients by priority (1 = highest) then by check-in time (earliest first, only for checked-in column)
    const sortedPatients = React.useMemo(() => {
      return [...patients].sort((a, b) => {
        // First, sort by priority (1 = highest priority)
        const priorityA = parseInt(a.priority);
        const priorityB = parseInt(b.priority);

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        // If same priority and column is "scheduled", sort alphabetically by name and leave missed or cancelled at the end
        if (status === "scheduled") {
          const aIsMissedOrCancelled = a.isMissed || a.isCancelled;
          const bIsMissedOrCancelled = b.isMissed || b.isCancelled;

          if (aIsMissedOrCancelled && !bIsMissedOrCancelled) {
            return 1;
          } else if (!aIsMissedOrCancelled && bIsMissedOrCancelled) {
            return -1;
          }
          return a.name.localeCompare(b.name);
        }
        // If same priority and column is "checkedIn", sort by check-in time (earliest first)
        // checkedInTime is in HH:MM:SS format, which is naturally sortable as strings
        if (status === "checkedIn" && a.checkedInTime && b.checkedInTime) {
          return a.checkedInTime.localeCompare(b.checkedInTime);
        }
        if (status === "completed") {
          return a.name.localeCompare(b.name);
        }

        return 0;
      });
    }, [patients, status]);

    // Get type counts for the legend
    const typeCounts = React.useMemo(
      () =>
        patients.reduce(
          (acc, patient) => {
            // Check if this is a grouped patient with combined treatments
            if ("combinedType" in patient && "treatmentTypes" in patient) {
              const groupedPatient = patient as IGroupedPatient;
              const cardCounts = countTreatmentTypes(
                groupedPatient.treatmentTypes,
              );
              acc.physiotherapy =
                (acc.physiotherapy || 0) + cardCounts.physiotherapy;
              acc.tens = (acc.tens || 0) + cardCounts.tens;
            } else {
              // Regular patient with single treatment type
              const regularPatient = patient as PatientWithType;
              acc[regularPatient.originalType] =
                (acc[regularPatient.originalType] || 0) + 1;
            }
            return acc;
          },
          {} as Record<AttendanceType, number>,
        ),
      [patients],
    );

    // Check if we should show the legend (only for non-assessment types)
    const shouldShowLegend = patients.some(
      (p) => p.originalType !== "assessment",
    );

    return (
      <div className="min-h-[100px] w-full min-w-0">
        {/* Title outside the dashed box */}
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-semibold ${getStatusColor(status)}`}>
            {getStatusLabel(status)}
          </h3>
          {/* Dynamic legend based on available types - only show for non-assessment */}
          {shouldShowLegend && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {typeCounts.physiotherapy > 0 && (
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-400 rounded"></div>(
                  {typeCounts.physiotherapy})
                </span>
              )}
              {typeCounts.tens > 0 && (
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>(
                  {typeCounts.tens})
                </span>
              )}
              {typeCounts.combined > 0 && (
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>(
                  {typeCounts.combined})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Grey dashed box for drag and drop */}
        <div
          className="bg-gray-100 p-4 rounded-lg border-2 border-dashed border-gray-300 min-h-[100px] h-[calc(100%-2rem)] max-h-[800px] overflow-auto"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="space-y-2">
            {sortedPatients.map((patient, index) => {
              // Determine the original type to use for the card
              const originalType =
                "originalType" in patient
                  ? (patient as PatientWithType).originalType
                  : "physiotherapy"; // Default fallback for grouped patients

              return (
                <AttendanceCard
                  key={`${originalType}-${
                    patient.attendanceId || patient.name
                  }-${index}`}
                  patient={patient}
                  type={originalType}
                  status={status}
                  dragged={dragged}
                  handleDragStart={(type, idx, status) =>
                    handleDragStart(type, idx, status, patient.patientId)
                  }
                  handleDragEnd={handleDragEnd}
                  index={index}
                  isNextToBeAttended={status === "checkedIn" && index === 0}
                  isDayFinalized={isDayFinalized}
                  groupedPatient={
                    "combinedType" in patient
                      ? (patient as IGroupedPatient)
                      : undefined
                  }
                  onCompletedClick={onCompletedClick}
                  isExpanded={expandedCardId === patient.patientId}
                  onToggleExpansion={
                    onToggleExpansion && patient.patientId
                      ? () => onToggleExpansion(patient.patientId!)
                      : undefined
                  }
                />
              );
            })}

            {sortedPatients.length === 0 && (
              <div className="text-gray-400 text-center py-8 text-sm italic">
                Arraste para mover
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

AttendanceColumn.displayName = "AttendanceColumn";

export default AttendanceColumn;
