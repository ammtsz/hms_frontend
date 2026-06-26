import React, { useEffect, useState, useMemo } from "react";
import { Activity } from "lucide-react";
import { Patient } from "@/types/types";
import type { PatientPageSectionId } from "@/features/patients/detail/PatientPageSectionNav";
import { usePatientPageScrollTarget } from "@/features/patients/detail/PatientPageSectionNav";
import {
  useTreatmentsByPatient,
  useCancelTreatments,
} from "@/api/query/hooks/useTreatmentsQueries";
import { useConsultations } from "@/api/query/hooks/useConsultationQueries";
import { usePagination } from "@/features/patients/detail/shared/hooks/usePagination";
import { TreatmentRecommendationsEmpty } from "@/features/patients/detail/shared/CardStates";
import { TreatmentStatusOverview } from "./TreatmentStatusOverview";
import { ActiveTreatments } from "./ActiveTreatments";
import { TreatmentRecommendationsDisplay } from "./TreatmentRecommendationsDisplay";
import ConfirmModal from "@/components/common/ConfirmModal";
import EditTreatmentModal from "@/features/board/components/TreatmentSession/EditTreatmentModal";
import type { TreatmentResponseDto } from "@/api/types";
import { DetailCardCollapsibleHeader } from "@/features/patients/detail/shared/DetailCardCollapsibleHeader";
import { Card, CardBody, Checkbox, Field, Textarea } from "@/components/ui";

interface CurrentTreatmentCardProps {
  patient: Patient;
  sectionId?: PatientPageSectionId;
}

export const CurrentTreatmentCard: React.FC<CurrentTreatmentCardProps> = ({
  patient,
  sectionId,
}) => {
  // State for collapsible card
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { scrollTargetSectionId, setScrollTargetSectionId } =
    usePatientPageScrollTarget();

  // Expand when scrolled to via section nav
  useEffect(() => {
    if (sectionId && scrollTargetSectionId === sectionId) {
      setIsCollapsed(false);
      setScrollTargetSectionId(null);
    }
  }, [sectionId, scrollTargetSectionId, setScrollTargetSectionId]);

  // State for confirmation modal
  const [confirmDelete, setConfirmDelete] = useState<{
    treatmentIds: number[];
    sessionType: string;
  } | null>(null);

  // Treatment plan IDs selected in the cancel confirmation modal
  const [selectedTreatmentIds, setSelectedTreatmentIds] = useState<number[]>(
    [],
  );

  // State for cancellation reason
  const [cancellationReason, setCancellationReason] = useState("");

  // State for edit treatment modal
  const [editModal, setEditModal] = useState<{
    treatmentPlans: TreatmentResponseDto[];
    treatmentType: "physiotherapy" | "tens";
  } | null>(null);

  // Fetch treatment plans for progress (`GET /treatments/patient/:id`)
  const {
    treatments,
    loading: treatmentsLoading,
    refetch: refetchTreatments,
  } = useTreatmentsByPatient(Number(patient.id));

  // Consultations list (latest assessment recommendations by appointment)
  const { data: consultations = [] } = useConsultations();

  // Hook for cancelling treatment plans
  const cancelTreatmentsMutation = useCancelTreatments();

  // Latest consultation for this patient (by appointments linked to them)
  const latestConsultation = useMemo(() => {
    const patientAppointmentIds = new Set(
      patient.previousAppointments.map((att) => Number(att.appointmentId)),
    );

    const patientConsultations = consultations.filter((consultation) =>
      patientAppointmentIds.has(consultation.appointmentId),
    );

    if (patientConsultations.length === 0) return null;

    return patientConsultations.sort((a, b) => {
      return (
        new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      );
    })[0];
  }, [consultations, patient.previousAppointments]);

  // Map persisted consultation fields into the “current recommendations” card shape
  const currentRecommendations = useMemo(() => {
    if (!latestConsultation) {
      return patient.currentRecommendations;
    }

    // Prefer the appointment calendar date over consultation `createdDate` for the header
    const appointment = patient.previousAppointments.find(
      (att) => Number(att.appointmentId) === latestConsultation.appointmentId,
    );
    const date = appointment?.date || latestConsultation.createdDate || "";

    return {
      date, // Keep as YYYY-MM-DD string
      homeExercises: latestConsultation.homeExercises || "",
      painManagement: latestConsultation.painManagement || "",
      medications: latestConsultation.medications || "",
      notes: latestConsultation.notes || "",
      physiotherapy: latestConsultation.physiotherapy || false,
      tens: latestConsultation.tens || false,
      returnWeeks: latestConsultation.returnWeeks || 0,
      returnWhenTreatmentComplete:
        latestConsultation.returnWhenTreatmentComplete || false,
    };
  }, [
    latestConsultation,
    patient.currentRecommendations,
    patient.previousAppointments,
  ]);

  // Cancel flow: child passes treatment plan IDs (not session rows)
  const handleCancelTreatments = (
    treatmentIds: number[],
    sessionType: string,
  ) => {
    setConfirmDelete({ treatmentIds, sessionType });
    setSelectedTreatmentIds(treatmentIds);
  };

  const treatmentsToCancel = useMemo(() => {
    if (!confirmDelete) return [];
    return treatments.filter((treatment) =>
      confirmDelete.treatmentIds.includes(treatment.id),
    );
  }, [confirmDelete, treatments]);

  const toggleTreatmentSelection = (treatmentId: number) => {
    setSelectedTreatmentIds((prev) =>
      prev.includes(treatmentId)
        ? prev.filter((id) => id !== treatmentId)
        : [...prev, treatmentId],
    );
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete || selectedTreatmentIds.length === 0) return;

    try {
      await cancelTreatmentsMutation.mutateAsync({
        treatmentIds: selectedTreatmentIds,
        cancellationReason: `Treatment cancelled - ${cancellationReason.trim()}`,
      });
      await refetchTreatments();
      setConfirmDelete(null);
      setSelectedTreatmentIds([]);
      setCancellationReason("");
    } catch (error) {
      console.error("Failed to cancel treatments:", error);
      setConfirmDelete(null);
      setSelectedTreatmentIds([]);
      setCancellationReason("");
    }
  };

  const getActiveTreatments = () => {
    const activeTreatments = treatments.filter(
      (treatment) =>
        treatment.status === "scheduled" ||
        treatment.status === "active" ||
        treatment.status === "in_progress",
    );

    return {
      physiotherapy: activeTreatments.filter(
        (treatment) => treatment.treatmentType === "physiotherapy",
      ),
      tens: activeTreatments.filter(
        (treatment) => treatment.treatmentType === "tens",
      ),
    };
  };

  const groupedActiveTreatments = getActiveTreatments();

  // Implement pagination for physiotherapy sessions
  const {
    visibleItems: visiblePhysiotherapySessions,
    hasMoreItems: hasMorePhysiotherapy,
    showMore: showMorePhysiotherapy,
    totalItems: totalPhysiotherapy,
    visibleCount: visiblePhysiotherapyCount,
  } = usePagination({
    items: groupedActiveTreatments.physiotherapy,
    initialPageSize: 3,
    incrementSize: 10,
  });

  // Implement pagination for tens sessions
  const {
    visibleItems: visibleTensSessions,
    hasMoreItems: hasMoreTens,
    showMore: showMoreTens,
    totalItems: totalTens,
    visibleCount: visibleTensCount,
  } = usePagination({
    items: groupedActiveTreatments.tens,
    initialPageSize: 3,
    incrementSize: 10,
  });

  return (
    <Card>
      <CardBody>
        <DetailCardCollapsibleHeader
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
          title={
            <>
              <Activity
                className="h-5 w-5 shrink-0 text-gray-600"
                aria-hidden
              />
              Treatment Status
            </>
          }
        />

        {!isCollapsed && (
          <>
            {/* Cancel Error Display */}
            {cancelTreatmentsMutation.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">
                  Error cancelling treatment:{" "}
                  {cancelTreatmentsMutation.error.message}
                </p>
              </div>
            )}

            <TreatmentStatusOverview patient={patient} />

            {/* Active Treatment Progress */}
            <ActiveTreatments
              physiotherapySessions={groupedActiveTreatments.physiotherapy}
              tensSessions={groupedActiveTreatments.tens}
              visiblePhysiotherapySessions={visiblePhysiotherapySessions}
              visibleTensSessions={visibleTensSessions}
              hasMorePhysiotherapy={hasMorePhysiotherapy}
              hasMoreTens={hasMoreTens}
              showMorePhysiotherapy={showMorePhysiotherapy}
              showMoreTens={showMoreTens}
              totalPhysiotherapy={totalPhysiotherapy}
              totalTens={totalTens}
              visiblePhysiotherapyCount={visiblePhysiotherapyCount}
              visibleTensCount={visibleTensCount}
              treatmentsLoading={treatmentsLoading}
              onDeleteSession={handleCancelTreatments}
              isDeleting={cancelTreatmentsMutation.isPending}
              patientId={Number(patient.id)}
              patientName={patient.name}
              onOpenEditModal={(treatmentPlans, treatmentType) =>
                setEditModal({
                  treatmentPlans: treatmentPlans as TreatmentResponseDto[],
                  treatmentType,
                })
              }
            />

            {/* Current Recommendations */}
            <div className="border-t pt-4 border-gray-200">
              {currentRecommendations &&
              (currentRecommendations.homeExercises ||
                currentRecommendations.painManagement ||
                currentRecommendations.medications ||
                groupedActiveTreatments.physiotherapy.length > 0 ||
                groupedActiveTreatments.tens.length > 0 ||
                (currentRecommendations.returnWeeks &&
                  currentRecommendations.returnWeeks > 0)) ? (
                <TreatmentRecommendationsDisplay
                  recommendations={currentRecommendations}
                  physiotherapySessions={groupedActiveTreatments.physiotherapy}
                  tensSessions={groupedActiveTreatments.tens}
                />
              ) : (
                <TreatmentRecommendationsEmpty />
              )}
            </div>
          </>
        )}
      </CardBody>

      {/* Edit Treatment Modal */}
      {editModal && (
        <EditTreatmentModal
          isOpen={!!editModal}
          onClose={() => setEditModal(null)}
          treatmentType={editModal.treatmentType}
          treatmentPlans={editModal.treatmentPlans}
          patientId={Number(patient.id)}
          patientName={patient.name}
          onSuccess={() => refetchTreatments()}
        />
      )}

      {/* Confirmation Modal for Cancellation */}
      <ConfirmModal
        open={!!confirmDelete}
        title="Cancel Treatment"
        message={
          confirmDelete && (
            <>
              <div className="mb-4">
                Select the treatments of{" "}
                <span className="font-semibold">
                  {confirmDelete.sessionType}
                </span>{" "}
                you want to cancel:
              </div>
              <div className="mb-4 space-y-2 max-h-[280px] overflow-y-auto border border-gray-200 rounded-lg p-3">
                {treatmentsToCancel.map((treatment) => {
                  const isSelected = selectedTreatmentIds.includes(
                    treatment.id,
                  );
                  return (
                    <label
                      key={treatment.id}
                      className="flex items-start gap-3 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleTreatmentSelection(treatment.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {treatment.treatmentType === "physiotherapy"
                            ? "Physiotherapy"
                            : "TENS"}
                          : {treatment.bodyLocation}
                          {treatment.durationMinutes != null &&
                            ` (${treatment.durationMinutes} min)`}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <Field
                label={
                  <>
                    Reason for cancellation:{" "}
                    <span className="text-red-600">*</span>
                  </>
                }
                htmlFor="cancellation-reason"
                className="mb-4"
              >
                <Textarea
                  id="cancellation-reason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows={3}
                  placeholder="Enter the reason for cancellation..."
                  required
                />
              </Field>
              <div className="text-sm text-gray-600">
                The selected treatments will be marked as canceled and can be
                viewed in the patient&apos;s history.
              </div>
            </>
          )
        }
        confirmLabel={
          selectedTreatmentIds.length > 0
            ? `Cancel ${selectedTreatmentIds.length} treatment${selectedTreatmentIds.length > 1 ? "s" : ""}`
            : "Cancel Treatment"
        }
        confirmDisabled={
          selectedTreatmentIds.length === 0 || !cancellationReason.trim()
        }
        cancelLabel="Back"
        onCancel={() => {
          setConfirmDelete(null);
          setSelectedTreatmentIds([]);
          setCancellationReason("");
        }}
        onConfirm={handleConfirmDelete}
      />
    </Card>
  );
};
