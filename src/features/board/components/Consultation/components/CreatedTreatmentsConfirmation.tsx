import React, { useMemo } from "react";
import type {
  AppointmentResponseDto,
  CancelledAppointmentItemDto,
  SessionResponseDto,
} from "@/api/types";
import { getAppointmentTypeLabel } from "@/utils/apiTransformers";
import { formatDisplayDate } from "@/utils/dateUtils";
import type { AppointmentType } from "@/types/types";
import { useCreatedTreatmentsSummary } from "../hooks/useCreatedTreatmentsSummary";
import { SuccessHeader } from "./CreatedTreatmentsConfirmation/SuccessHeader";
import { NextConsultationCard } from "./CreatedTreatmentsConfirmation/NextConsultationCard";
import { CreatedTreatmentGroup } from "./CreatedTreatmentsConfirmation/CreatedTreatmentGroup";
import { groupCancelledByPatient } from "@/features/board/components/EndOfDay/utils/summaryStepUtils";
import { Button } from "@/components/ui";

// Interface matching the actual backend TreatmentResponseDto
export interface CreatedTreatment {
  id: number;
  consultationId: number;
  appointmentId: number;
  patientId: number;
  treatmentType: "physiotherapy" | "tens";
  bodyLocation: string;
  startDate: string; // Will be converted to Date by backend
  plannedSessions: number;
  completedSessions: number;
  endDate?: string;
  status: string;
  durationMinutes?: number;
  notes?: string;
  sessions?: SessionResponseDto[];
  createdDate: string;
  createdTime: string;
  updatedDate: string;
  updatedTime: string;
}

interface CreatedTreatmentsConfirmationProps {
  /** Created treatment plan rows (`hms_treatment`) returned after consultation save */
  createdTreatments: CreatedTreatment[];
  /** Patient name for personalized messaging */
  patientName: string;
  /** Callback when user acknowledges the confirmation */
  onAcknowledge?: () => void;
  /** Optional custom message */
  customMessage?: string;
  /** Number of weeks until next assessment consultation return */
  returnWeeks?: number;
  /** When true, return is scheduled after the last planned treatment appointment */
  returnWhenTreatmentComplete?: boolean;
  /** Newly scheduled appointments fetched from database */
  newlyScheduledAppointments?: AppointmentResponseDto[];
  /** Loading state for fetching appointments */
  fetchingAppointments?: boolean;
  /** Error message if fetching appointments failed */
  appointmentsError?: string;
  /** Patient lifecycle status (consultation) to detect assessment discharge */
  patientStatus?: "N" | "T" | "D" | "C";
  /** Optional created date for the consultation */
  createdDate?: string;
  /** Appointments cancelled when status was set to D or C (e.g. from PostConsultationModal) */
  cancelledAppointments?: CancelledAppointmentItemDto[];
}

/**
 * Confirmation view after saving a consultation: lists created treatments
 * and their automatically scheduled appointments.
 */
const CreatedTreatmentsConfirmation: React.FC<
  CreatedTreatmentsConfirmationProps
> = ({
  createdTreatments,
  patientName,
  onAcknowledge,
  customMessage,
  returnWeeks,
  returnWhenTreatmentComplete,
  newlyScheduledAppointments,
  fetchingAppointments,
  appointmentsError,
  patientStatus,
  createdDate,
  cancelledAppointments = [],
}) => {
  const groupedCancelled = useMemo(() => {
    if (cancelledAppointments.length === 0) return [];
    return groupCancelledByPatient([
      { patientId: 0, patientName, appointments: cancelledAppointments },
    ]);
  }, [cancelledAppointments, patientName]);

  // Use custom hook for data processing
  const {
    physiotherapySessions,
    tensSessions,
    nextAssessmentConsultation,
    getScheduledDatesFromAppointments,
  } = useCreatedTreatmentsSummary(
    createdTreatments,
    newlyScheduledAppointments,
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
      {onAcknowledge && <SuccessHeader customMessage={customMessage} />}

      {patientStatus === "D" && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-900 mb-1">
                Discharged
              </h4>
              <p className="text-sm text-green-800">
                Patient <span className="font-medium">{patientName}</span> has
                been discharged from treatment. The treatment was closed
                successfully and the patient no longer needs follow-up at this
                time.
              </p>
            </div>
          </div>
        </div>
      )}

      {groupedCancelled.length > 0 &&
        (patientStatus === "D" || patientStatus === "C") && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <h4 className="text-md font-medium text-red-800 mb-3">
              {patientStatus === "D"
                ? "Appointments Cancelled due to Discharged"
                : "Appointments Cancelled due to Consecutive no-shows"}
            </h4>
            <ul className="space-y-3">
              {groupedCancelled.map((item) => (
                <li key={item.patientId} className="text-sm text-red-700">
                  <div className="font-medium">• {item.patientName}</div>
                  {item.appointments.length > 0 && (
                    <ul className="ml-4 mt-1 space-y-1 text-xs">
                      {item.appointments.map((att) => (
                        <li key={`${att.type}|${att.scheduledDate}`}>
                          {getAppointmentTypeLabel(att.type as AppointmentType)}
                          {att.type !== "assessment" && att.count > 1
                            ? ` (${att.count} locations)`
                            : ""}{" "}
                          - {formatDisplayDate(att.scheduledDate)}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

      {(physiotherapySessions.length > 0 ||
        tensSessions.length > 0 ||
        nextAssessmentConsultation) && (
        <h4 className="text-md text-gray-900 mb-4">
          The appointments below were created automatically:
        </h4>
      )}

      <div className="space-y-4 mb-6">
        <CreatedTreatmentGroup
          treatments={physiotherapySessions}
          title="Physiotherapy"
          getScheduledDates={getScheduledDatesFromAppointments}
        />
        <CreatedTreatmentGroup
          treatments={tensSessions}
          title="TENS"
          getScheduledDates={getScheduledDatesFromAppointments}
        />
      </div>

      <NextConsultationCard
        nextAssessmentConsultation={nextAssessmentConsultation}
        fetchingAppointments={fetchingAppointments}
        appointmentsError={appointmentsError}
        createdDate={createdDate}
        returnWeeks={returnWeeks}
        returnWhenTreatmentComplete={returnWhenTreatmentComplete}
      />

      {onAcknowledge && (
        <div className="flex justify-end mt-auto pb-8">
          <Button type="button" onClick={onAcknowledge}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
};

export default CreatedTreatmentsConfirmation;
