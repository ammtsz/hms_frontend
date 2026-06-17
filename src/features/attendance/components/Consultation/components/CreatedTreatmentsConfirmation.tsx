import React, { useMemo } from "react";
import type {
  AttendanceResponseDto,
  CancelledAttendanceItemDto,
  SessionResponseDto,
} from "@/api/types";
import { getAttendanceTypeLabel } from "@/utils/apiTransformers";
import { formatDateBR } from "@/utils/dateUtils";
import type { AttendanceType } from "@/types/types";
import { useCreatedTreatmentsSummary } from "../hooks/useCreatedTreatmentsSummary";
import { SuccessHeader } from "./CreatedTreatmentsConfirmation/SuccessHeader";
import { NextConsultationCard } from "./CreatedTreatmentsConfirmation/NextConsultationCard";
import { CreatedTreatmentGroup } from "./CreatedTreatmentsConfirmation/CreatedTreatmentGroup";
import { groupCancelledByPatient } from "@/features/attendance/components/EndOfDay/utils/summaryStepUtils";
import { Button } from "@/components/ui";

// Interface matching the actual backend TreatmentResponseDto
export interface CreatedTreatment {
  id: number;
  consultationId: number;
  attendanceId: number;
  patientId: number;
  treatmentType: "physiotherapy" | "tens";
  bodyLocation: string;
  startDate: string; // Will be converted to Date by backend
  plannedSessions: number;
  completedSessions: number;
  endDate?: string;
  status: string;
  durationMinutes?: number;
  color?: string;
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
  /** When true, return is scheduled after the last planned treatment attendance */
  returnWhenTreatmentComplete?: boolean;
  /** Newly scheduled attendances fetched from database */
  newlyScheduledAttendances?: AttendanceResponseDto[];
  /** Loading state for fetching attendances */
  fetchingAttendances?: boolean;
  /** Error message if fetching attendances failed */
  attendancesError?: string;
  /** Patient lifecycle status (consultation) to detect assessment discharge */
  patientStatus?: "N" | "T" | "A" | "F";
  /** Optional created date for the consultation */
  createdDate?: string;
  /** Attendances cancelled when status was set to A or F (e.g. from PostAttendanceModal) */
  cancelledAttendances?: CancelledAttendanceItemDto[];
}

/**
 * Confirmation view after saving a consultation: lists created treatments
 * and their automatically scheduled attendances.
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
  newlyScheduledAttendances,
  fetchingAttendances,
  attendancesError,
  patientStatus,
  createdDate,
  cancelledAttendances = [],
}) => {
  const groupedCancelled = useMemo(() => {
    if (cancelledAttendances.length === 0) return [];
    return groupCancelledByPatient([
      { patientId: 0, patientName, attendances: cancelledAttendances },
    ]);
  }, [cancelledAttendances, patientName]);

  // Use custom hook for data processing
  const {
    physiotherapySessions,
    tensSessions,
    nextAssessmentConsultation,
    getScheduledDatesFromAttendances,
  } = useCreatedTreatmentsSummary(createdTreatments, newlyScheduledAttendances);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
      {onAcknowledge && <SuccessHeader customMessage={customMessage} />}

      {patientStatus === "A" && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-900 mb-1">
                Alta do tratamento
              </h4>
              <p className="text-sm text-green-800">
                O paciente <span className="font-medium">{patientName}</span>{" "}
                recebeu Alta do tratamento. O tratamento foi encerrado com
                sucesso e o paciente não necessita mais de acompanhamento neste
                momento.
              </p>
            </div>
          </div>
        </div>
      )}

      {groupedCancelled.length > 0 &&
        (patientStatus === "A" || patientStatus === "F") && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <h4 className="text-md font-medium text-red-800 mb-3">
              {patientStatus === "A"
                ? "Atendimentos Cancelados devido a Alta do tratamento"
                : "Atendimentos Cancelados devido a Faltas Consecutivas"}
            </h4>
            <ul className="space-y-3">
              {groupedCancelled.map((item) => (
                <li key={item.patientId} className="text-sm text-red-700">
                  <div className="font-medium">• {item.patientName}</div>
                  {item.attendances.length > 0 && (
                    <ul className="ml-4 mt-1 space-y-1 text-xs">
                      {item.attendances.map((att) => (
                        <li key={`${att.type}|${att.scheduledDate}`}>
                          {getAttendanceTypeLabel(att.type as AttendanceType)}
                          {att.type !== "assessment" && att.count > 1
                            ? ` (${att.count} locais)`
                            : ""}{" "}
                          - {formatDateBR(att.scheduledDate)}
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
          Os Agendamentos abaixo foram criados automaticamente:
        </h4>
      )}

      <div className="space-y-4 mb-6">
        <CreatedTreatmentGroup
          treatments={physiotherapySessions}
          title="Physiotherapy"
          getScheduledDates={getScheduledDatesFromAttendances}
        />
        <CreatedTreatmentGroup
          treatments={tensSessions}
          title="TENS"
          getScheduledDates={getScheduledDatesFromAttendances}
        />
      </div>

      <NextConsultationCard
        nextAssessmentConsultation={nextAssessmentConsultation}
        fetchingAttendances={fetchingAttendances}
        attendancesError={attendancesError}
        createdDate={createdDate}
        returnWeeks={returnWeeks}
        returnWhenTreatmentComplete={returnWhenTreatmentComplete}
      />

      {onAcknowledge && (
        <div className="flex justify-end mt-auto pb-8">
          <Button type="button" onClick={onAcknowledge}>
            Entendi
          </Button>
        </div>
      )}
    </div>
  );
};

export default CreatedTreatmentsConfirmation;
