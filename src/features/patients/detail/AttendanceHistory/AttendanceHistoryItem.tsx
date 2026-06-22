import React, { useState } from "react";
import { GroupedAttendance } from "@/utils/attendanceHistoryUtils";
import { TreatmentResponseDto } from "@/api/types";
import type { Status } from "@/types/types";
import { getStatusConfig, getTreatmentTypeLabel } from "./utils";
import {
  getAbsenceStyles,
  getAbsenceStatus,
  isAbsence,
} from "@/utils/absenceStyles";
import { AttendanceDateHeader } from "@/features/patients/detail/AttendanceDetails/AttendanceDateHeader";
import { AttendanceStatusBadges } from "@/features/patients/detail/AttendanceDetails/AttendanceStatusBadges";
import { AbsenceReasonBox } from "@/features/patients/detail/AttendanceDetails/AbsenceReasonBox";
import { PhysiotherapyDetails } from "@/features/patients/detail/AttendanceDetails/PhysiotherapyDetails";
import { TensDetails } from "@/features/patients/detail/AttendanceDetails/TensDetails";
import { AssessmentDetails } from "@/features/patients/detail/AttendanceDetails/AssessmentDetails";
import { TreatmentDetailsContainer } from "@/features/patients/detail/AttendanceDetails/TreatmentDetailsContainer";
import { NotesBox } from "@/features/patients/detail/AttendanceDetails/helpers/treatmentHelpers";
import { AttendanceMetadata } from "@/features/patients/detail/AttendanceDetails/AttendanceMetadata";
import { RescheduleAttendanceModal } from "./RescheduleAttendanceModal";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui";

interface AttendanceHistoryItemProps {
  groupedAttendance: GroupedAttendance;
  /** Treatment plans for the patient (`TreatmentResponseDto[]`). */
  treatments: TreatmentResponseDto[];
  patientTreatmentStatus?: Status;
  onRescheduleSuccess?: () => void;
}

/**
 * Individual attendance item component
 * Displays date, status, treatments, and session details
 */
export const AttendanceHistoryItem: React.FC<AttendanceHistoryItemProps> = ({
  groupedAttendance,
  treatments,
  patientTreatmentStatus,
  onRescheduleSuccess,
}) => {
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const status = groupedAttendance.status ?? "completed";
  const statusConfig = getStatusConfig(status);
  const absenceStatus = getAbsenceStatus(status);
  const styles = getAbsenceStyles(absenceStatus);

  const canReschedule =
    (status === "missed" || status === "cancelled") &&
    (!!groupedAttendance.treatments.physiotherapy ||
      !!groupedAttendance.treatments.tens) &&
    patientTreatmentStatus === "T";

  // Session row for this calendar date (notes / missed reason for physiotherapy or tens on this day)
  const physiotherapySession =
    groupedAttendance.treatments.physiotherapy?.sessions?.find(
      (sessionRow) =>
        sessionRow.scheduledDate.split("T")[0] === groupedAttendance.date &&
        (sessionRow.status === "completed" || sessionRow.status === "missed"),
    );

  const tensSession = groupedAttendance.treatments.tens?.sessions?.find(
    (sessionRow) =>
      sessionRow.scheduledDate.split("T")[0] === groupedAttendance.date &&
      (sessionRow.status === "completed" || sessionRow.status === "missed"),
  );

  const isAbsent = isAbsence(status);

  const hasTreatmentDetails =
    groupedAttendance.treatments.physiotherapy ||
    groupedAttendance.treatments.tens ||
    groupedAttendance.treatments.assessment;

  const treatmentTypeLabel = getTreatmentTypeLabel(
    !!groupedAttendance.treatments.assessment,
    !!groupedAttendance.treatments.physiotherapy,
    !!groupedAttendance.treatments.tens,
  );

  return (
    <div className={`p-4 rounded-lg border ${styles.containerClass}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <AttendanceDateHeader
          date={groupedAttendance.date}
          status={status}
          treatmentTypeLabel={treatmentTypeLabel}
        />

        <div className="flex flex-wrap items-center gap-2">
          <AttendanceStatusBadges
            absenceStatus={absenceStatus}
            statusConfig={statusConfig}
          />
          {canReschedule && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRescheduleModal(true)}
              className="min-h-[44px] w-full gap-1.5 shadow-sm sm:w-auto"
              aria-label="Reschedule attendance"
            >
              <CalendarClock className="h-4 w-4" aria-hidden />
              Reschedule
            </Button>
          )}
        </div>
      </div>

      {showRescheduleModal && (
        <RescheduleAttendanceModal
          payload={{
            date: groupedAttendance.date,
            attendanceId: groupedAttendance.attendanceId,
            attendanceIds: groupedAttendance.attendanceIds,
          }}
          onClose={() => setShowRescheduleModal(false)}
          onSuccess={onRescheduleSuccess}
        />
      )}
      {/* Absence Reason */}
      <AbsenceReasonBox
        status={absenceStatus}
        reason={
          groupedAttendance.absenceNotes ||
          physiotherapySession?.missedReason ||
          tensSession?.missedReason ||
          ""
        }
        isJustified={groupedAttendance.absenceJustified}
      />

      {/* Session Notes */}
      {(physiotherapySession || tensSession) && (
        <NotesBox
          notes={physiotherapySession?.notes || tensSession?.notes}
          noteType="session"
          borderColor={isAbsent ? "red" : "gray"}
        />
      )}

      {/* Treatment Details */}
      {hasTreatmentDetails && (
        <TreatmentDetailsContainer>
          {/* Physiotherapy Details */}
          {groupedAttendance.treatments.physiotherapy && (
            <PhysiotherapyDetails
              bodyLocationsWithColors={
                groupedAttendance.treatments.physiotherapy
                  .bodyLocationsWithColors
              }
              color={groupedAttendance.treatments.physiotherapy.color}
              duration={groupedAttendance.treatments.physiotherapy.duration}
              sessionNumber={
                groupedAttendance.treatments.physiotherapy.sessionNumber
              }
              notes={groupedAttendance.treatments.physiotherapy.notes}
              showSessions={true}
              isAbsent={isAbsent}
              attendanceNotes={
                groupedAttendance.treatments.physiotherapy.attendanceNotes
              }
            />
          )}

          {/* TENS Details */}
          {groupedAttendance.treatments.tens && (
            <TensDetails
              bodyLocations={groupedAttendance.treatments.tens.bodyLocations}
              sessionNumber={groupedAttendance.treatments.tens.sessionNumber}
              notes={groupedAttendance.treatments.tens.notes}
              showSessions={true}
              isAbsent={isAbsent}
              attendanceNotes={
                groupedAttendance.treatments.tens.attendanceNotes
              }
            />
          )}

          {/* Assessment Consultation Details */}
          {groupedAttendance.treatments.assessment && (
            <AssessmentDetails
              recommendations={
                groupedAttendance.treatments.assessment.recommendations
              }
              preConsultationNotes={
                groupedAttendance.treatments.assessment.notes
              }
              consultationNotes={
                groupedAttendance.treatments.assessment.consultationNotes
              }
              physiotherapySessions={treatments.filter(
                (treatment) =>
                  treatment.consultationId ===
                    groupedAttendance.treatments.assessment?.consultationId &&
                  treatment.treatmentType === "physiotherapy",
              )}
              tensSessions={treatments.filter(
                (treatment) =>
                  treatment.consultationId ===
                    groupedAttendance.treatments.assessment?.consultationId &&
                  treatment.treatmentType === "tens",
              )}
              isAbsent={isAbsent}
              isFirstAttendance={true}
            />
          )}
        </TreatmentDetailsContainer>
      )}

      {/* Attendance Metadata */}
      <AttendanceMetadata
        createdDate={groupedAttendance.createdDate}
        updatedDate={groupedAttendance.updatedDate}
        cancelledDate={groupedAttendance.cancelledDate}
      />
    </div>
  );
};
