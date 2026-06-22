import React from "react";
import BaseModal from "@/components/common/BaseModal";
import ErrorDisplay from "@/components/common/ErrorDisplay";
import { Button } from "@/components/ui";
import CreatedTreatmentsConfirmation from "./components/CreatedTreatmentsConfirmation";
import type { CreatedTreatment } from "./components/CreatedTreatmentsConfirmation";
import {
  useViewCompletedConsultationModal,
  useCloseModal,
} from "@/stores/modalStore";
import { useConsultationByAttendance } from "@/api/query/hooks/useConsultationQueries";
import { useNewlyScheduledAttendances } from "@/api/query/hooks/usePatientQueries";
import { useTreatmentsByPatient } from "@/api/query/hooks/useTreatmentsQueries";
import { SuccessHeader } from "./components/CreatedTreatmentsConfirmation/SuccessHeader";

/**
 * ViewCompletedConsultationModal - Displays a read-only view of a completed assessment consultation
 * Shows what treatments were recommended, sessions created, and follow-up appointments scheduled
 */
const ViewCompletedConsultationModal: React.FC = () => {
  const modal = useViewCompletedConsultationModal();
  const closeModal = useCloseModal();

  const { attendanceId, patientId, patientName, isOpen } = modal;

  // Consultation persisted for this attendance (`hms_consultation`)
  const {
    data: consultation,
    isLoading: loadingConsultation,
    error: consultationError,
  } = useConsultationByAttendance(attendanceId?.toString() || "");

  // Treatment plans for this patient (`GET /treatments/patient/:id`)
  const {
    treatments,
    loading: loadingTreatments,
    error: treatmentsError,
  } = useTreatmentsByPatient(patientId || 0);

  // Fetch newly scheduled attendances for this patient
  const {
    data: scheduledAttendances,
    isLoading: loadingAttendances,
    error: attendancesError,
  } = useNewlyScheduledAttendances(
    patientId?.toString(),
    isOpen && !!patientId,
  );

  const handleClose = () => {
    closeModal("viewCompletedConsultation");
  };

  // Treatment plans linked to this attendance, in the shape expected by CreatedTreatmentsConfirmation
  const formattedSessions: CreatedTreatment[] = React.useMemo(() => {
    if (!treatments || treatments.length === 0) {
      return [];
    }

    return treatments
      .filter((treatment) => treatment.attendanceId === attendanceId)
      .map((treatment) => ({
        id: treatment.id,
        consultationId: treatment.consultationId,
        attendanceId: treatment.attendanceId,
        patientId: treatment.patientId,
        treatmentType: treatment.treatmentType,
        bodyLocation: treatment.bodyLocation,
        startDate: treatment.startDate,
        plannedSessions: treatment.plannedSessions,
        completedSessions: treatment.completedSessions,
        endDate: treatment.endDate,
        status: treatment.status,
        durationMinutes: treatment.durationMinutes,
        color: treatment.color,
        notes: treatment.notes,
        sessions: treatment.sessions,
        createdDate: treatment.createdDate,
        createdTime: treatment.createdTime,
        updatedDate: treatment.updatedDate,
        updatedTime: treatment.updatedTime,
      }));
  }, [treatments, attendanceId]);

  const isLoading =
    loadingConsultation || loadingTreatments || loadingAttendances;
  const error = consultationError || treatmentsError || attendancesError;

  if (!isOpen) {
    return null;
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Completed Consultation - ${patientName || "Patient"}`}
      subtitle={`Recommended treatments • Attendance #${attendanceId}`}
      maxWidth="2xl"
    >
      <div className="p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading consultation data...</p>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <ErrorDisplay
            error={
              typeof error === "string"
                ? error
                : (error as Error)?.message || "Error loading consultation data"
            }
            dismissible={false}
          />
        )}

        {!isLoading && !error && consultation && (
          <>
            <SuccessHeader />
            {/* Main concern section */}
            <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Main Concern
              </h3>
              <p className="text-sm text-gray-800">
                {consultation.mainConcern || "Not informed"}
              </p>
            </div>

            {/* General recommendations */}
            {(consultation.food ||
              consultation.water ||
              consultation.ointments ||
              consultation.notes) && (
              <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  General Recommendations
                </h3>
                <div className="space-y-4 text-sm text-gray-700">
                  {consultation.food && (
                    <div>
                      <span className="font-semibold">🍎 FOOD:</span>{" "}
                      {consultation.food}
                    </div>
                  )}
                  {consultation.water && (
                    <div>
                      <span className="font-semibold">💧 WATER:</span>{" "}
                      {consultation.water}
                    </div>
                  )}
                  {consultation.ointments && (
                    <div>
                      <span className="font-semibold">🧴 OINTMENTS:</span>{" "}
                      {consultation.ointments}
                    </div>
                  )}
                  {consultation.notes && (
                    <div>
                      <span className="font-semibold">💡 NOTES:</span>{" "}
                      {consultation.notes}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Treatment sessions confirmation */}
            {formattedSessions.length > 0 ? (
              <CreatedTreatmentsConfirmation
                createdTreatments={formattedSessions}
                patientName={patientName || ""}
                returnWeeks={consultation.returnWeeks}
                returnWhenTreatmentComplete={
                  consultation.returnWhenTreatmentComplete
                }
                newlyScheduledAttendances={scheduledAttendances}
                fetchingAttendances={loadingAttendances}
                attendancesError={
                  attendancesError
                    ? typeof attendancesError === "string"
                      ? attendancesError
                      : (attendancesError as Error)?.message
                    : undefined
                }
                patientStatus={
                  consultation.patientStatus as "N" | "T" | "A" | "F"
                }
                createdDate={consultation.createdDate}
              />
            ) : (
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  No treatment (physiotherapy or TENS) was recommended in this
                  consultation.
                </p>
              </div>
            )}
          </>
        )}

        {!isLoading && !error && !consultation && (
          <div className="py-12 text-center">
            <p className="text-gray-600">
              No consultation found for this attendance.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t flex justify-end border-gray-300">
        <Button type="button" onClick={handleClose}>
          Close
        </Button>
      </div>
    </BaseModal>
  );
};

export default ViewCompletedConsultationModal;
