import React, { useState } from "react";
import { GroupedAppointment } from "@/utils/appointmentHistoryUtils";
import { TreatmentResponseDto } from "@/api/types";
import type { Status } from "@/types/types";
import { getStatusConfig, getTreatmentTypeLabel } from "./utils";
import {
  getAbsenceStyles,
  getAbsenceStatus,
  isAbsence,
} from "@/utils/absenceStyles";
import { AppointmentDateHeader } from "@/features/patients/detail/AppointmentDetails/AppointmentDateHeader";
import { AppointmentStatusBadges } from "@/features/patients/detail/AppointmentDetails/AppointmentStatusBadges";
import { AbsenceReasonBox } from "@/features/patients/detail/AppointmentDetails/AbsenceReasonBox";
import { PhysiotherapyDetails } from "@/features/patients/detail/AppointmentDetails/PhysiotherapyDetails";
import { TensDetails } from "@/features/patients/detail/AppointmentDetails/TensDetails";
import { AssessmentDetails } from "@/features/patients/detail/AppointmentDetails/AssessmentDetails";
import { TreatmentDetailsContainer } from "@/features/patients/detail/AppointmentDetails/TreatmentDetailsContainer";
import { NotesBox } from "@/features/patients/detail/AppointmentDetails/helpers/treatmentHelpers";
import { AppointmentMetadata } from "@/features/patients/detail/AppointmentDetails/AppointmentMetadata";
import { RescheduleAppointmentModal } from "./RescheduleAppointmentModal";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui";

interface AppointmentHistoryItemProps {
  groupedAppointment: GroupedAppointment;
  /** Treatment plans for the patient (`TreatmentResponseDto[]`). */
  treatments: TreatmentResponseDto[];
  patientTreatmentStatus?: Status;
  onRescheduleSuccess?: () => void;
}

/**
 * Individual appointment item component
 * Displays date, status, treatments, and session details
 */
export const AppointmentHistoryItem: React.FC<AppointmentHistoryItemProps> = ({
  groupedAppointment,
  treatments,
  patientTreatmentStatus,
  onRescheduleSuccess,
}) => {
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const status = groupedAppointment.status ?? "completed";
  const statusConfig = getStatusConfig(status);
  const absenceStatus = getAbsenceStatus(status);
  const styles = getAbsenceStyles(absenceStatus);

  const canReschedule =
    (status === "missed" || status === "cancelled") &&
    (!!groupedAppointment.treatments.physiotherapy ||
      !!groupedAppointment.treatments.tens) &&
    patientTreatmentStatus === "T";

  // Session row for this calendar date (notes / missed reason for physiotherapy or tens on this day)
  const physiotherapySession =
    groupedAppointment.treatments.physiotherapy?.sessions?.find(
      (sessionRow) =>
        sessionRow.scheduledDate.split("T")[0] === groupedAppointment.date &&
        (sessionRow.status === "completed" || sessionRow.status === "missed"),
    );

  const tensSession = groupedAppointment.treatments.tens?.sessions?.find(
    (sessionRow) =>
      sessionRow.scheduledDate.split("T")[0] === groupedAppointment.date &&
      (sessionRow.status === "completed" || sessionRow.status === "missed"),
  );

  const isAbsent = isAbsence(status);

  const hasTreatmentDetails =
    groupedAppointment.treatments.physiotherapy ||
    groupedAppointment.treatments.tens ||
    groupedAppointment.treatments.assessment;

  const treatmentTypeLabel = getTreatmentTypeLabel(
    !!groupedAppointment.treatments.assessment,
    !!groupedAppointment.treatments.physiotherapy,
    !!groupedAppointment.treatments.tens,
  );

  return (
    <div className={`p-4 rounded-lg border ${styles.containerClass}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <AppointmentDateHeader
          date={groupedAppointment.date}
          status={status}
          treatmentTypeLabel={treatmentTypeLabel}
        />

        <div className="flex flex-wrap items-center gap-2">
          <AppointmentStatusBadges
            absenceStatus={absenceStatus}
            statusConfig={statusConfig}
          />
          {canReschedule && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRescheduleModal(true)}
              className="min-h-[44px] w-full gap-1.5 shadow-sm sm:w-auto"
              aria-label="Reschedule appointment"
            >
              <CalendarClock className="h-4 w-4" aria-hidden />
              Reschedule
            </Button>
          )}
        </div>
      </div>

      {showRescheduleModal && (
        <RescheduleAppointmentModal
          payload={{
            date: groupedAppointment.date,
            appointmentId: groupedAppointment.appointmentId,
            appointmentIds: groupedAppointment.appointmentIds,
          }}
          onClose={() => setShowRescheduleModal(false)}
          onSuccess={onRescheduleSuccess}
        />
      )}
      {/* Absence Reason */}
      <AbsenceReasonBox
        status={absenceStatus}
        reason={
          groupedAppointment.absenceNotes ||
          physiotherapySession?.missedReason ||
          tensSession?.missedReason ||
          ""
        }
        isJustified={groupedAppointment.absenceJustified}
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
          {groupedAppointment.treatments.physiotherapy && (
            <PhysiotherapyDetails
              bodyLocations={
                groupedAppointment.treatments.physiotherapy.bodyLocations
              }
              durationMinutes={
                groupedAppointment.treatments.physiotherapy.durationMinutes
              }
              sessionNumber={
                groupedAppointment.treatments.physiotherapy.sessionNumber
              }
              notes={groupedAppointment.treatments.physiotherapy.notes}
              showSessions={true}
              isAbsent={isAbsent}
              appointmentNotes={
                groupedAppointment.treatments.physiotherapy.appointmentNotes
              }
            />
          )}

          {/* TENS Details */}
          {groupedAppointment.treatments.tens && (
            <TensDetails
              bodyLocations={groupedAppointment.treatments.tens.bodyLocations}
              sessionNumber={groupedAppointment.treatments.tens.sessionNumber}
              notes={groupedAppointment.treatments.tens.notes}
              showSessions={true}
              isAbsent={isAbsent}
              appointmentNotes={
                groupedAppointment.treatments.tens.appointmentNotes
              }
            />
          )}

          {/* Assessment Consultation Details */}
          {groupedAppointment.treatments.assessment && (
            <AssessmentDetails
              recommendations={
                groupedAppointment.treatments.assessment.recommendations
              }
              preConsultationNotes={
                groupedAppointment.treatments.assessment.notes
              }
              consultationNotes={
                groupedAppointment.treatments.assessment.consultationNotes
              }
              physiotherapySessions={treatments.filter(
                (treatment) =>
                  treatment.consultationId ===
                    groupedAppointment.treatments.assessment?.consultationId &&
                  treatment.treatmentType === "physiotherapy",
              )}
              tensSessions={treatments.filter(
                (treatment) =>
                  treatment.consultationId ===
                    groupedAppointment.treatments.assessment?.consultationId &&
                  treatment.treatmentType === "tens",
              )}
              isAbsent={isAbsent}
              isFirstAppointment={true}
            />
          )}
        </TreatmentDetailsContainer>
      )}

      {/* Appointment Metadata */}
      <AppointmentMetadata
        createdDate={groupedAppointment.createdDate}
        updatedDate={groupedAppointment.updatedDate}
        cancelledDate={groupedAppointment.cancelledDate}
      />
    </div>
  );
};
