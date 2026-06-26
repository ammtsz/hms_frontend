"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import { Button } from "@/components/ui";
import TreatmentRecommendationTable from "../TreatmentRecommendations/TreatmentRecommendationTable";
import type { TreatmentRecommendationTableRef } from "../TreatmentRecommendations/TreatmentRecommendationTable";
import type { LocationTreatment } from "../Consultation/types";
import type { TreatmentResponseDto } from "@/api/types";
import { useEditTreatments } from "@/api/query/hooks/useTreatmentsQueries";
import { canAddNewTreatmentRow } from "../Cards/ExpandedTreatmentDetails.utils";
import { getDefaultDurationForTreatmentType } from "@/constants/treatment";

/** Re-enable when multi-row edit + scheduling (e.g. endOfDay) is aligned. */
export const IS_ADD_TREATMENT_ROW_IN_EDIT_MODAL_ENABLED = false;

function treatmentPlansToInitialState(
  treatmentPlans: TreatmentResponseDto[],
): {
  treatments: LocationTreatment[];
  initialEditSessionIds: number[];
} {
  const treatments: LocationTreatment[] = treatmentPlans.map((plan) => ({
    locations: [plan.bodyLocation],
    quantity: plan.plannedSessions,
    startDate: plan.startDate,
    duration:
      plan.durationMinutes ??
      getDefaultDurationForTreatmentType(plan.treatmentType),
  }));
  const initialEditSessionIds = treatmentPlans.map((plan) => plan.id);
  return { treatments, initialEditSessionIds };
}

export interface EditTreatmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  treatmentType: "physiotherapy" | "tens";
  /** Treatment plan rows (`hms_treatment`) opened for editing */
  treatmentPlans: TreatmentResponseDto[];
  patientId: number;
  patientName: string;
  onSuccess?: () => void;
  currentAppointmentId?: number;
}

export const EditTreatmentModal: React.FC<EditTreatmentModalProps> = ({
  isOpen,
  onClose,
  treatmentType,
  treatmentPlans,
  patientId,
  patientName,
  onSuccess,
  currentAppointmentId,
}) => {
  const treatmentFormRef = useRef<TreatmentRecommendationTableRef>(null);
  const firstSession = treatmentPlans[0];
  const { treatments: initialTreatments, initialEditSessionIds } = useMemo(
    () =>
      firstSession
        ? treatmentPlansToInitialState(treatmentPlans)
        : { treatments: [], initialEditSessionIds: [] },
    [treatmentPlans, firstSession],
  );

  const [treatments, setTreatments] = useState<LocationTreatment[]>(
    initialTreatments,
  );
  const [editSessionIds, setEditSessionIds] = useState<(number | undefined)[]>(
    initialEditSessionIds,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const saveMutation = useEditTreatments({
    treatmentType,
    firstSession,
    patientId,
    currentAppointmentId,
    onSuccess,
    onClose,
    setSubmitError,
  });

  const isSubmitting = saveMutation.isPending;

  const allowAddTreatmentRow = useMemo(
    () => canAddNewTreatmentRow(treatmentPlans),
    [treatmentPlans],
  );

  React.useEffect(() => {
    if (isOpen && firstSession) {
      const { treatments: t, initialEditSessionIds: ids } =
        treatmentPlansToInitialState(treatmentPlans);
      setTreatments(t);
      setEditSessionIds(ids);
      setSubmitError(null);
    }
  }, [isOpen, treatmentPlans, firstSession]);

  const handleChange = useCallback(
    (
      newTreatments: LocationTreatment[],
      newEditSessionIds?: (number | undefined)[],
    ) => {
      setTreatments(newTreatments);
      if (newEditSessionIds !== undefined) {
        setEditSessionIds(newEditSessionIds);
      }
    },
    [],
  );

  const validateRows = useCallback((): string | null => {
    for (let i = 0; i < treatments.length; i++) {
      const t = treatments[i];
      if (!t.locations.length || t.locations.some((l) => !l.trim())) {
        return "Fill in the body location for all rows.";
      }
    }
    return null;
  }, [treatments]);

  const handleSubmit = useCallback(async () => {
    if (!firstSession) return;
    const err = validateRows();
    if (err) {
      setSubmitError(err);
      return;
    }
    setSubmitError(null);
    try {
      await saveMutation.mutateAsync({ treatments, editSessionIds });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Error updating treatment.",
      );
    }
  }, [firstSession, validateRows, saveMutation, treatments, editSessionIds]);

  const defaultQuantity = firstSession?.plannedSessions ?? 1;
  const title =
    treatmentType === "physiotherapy" ? "Edit Physiotherapy" : "Edit TENS";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={`${patientName} — Edit the body location and duration. The quantity and start date cannot be changed.`}
      maxWidth="4xl"
      preventOverflow
    >
      <div className="p-4 flex flex-col gap-4 max-h-[70vh] overflow-y-auto min-h-[400px] justify-between">
        <div className={`${submitError ? "mt-0" : "mt-4"}`}>
          {submitError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">
              {submitError}
            </div>
          )}
          <TreatmentRecommendationTable
            ref={treatmentFormRef}
            treatmentType={treatmentType}
            treatments={treatments}
            onChange={handleChange}
            defaultQuantity={defaultQuantity}
            mode="edit"
            initialEditSessionIds={initialEditSessionIds}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          {IS_ADD_TREATMENT_ROW_IN_EDIT_MODAL_ENABLED && (
            <Button
              type="button"
              variant="outline"
              data-testid="edit-treatment-modal-add-row"
              onClick={() => treatmentFormRef.current?.addRow()}
              disabled={isSubmitting || !allowAddTreatmentRow}
            >
              Add body location
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            loadingText="Saving..."
          >
            Save
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default EditTreatmentModal;
