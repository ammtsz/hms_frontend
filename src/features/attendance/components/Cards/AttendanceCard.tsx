import React from "react";
import {
  AttendanceStatusDetail,
  AttendanceProgression,
  AttendanceType,
} from "@/types/types";
import { IDraggedItem } from "../../types";
import { getTypeBasedStyles } from "../../styles/cardStyles";
import AttendanceTimes from "./AttendanceTimes";
import type { IGroupedPatient } from "../../utils/patientGrouping";
import { useTreatmentsWithSessionRows } from "@/api/query/hooks/useTreatmentsWithSessionRows";
import { usePatientComplaint } from "@/api/query/hooks/usePatientQueries";
import ExpandedTreatmentDetails from "./ExpandedTreatmentDetails";
import ExpandedAssessmentDetails from "./ExpandedAssessmentDetails";
import AttendanceCardBadges from "./AttendanceCardBadges";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";
import { useAttendanceStore } from "@/stores/attendanceStore";
import { useOpenCancellation } from "@/stores/modalStore";
import { IconButton } from "@/components/ui";

interface AttendanceCardProps {
  patient: AttendanceStatusDetail;
  type: AttendanceType;
  status: AttendanceProgression;
  dragged: IDraggedItem | null;
  handleDragStart: (
    type: AttendanceType,
    index: number,
    status: AttendanceProgression,
  ) => void;
  handleDragEnd: () => void;
  index: number;
  isNextToBeAttended?: boolean;
  isDayFinalized?: boolean;
  groupedPatient?: IGroupedPatient;
  onCompletedClick?: (
    attendanceId: number,
    patientId: number,
    patientName: string,
  ) => void;
  // Expansion props
  isExpanded?: boolean;
  onToggleExpansion?: () => void;
}

const AttendanceCard: React.FC<AttendanceCardProps> = React.memo(
  ({
    patient,
    type,
    status,
    dragged,
    handleDragStart,
    handleDragEnd,
    index,
    isNextToBeAttended = false,
    isDayFinalized = false,
    groupedPatient,
    onCompletedClick,
    isExpanded = false,
    onToggleExpansion,
  }) => {
    const isBeingDragged =
      dragged?.patientId === patient.patientId &&
      dragged?.status === status &&
      (dragged?.type === type ||
        (dragged?.isCombinedTreatment &&
          dragged?.treatmentTypes?.includes(type)));

    // Check if attendance is missed or cancelled
    const isMissedOrCancelled = patient.isMissed || patient.isCancelled;
    const isDisabled = isDayFinalized || isMissedOrCancelled;

    // Check if this is a completed assessment consultation that can be viewed
    const isCompletedAssessment =
      status === "completed" && type === "assessment" && !isMissedOrCancelled;
    const isClickable = isCompletedAssessment && onCompletedClick;

    // Expandable card feature
    const isExpandableTreatment =
      (type === "physiotherapy" || type === "tens") && onToggleExpansion;
    // Only allow assessment expansion for non-completed cards (completed cards open modal instead)
    const isExpandableAssessment =
      type === "assessment" && status !== "completed" && onToggleExpansion;
    const isExpandable = isExpandableTreatment || isExpandableAssessment;

    const openCancellation = useOpenCancellation();
    const selectedDate = useAttendanceStore((state) => state.selectedDate);

    const handleDelete = async (
      attendanceIds: number[],
      patientName: string,
    ) => {
      openCancellation(attendanceIds, patientName, selectedDate);
    };

    // Get all attendance IDs for this patient (grouped cards may have multiple)
    const attendanceIds =
      isExpandableTreatment && isExpanded
        ? groupedPatient?.attendanceIds ||
          (patient.attendanceId ? [patient.attendanceId] : [])
        : [];

    const { treatmentsWithSessionRows, isLoading: loadingSessions } =
      useTreatmentsWithSessionRows(
        attendanceIds.length > 0 ? attendanceIds : null,
      );

    // For the delete button, get attendance IDs (for scheduled items)
    const deleteAttendanceIds =
      groupedPatient?.attendanceIds ||
      (patient.attendanceId ? [patient.attendanceId] : []);

    // Fetch patient data when expanded to show main concern
    const { patient: patientData, isLoading: loadingPatient } =
      usePatientComplaint(
        isExpanded && patient.patientId ? patient.patientId : null,
      );

    // Determine styling based on whether this is a grouped patient with combined treatments
    const cardStyles = getTypeBasedStyles(
      groupedPatient ? groupedPatient.combinedType : type,
    );

    // Attendance board shows numeric priority order (1–5), not admin-configured labels.
    const priorityDisplay = patient.priority;

    // Handle card click - expansion for physiotherapy/tens, completion for assessment
    const handleCardClick = () => {
      if (isClickable && patient.attendanceId && patient.patientId) {
        onCompletedClick(patient.attendanceId, patient.patientId, patient.name);
      } else if (isExpandable && !isDisabled) {
        onToggleExpansion();
      }
    };

    return (
      <li
        className={`relative w-full flex flex-col p-2 rounded-lg
        ${cardStyles}
        bg-white text-center font-medium transition-all select-none
        ${isBeingDragged ? "opacity-60" : ""}
        ${isExpanded ? "h-auto" : "h-24"}
        ${
          isDisabled
            ? "opacity-50 cursor-not-allowed"
            : isClickable || isExpandable
              ? "cursor-pointer hover:ring-2 hover:ring-blue-400"
              : "cursor-move"
        }
        ${isMissedOrCancelled ? "bg-gray-200 border-1 border-gray-400" : ""}`}
        draggable={!isDisabled && !isExpanded}
        onDragStart={
          isDisabled || isExpanded
            ? undefined
            : () => handleDragStart(type, index, status)
        }
        onDragEnd={isDisabled || isExpanded ? undefined : handleDragEnd}
        title={
          isClickable
            ? "Click to view completed consultation details"
            : isExpandable
              ? "Click to view treatment details"
              : undefined
        }
      >
        <AttendanceCardBadges
          isMissed={patient.isMissed ?? false}
          isCancelled={patient.isCancelled ?? false}
          isNextToBeAttended={isNextToBeAttended}
          groupedPatient={groupedPatient}
        />

        {/* Card content wrapper */}
        <div
          className="flex items-center justify-center w-full"
          onClick={handleCardClick}
        >
          {/* Tooltip */}
          <span
            className={`flex items-center line-clamp-2 leading-tight px-2 h-20 ${
              isMissedOrCancelled ? "line-through text-gray-600" : ""
            }`}
            title={
              patient.isMissed
                ? `MISSED - ${patient.name} - Priority: ${priorityDisplay}`
                : patient.isCancelled
                  ? `CANCELLED - ${patient.name} - Priority: ${priorityDisplay}`
                  : `${patient.name} - Priority: ${priorityDisplay}`
            }
          >
            <span className="m-auto">
              {status === "checkedIn" && !isMissedOrCancelled
                ? `${index + 1}. `
                : ""}
              {patient.name}
              <span className="text-xs text-gray-600 ml-2">
                P{priorityDisplay}
              </span>
            </span>
          </span>

          {/* Expansion chevron icon for physiotherapy/tens */}
          {isExpandable && !isMissedOrCancelled && (
            <div className="">
              {isExpanded ? (
                <ChevronUp size={16} className="text-gray-600" />
              ) : (
                <ChevronDown size={16} className="text-gray-600" />
              )}
            </div>
          )}
        </div>

        <AttendanceTimes
          status={status}
          checkedInTime={patient.checkedInTime ?? undefined}
          onGoingTime={patient.onGoingTime ?? undefined}
          completedTime={patient.completedTime ?? undefined}
        />

        {/* Expanded treatment details for physiotherapy/tens */}
        {isExpanded && isExpandableTreatment && (
          <div className="w-full" onClick={(e) => e.stopPropagation()}>
            {loadingSessions ? (
              <div className="p-3 bg-gray-50 rounded text-sm text-gray-500 italic">
                Loading treatment details...
              </div>
            ) : (
              <ExpandedTreatmentDetails
                treatmentsWithSessionRows={treatmentsWithSessionRows}
                patientName={patient.name}
                patientId={patient.patientId}
                attendanceId={patient.attendanceId}
                patientData={patientData}
                isCardDisabled={isMissedOrCancelled}
              />
            )}
          </div>
        )}

        {/* Expanded assessment details for assessment consultations */}
        {isExpanded && isExpandableAssessment && (
          <div className="w-full" onClick={(e) => e.stopPropagation()}>
            {loadingPatient ? (
              <div className="p-3 bg-gray-50 rounded text-sm text-gray-500 italic">
                Loading patient information...
              </div>
            ) : (
              <ExpandedAssessmentDetails
                patient={patientData ?? null}
                patientName={patient.name}
                notes={patient.notes}
              />
            )}
          </div>
        )}

        {/* Delete button for scheduled items (not for missed/cancelled) */}
        {status === "scheduled" &&
          patient.attendanceId &&
          !isMissedOrCancelled && (
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(deleteAttendanceIds, patient.name);
              }}
              className="absolute top-1 right-1 z-10"
              title="Manage appointment"
              aria-label="Manage appointment"
            >
              <Settings size={16} aria-hidden />
            </IconButton>
          )}
      </li>
    );
  },
);

AttendanceCard.displayName = "AttendanceCard";

export default AttendanceCard;
