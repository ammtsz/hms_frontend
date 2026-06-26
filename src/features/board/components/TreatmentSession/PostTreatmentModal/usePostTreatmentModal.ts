import { useState, useEffect, useMemo, useCallback } from "react";
import { useCloseModal, usePostTreatmentModal } from "@/stores/modalStore";
import { useTreatmentsByPatient } from "@/api/query/hooks/useTreatmentsQueries";
import {
  useSessionsByAppointments,
  useSessionsByPatient,
  useCompleteSession,
} from "@/api/query/hooks/useSessionsQueries";
import { useCompleteAppointment, useDeleteAppointment } from "@/api/query/hooks/useAppointmentQueries";
import type { PostTreatmentRow } from "./types";
import {
  groupPatientSessionsByTreatmentPlan,
  resolveTreatmentPlanSessionHistory,
} from "./postTreatmentSession.utils";

export function usePostTreatmentModalHook() {
  const [completedAppointmentIds, setCompletedAppointmentIds] = useState<
    Set<number>
  >(new Set());
  const [cancellationReasons, setCancellationReasons] = useState<
    Map<number, string>
  >(new Map());
  const [generalNotes, setGeneralNotes] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const postTreatment = usePostTreatmentModal();
  const closeModal = useCloseModal();
  const appointmentIds = useMemo(
    () => postTreatment.appointmentIds ?? [],
    [postTreatment.appointmentIds],
  );
  const patientId = postTreatment.patientId ?? 0;
  const patientName = postTreatment.patientName ?? "";
  const onComplete = postTreatment.onComplete;

  const {
    dataByAppointment,
    isLoading: sessionRowsLoading,
    isError: sessionRowsError,
    refetch: refetchSessionRows,
  } = useSessionsByAppointments(appointmentIds);
  const patientSessionsQueryId =
    postTreatment.isOpen && patientId > 0 ? patientId.toString() : "";
  const {
    data: patientSessions = [],
    isLoading: patientSessionsLoading,
    isError: patientSessionsError,
    refetch: refetchPatientSessions,
  } = useSessionsByPatient(patientSessionsQueryId);
  const {
    treatments,
    loading: treatmentsLoading,
    error: treatmentsError,
    refetch: refetchTreatments,
  } = useTreatmentsByPatient(patientId);
  const completeSessionMutation = useCompleteSession();
  const completeAppointmentMutation = useCompleteAppointment();
  const deleteAppointmentMutation = useDeleteAppointment();

  const isSubmitting =
    completeSessionMutation.isPending ||
    completeAppointmentMutation.isPending ||
    deleteAppointmentMutation.isPending;

  useEffect(() => {
    if (postTreatment.isOpen && appointmentIds.length > 0) {
      setCompletedAppointmentIds(new Set(appointmentIds));
      setCancellationReasons(new Map());
      setGeneralNotes("");
      setSubmitError(null);
    }
  }, [postTreatment.isOpen, appointmentIds]);

  const rows = useMemo((): PostTreatmentRow[] => {
    const result: PostTreatmentRow[] = [];
    const patientHistoryByTreatmentPlan =
      groupPatientSessionsByTreatmentPlan(patientSessions);

    appointmentIds.forEach((appointmentId) => {
      const sessionRows = dataByAppointment.get(appointmentId) ?? [];
      const scheduledSessionRow = sessionRows.find((r) => r.status === "scheduled");
      if (!scheduledSessionRow) return;

      const treatment = treatments.find(
        (t) => t.id === scheduledSessionRow.treatmentId,
      );
      if (!treatment) return;

      const allSessions = resolveTreatmentPlanSessionHistory(
        patientHistoryByTreatmentPlan,
        treatment.id,
        sessionRows,
      );
      result.push({
        appointmentId,
        treatmentType: treatment.treatmentType as "physiotherapy" | "tens",
        bodyLocation: treatment.bodyLocation,
        durationMinutes: treatment.durationMinutes,
        plannedSessions: treatment.plannedSessions,
        completedSessions: treatment.completedSessions,
        sessionNumber: scheduledSessionRow.sessionNumber,
        treatmentId: treatment.id,
        sessionRow: scheduledSessionRow,
        treatment,
        allSessions,
      });
    });
    return result;
  }, [appointmentIds, dataByAppointment, treatments, patientSessions]);

  const rowsByType = useMemo(() => {
    const physiotherapy: PostTreatmentRow[] = [];
    const tens: PostTreatmentRow[] = [];
    rows.forEach((row) => {
      if (row.treatmentType === "physiotherapy") physiotherapy.push(row);
      else tens.push(row);
    });
    return { physiotherapy: physiotherapy, tens } as const;
  }, [rows]);

  const toggleRow = useCallback((appointmentId: number) => {
    setCompletedAppointmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(appointmentId)) {
        next.delete(appointmentId);
      } else {
        next.add(appointmentId);
      }
      return next;
    });
    setCancellationReasons((prev) => {
      const next = new Map(prev);
      if (next.has(appointmentId)) next.delete(appointmentId);
      return next;
    });
  }, []);

  const setCancellationReason = useCallback((appointmentId: number, value: string) => {
    setCancellationReasons((prev) => {
      const next = new Map(prev);
      next.set(appointmentId, value);
      return next;
    });
  }, []);

  const loading =
    sessionRowsLoading || patientSessionsLoading || treatmentsLoading;
  const error =
    sessionRowsError ||
    patientSessionsError ||
    treatmentsError ||
    null;

  const canSubmit =
    !loading &&
    !error &&
    rows.length > 0 &&
    completedAppointmentIds.size > 0;
  const uncheckedWithMissingReason = Array.from(appointmentIds).some(
    (id) =>
      !completedAppointmentIds.has(id) && !cancellationReasons.get(id)?.trim(),
  );

  const handleClose = useCallback(() => {
    setCompletedAppointmentIds(new Set());
    setCancellationReasons(new Map());
    setGeneralNotes("");
    setSubmitError(null);
    closeModal("postTreatment");
  }, [closeModal]);

  const handleSubmit = useCallback(async () => {
    if (error) {
      setSubmitError("Please fix the error before submitting. Use \"Try Again\" if necessary.");
      return;
    }
    if (rows.length === 0) {
      setSubmitError("No treatment available to register.");
      return;
    }
    if (!canSubmit) {
      setSubmitError("Please mark at least one treatment as completed.");
      return;
    }
    if (uncheckedWithMissingReason) {
      setSubmitError("Please provide a reason for each incomplete treatment.");
      return;
    }

    setSubmitError(null);

    try {
      for (const row of rows) {
        if (completedAppointmentIds.has(row.appointmentId)) {
          await completeSessionMutation.mutateAsync({
            sessionRowId: row.sessionRow.id.toString(),
            treatmentId: row.treatmentId.toString(),
            completionData: { notes: generalNotes || "" },
            newCompletedCount: row.completedSessions + 1,
          });
          await completeAppointmentMutation.mutateAsync({
            id: row.appointmentId.toString(),
          });
        } else {
          const reason =
            cancellationReasons.get(row.appointmentId)?.trim() ||
            "NNot completed in this session";
          await deleteAppointmentMutation.mutateAsync({
            appointmentId: row.appointmentId,
            cancellationReason: reason,
          });
        }
      }

      const completedIds = rows
        .filter((r) => completedAppointmentIds.has(r.appointmentId))
        .map((r) => r.appointmentId);
      onComplete?.(completedIds);
      handleClose();
    } catch (error) {
      console.error("Error in PostTreatmentModal submit:", error);
      setSubmitError("Error submitting. Please try again.");
    }
  }, [
    error,
    canSubmit,
    uncheckedWithMissingReason,
    rows,
    completedAppointmentIds,
    cancellationReasons,
    generalNotes,
    onComplete,
    handleClose,
    completeSessionMutation,
    completeAppointmentMutation,
    deleteAppointmentMutation,
  ]);

  const onRetry = useCallback(async () => {
    await Promise.all([
      refetchSessionRows(),
      refetchPatientSessions(),
      refetchTreatments(),
    ]);
  }, [refetchSessionRows, refetchPatientSessions, refetchTreatments]);

  const isSubmitDisabled =
    !canSubmit || uncheckedWithMissingReason || isSubmitting;

  return {
    isOpen: postTreatment.isOpen,
    patientName,
    appointmentIds,
    rows,
    rowsByType,
    completedAppointmentIds,
    cancellationReasons,
    generalNotes,
    setGeneralNotes,
    submitError,
    loading,
    error,
    isSubmitting,
    canSubmit,
    isSubmitDisabled,
    uncheckedWithMissingReason,
    toggleRow,
    setCancellationReason,
    handleSubmit,
    handleClose,
    onRetry,
  };
}
