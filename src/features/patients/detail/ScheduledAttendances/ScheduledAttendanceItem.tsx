import React, { useState } from "react";
import { CalendarClock } from "lucide-react";
import { getDaysUntil } from "@/utils/dateUtils";
import type { Status } from "@/types/types";
import {
  GroupedScheduledAttendance,
  getTreatmentTypesLabel,
} from "@/utils/attendanceHistoryUtils";
import { getAbsenceStyles, getAbsenceStatus } from "@/utils/absenceStyles";
import { AttendanceDateHeader } from "@/features/patients/detail/AttendanceDetails/AttendanceDateHeader";
import { AttendanceStatusBadges } from "@/features/patients/detail/AttendanceDetails/AttendanceStatusBadges";
import { AbsenceReasonBox } from "@/features/patients/detail/AttendanceDetails/AbsenceReasonBox";
import { PhysiotherapyDetails } from "@/features/patients/detail/AttendanceDetails/PhysiotherapyDetails";
import { TensDetails } from "@/features/patients/detail/AttendanceDetails/TensDetails";
import { AssessmentDetails } from "@/features/patients/detail/AttendanceDetails/AssessmentDetails";
import { TreatmentDetailsContainer } from "@/features/patients/detail/AttendanceDetails/TreatmentDetailsContainer";
import { AttendanceMetadata } from "@/features/patients/detail/AttendanceDetails/AttendanceMetadata";
import { RescheduleAttendanceModal } from "@/features/patients/detail/AttendanceHistory/RescheduleAttendanceModal";
import { Button } from "@/components/ui";

interface ScheduledAttendanceItemProps {
  groupedScheduled: GroupedScheduledAttendance;
  isFirstItem: boolean;
  patientTreatmentStatus?: Status;
  onRescheduleSuccess?: () => void;
}

/**
 * Individual scheduled attendance item component
 * Displays date, status, treatments, and session details for future appointments
 */
export const ScheduledAttendanceItem: React.FC<
  ScheduledAttendanceItemProps
> = ({
  groupedScheduled,
  isFirstItem,
  patientTreatmentStatus,
  onRescheduleSuccess,
}) => {
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const daysUntil = getDaysUntil(groupedScheduled.date);
  const isUpcoming = daysUntil <= 7 && daysUntil > 0;
  const absenceStatus = getAbsenceStatus(groupedScheduled.status || "");
  const styles = getAbsenceStyles(absenceStatus);

  const canReschedule =
    groupedScheduled.status === "cancelled" &&
    (!!groupedScheduled.treatments.physiotherapy ||
      !!groupedScheduled.treatments.tens) &&
    patientTreatmentStatus === "T";

  const daysText =
    daysUntil === 0
      ? "hoje"
      : daysUntil === 1
        ? "amanhã"
        : `em ${daysUntil} dias`;

  const treatmentTypeLabel = getTreatmentTypesLabel(
    groupedScheduled.treatments,
  );

  return (
    <div className={`p-4 rounded-lg border ${styles.containerClass}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <AttendanceDateHeader
          date={groupedScheduled.date}
          status={groupedScheduled.status || "scheduled"}
          treatmentTypeLabel={treatmentTypeLabel}
          daysUntilText={daysUntil >= 0 ? daysText : undefined}
        />

        <div className="flex flex-wrap items-center gap-2">
          <AttendanceStatusBadges
            absenceStatus={absenceStatus}
            attendanceStatus={groupedScheduled.status}
            isUpcoming={isUpcoming}
            isNextAppointment={isFirstItem && absenceStatus === "none"}
          />
          {canReschedule && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRescheduleModal(true)}
              className="gap-1.5 shadow-sm"
              aria-label="Reagendar atendimento"
            >
              <CalendarClock className="h-4 w-4" aria-hidden />
              Reagendar
            </Button>
          )}
        </div>
      </div>

      {showRescheduleModal && (
        <RescheduleAttendanceModal
          payload={{
            date: groupedScheduled.date,
            attendanceId: groupedScheduled.attendanceId,
            attendanceIds: groupedScheduled.attendanceIds,
          }}
          onClose={() => setShowRescheduleModal(false)}
          onSuccess={onRescheduleSuccess}
        />
      )}

      {/* Cancellation Reason */}
      <AbsenceReasonBox
        status={absenceStatus}
        reason={groupedScheduled.absenceNotes || ""}
      />

      {/* Scheduled Treatment Details */}
      <TreatmentDetailsContainer>
        {/* Assessment Consultation */}
        {groupedScheduled.treatments.assessment && (
          <AssessmentDetails
            isFirstAttendance={!!groupedScheduled.parentAttendanceId}
            isAbsent={absenceStatus !== "none"}
            preConsultationNotes={groupedScheduled.treatments.assessment.notes}
          />
        )}

        {/* Physiotherapy Details */}
        {groupedScheduled.treatments.physiotherapy && (
          <PhysiotherapyDetails
            bodyLocationsWithColors={
              groupedScheduled.treatments.physiotherapy.bodyLocationsWithColors
            }
            color={groupedScheduled.treatments.physiotherapy.color}
            duration={groupedScheduled.treatments.physiotherapy.duration}
            sessionNumber={
              groupedScheduled.treatments.physiotherapy.sessionNumber
            }
            notes={groupedScheduled.treatments.physiotherapy.notes}
            showSessions={true}
            attendanceNotes={
              groupedScheduled.treatments.physiotherapy.attendanceNotes
            }
            isAbsent={absenceStatus !== "none"}
          />
        )}

        {/* TENS Details */}
        {groupedScheduled.treatments.tens && (
          <TensDetails
            bodyLocations={groupedScheduled.treatments.tens.bodyLocations}
            sessionNumber={groupedScheduled.treatments.tens.sessionNumber}
            notes={groupedScheduled.treatments.tens.notes}
            showSessions={true}
            attendanceNotes={groupedScheduled.treatments.tens.attendanceNotes}
            isAbsent={absenceStatus !== "none"}
          />
        )}
      </TreatmentDetailsContainer>

      {/* Attendance Metadata */}
      <AttendanceMetadata
        createdDate={groupedScheduled.createdDate}
        updatedDate={groupedScheduled.updatedDate}
        cancelledDate={groupedScheduled.cancelledDate}
      />
    </div>
  );
};
