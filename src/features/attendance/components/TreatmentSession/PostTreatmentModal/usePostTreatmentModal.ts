import { useState, useEffect, useMemo, useCallback } from "react";
import { useCloseModal, usePostTreatmentModal } from "@/stores/modalStore";
import { useTreatmentsByPatient } from "@/api/query/hooks/useTreatmentsQueries";
import {
  useSessionsByAttendances,
  useSessionsByPatient,
  useCompleteSession,
} from "@/api/query/hooks/useSessionsQueries";
import { useCompleteAttendance, useDeleteAttendance } from "@/api/query/hooks/useAttendanceQueries";
import type { PostTreatmentRow } from "./types";
import {
  groupPatientSessionsByTreatmentPlan,
  resolveTreatmentPlanSessionHistory,
} from "./postTreatmentSession.utils";

export function usePostTreatmentModalHook() {
  const [completedAttendanceIds, setCompletedAttendanceIds] = useState<
    Set<number>
  >(new Set());
  const [cancellationReasons, setCancellationReasons] = useState<
    Map<number, string>
  >(new Map());
  const [generalNotes, setGeneralNotes] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const postTreatment = usePostTreatmentModal();
  const closeModal = useCloseModal();
  const attendanceIds = useMemo(
    () => postTreatment.attendanceIds ?? [],
    [postTreatment.attendanceIds],
  );
  const patientId = postTreatment.patientId ?? 0;
  const patientName = postTreatment.patientName ?? "";
  const onComplete = postTreatment.onComplete;

  const {
    dataByAttendance,
    isLoading: sessionRowsLoading,
    isError: sessionRowsError,
    refetch: refetchSessionRows,
  } = useSessionsByAttendances(attendanceIds);
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
  const completeAttendanceMutation = useCompleteAttendance();
  const deleteAttendanceMutation = useDeleteAttendance();

  const isSubmitting =
    completeSessionMutation.isPending ||
    completeAttendanceMutation.isPending ||
    deleteAttendanceMutation.isPending;

  useEffect(() => {
    if (postTreatment.isOpen && attendanceIds.length > 0) {
      setCompletedAttendanceIds(new Set(attendanceIds));
      setCancellationReasons(new Map());
      setGeneralNotes("");
      setSubmitError(null);
    }
  }, [postTreatment.isOpen, attendanceIds]);

  const rows = useMemo((): PostTreatmentRow[] => {
    const result: PostTreatmentRow[] = [];
    const patientHistoryByTreatmentPlan =
      groupPatientSessionsByTreatmentPlan(patientSessions);

    attendanceIds.forEach((attendanceId) => {
      const sessionRows = dataByAttendance.get(attendanceId) ?? [];
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
        attendanceId,
        treatmentType: treatment.treatmentType as "physiotherapy" | "tens",
        bodyLocation: treatment.bodyLocation,
        color: treatment.color,
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
  }, [attendanceIds, dataByAttendance, treatments, patientSessions]);

  const rowsByType = useMemo(() => {
    const physiotherapy: PostTreatmentRow[] = [];
    const tens: PostTreatmentRow[] = [];
    rows.forEach((row) => {
      if (row.treatmentType === "physiotherapy") physiotherapy.push(row);
      else tens.push(row);
    });
    return { physiotherapy: physiotherapy, tens } as const;
  }, [rows]);

  const toggleRow = useCallback((attendanceId: number) => {
    setCompletedAttendanceIds((prev) => {
      const next = new Set(prev);
      if (next.has(attendanceId)) {
        next.delete(attendanceId);
      } else {
        next.add(attendanceId);
      }
      return next;
    });
    setCancellationReasons((prev) => {
      const next = new Map(prev);
      if (next.has(attendanceId)) next.delete(attendanceId);
      return next;
    });
  }, []);

  const setCancellationReason = useCallback((attendanceId: number, value: string) => {
    setCancellationReasons((prev) => {
      const next = new Map(prev);
      next.set(attendanceId, value);
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
    completedAttendanceIds.size > 0;
  const uncheckedWithMissingReason = Array.from(attendanceIds).some(
    (id) =>
      !completedAttendanceIds.has(id) && !cancellationReasons.get(id)?.trim(),
  );

  const handleClose = useCallback(() => {
    setCompletedAttendanceIds(new Set());
    setCancellationReasons(new Map());
    setGeneralNotes("");
    setSubmitError(null);
    closeModal("postTreatment");
  }, [closeModal]);

  const handleSubmit = useCallback(async () => {
    if (error) {
      setSubmitError("Corrija o erro antes de registrar. Use \"Tentar Novamente\" se necessário.");
      return;
    }
    if (rows.length === 0) {
      setSubmitError("Nenhum tratamento disponível para registrar.");
      return;
    }
    if (!canSubmit) {
      setSubmitError("Marque pelo menos um tratamento como realizado.");
      return;
    }
    if (uncheckedWithMissingReason) {
      setSubmitError("Informe o motivo para cada tratamento não realizado.");
      return;
    }

    setSubmitError(null);

    try {
      for (const row of rows) {
        if (completedAttendanceIds.has(row.attendanceId)) {
          await completeSessionMutation.mutateAsync({
            sessionRowId: row.sessionRow.id.toString(),
            treatmentId: row.treatmentId.toString(),
            completionData: { notes: generalNotes || "" },
            newCompletedCount: row.completedSessions + 1,
          });
          await completeAttendanceMutation.mutateAsync({
            id: row.attendanceId.toString(),
          });
        } else {
          const reason =
            cancellationReasons.get(row.attendanceId)?.trim() ||
            "Não realizado nesta sessão";
          await deleteAttendanceMutation.mutateAsync({
            attendanceId: row.attendanceId,
            cancellationReason: reason,
          });
        }
      }

      const completedIds = rows
        .filter((r) => completedAttendanceIds.has(r.attendanceId))
        .map((r) => r.attendanceId);
      onComplete?.(completedIds);
      handleClose();
    } catch (error) {
      console.error("Error in PostTreatmentModal submit:", error);
      setSubmitError("Erro ao registrar. Tente novamente.");
    }
  }, [
    error,
    canSubmit,
    uncheckedWithMissingReason,
    rows,
    completedAttendanceIds,
    cancellationReasons,
    generalNotes,
    onComplete,
    handleClose,
    completeSessionMutation,
    completeAttendanceMutation,
    deleteAttendanceMutation,
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
    attendanceIds,
    rows,
    rowsByType,
    completedAttendanceIds,
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
