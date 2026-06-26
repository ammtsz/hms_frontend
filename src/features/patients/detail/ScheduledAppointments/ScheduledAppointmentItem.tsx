import React, { useState } from "react";
import { CalendarClock } from "lucide-react";
import { getDaysUntil } from "@/utils/dateUtils";
import type { Status } from "@/types/types";
import {
  GroupedScheduledAppointment,
  getTreatmentTypesLabel,
} from "@/utils/appointmentHistoryUtils";
import { getAbsenceStyles, getAbsenceStatus } from "@/utils/absenceStyles";
import { AppointmentDateHeader } from "@/features/patients/detail/AppointmentDetails/AppointmentDateHeader";
import { AppointmentStatusBadges } from "@/features/patients/detail/AppointmentDetails/AppointmentStatusBadges";
import { AbsenceReasonBox } from "@/features/patients/detail/AppointmentDetails/AbsenceReasonBox";
import { PhysiotherapyDetails } from "@/features/patients/detail/AppointmentDetails/PhysiotherapyDetails";
import { TensDetails } from "@/features/patients/detail/AppointmentDetails/TensDetails";
import { AssessmentDetails } from "@/features/patients/detail/AppointmentDetails/AssessmentDetails";
import { TreatmentDetailsContainer } from "@/features/patients/detail/AppointmentDetails/TreatmentDetailsContainer";
import { AppointmentMetadata } from "@/features/patients/detail/AppointmentDetails/AppointmentMetadata";
import { RescheduleAppointmentModal } from "@/features/patients/detail/AppointmentHistory/RescheduleAppointmentModal";
import { Button } from "@/components/ui";

interface ScheduledAppointmentItemProps {
  groupedScheduled: GroupedScheduledAppointment;
  isFirstItem: boolean;
  patientTreatmentStatus?: Status;
  onRescheduleSuccess?: () => void;
}

/**
 * Individual scheduled appointment item component
 * Displays date, status, treatments, and session details for future appointments
 */
export const ScheduledAppointmentItem: React.FC<
  ScheduledAppointmentItemProps
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
      ? "today"
      : daysUntil === 1
        ? "tomorrow"
        : `in ${daysUntil} days`;

  const treatmentTypeLabel = getTreatmentTypesLabel(
    groupedScheduled.treatments,
  );

  return (
    <div className={`p-4 rounded-lg border ${styles.containerClass}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <AppointmentDateHeader
          date={groupedScheduled.date}
          status={groupedScheduled.status || "scheduled"}
          treatmentTypeLabel={treatmentTypeLabel}
          daysUntilText={daysUntil >= 0 ? daysText : undefined}
        />

        <div className="flex flex-wrap items-center gap-2">
          <AppointmentStatusBadges
            absenceStatus={absenceStatus}
            appointmentStatus={groupedScheduled.status}
            isUpcoming={isUpcoming}
            isNextAppointment={isFirstItem && absenceStatus === "none"}
          />
          {canReschedule && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRescheduleModal(true)}
              className="gap-1.5 shadow-sm"
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
            date: groupedScheduled.date,
            appointmentId: groupedScheduled.appointmentId,
            appointmentIds: groupedScheduled.appointmentIds,
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
            isFirstAppointment={!!groupedScheduled.parentAppointmentId}
            isAbsent={absenceStatus !== "none"}
            preConsultationNotes={groupedScheduled.treatments.assessment.notes}
          />
        )}

        {/* Physiotherapy Details */}
        {groupedScheduled.treatments.physiotherapy && (
          <PhysiotherapyDetails
            bodyLocations={
              groupedScheduled.treatments.physiotherapy.bodyLocations
            }
            durationMinutes={
              groupedScheduled.treatments.physiotherapy.durationMinutes
            }
            sessionNumber={
              groupedScheduled.treatments.physiotherapy.sessionNumber
            }
            notes={groupedScheduled.treatments.physiotherapy.notes}
            showSessions={true}
            appointmentNotes={
              groupedScheduled.treatments.physiotherapy.appointmentNotes
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
            appointmentNotes={groupedScheduled.treatments.tens.appointmentNotes}
            isAbsent={absenceStatus !== "none"}
          />
        )}
      </TreatmentDetailsContainer>

      {/* Appointment Metadata */}
      <AppointmentMetadata
        createdDate={groupedScheduled.createdDate}
        updatedDate={groupedScheduled.updatedDate}
        cancelledDate={groupedScheduled.cancelledDate}
      />
    </div>
  );
};
