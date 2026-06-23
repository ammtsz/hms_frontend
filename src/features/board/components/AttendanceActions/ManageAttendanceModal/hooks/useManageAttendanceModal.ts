import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  useCancellationModal,
  useCloseModal,
  useSetCancellationLoading,
} from "@/stores/modalStore";
import { useTreatmentsWithSessionRows } from "@/api/query/hooks/useTreatmentsWithSessionRows";
import {
  useBulkCancelAttendances,
  useBulkPostponeAttendances,
  useNextAvailableDate,
  useFetchAttendancePatientId,
  useRecomputeReturnForEpisode,
} from "@/api/query/hooks/useAttendanceQueries";
import { useToast } from "@/contexts/ToastContext";
import { useUpdatePatient } from "@/api/query/hooks/usePatientQueries";
import { PatientStatus } from "@/api/types";

export type AttendanceActionType = "cancel" | "postpone" | null;

export type PostponeMode = "next_available" | "by_date";

interface PostponeFeedbackData {
  mode: PostponeMode;
  successes: Array<{ attendanceId: number; newDate: string }>;
  failures: Array<{ attendanceId: number; error: string }>;
  autoRescheduledReturns: Array<{
    attendanceId: number;
    patientId: number;
    patientName: string;
    oldDate: string;
    newDate: string;
  }>;
  failedReturnReschedules: Array<{ attendanceId: number; error: string }>;
}

interface UseManageAttendanceModalState {
  isOpen: boolean;
  patientName?: string;
  action: AttendanceActionType;
  error: string;
  isSubmitting: boolean;
  loadingSessions: boolean;
  treatmentsWithSessionRows: ReturnType<typeof useTreatmentsWithSessionRows>["treatmentsWithSessionRows"];
  selectedAttendanceIds: number[];
  selectedDate: string;
  postponeMode: PostponeMode;
  reason: string;
  cancelAllOpenAttendances: boolean;
  cancelAllNewStatus: PatientStatus.DISCHARGED | PatientStatus.CONSECUTIVE_NO_SHOWS;
  nextAvailableDates: Record<string, string | null>;
  loadingNextAvailable: boolean;
  attendanceDate?: string;
  postponeFeedback: PostponeFeedbackData | null;
}

interface UseManageAttendanceModalHandlers {
  setAction: (action: AttendanceActionType) => void;
  handleBackToSelection: () => void;
  handleClose: () => void;
  toggleSelection: (attendanceId: number) => void;
  setReason: (reason: string) => void;
  setSelectedDate: (date: string) => void;
  setPostponeMode: (mode: PostponeMode) => void;
  setCancelAllOpenAttendances: (value: boolean) => void;
  setCancelAllNewStatus: (
    value: PatientStatus.DISCHARGED | PatientStatus.CONSECUTIVE_NO_SHOWS,
  ) => void;
  handleConfirmCancellation: (event: FormEvent) => Promise<void>;
  handleConfirmPostpone: (event: FormEvent) => Promise<void>;
  handleAcknowledgePostponeFeedback: () => void;
}

export interface UseManageAttendanceModalReturn {
  state: UseManageAttendanceModalState;
  handlers: UseManageAttendanceModalHandlers;
}

/**
 * Hook for managing attendance cancellation and reschedule modal
 * @param onRefresh - Optional callback to refresh data after successful operations
 */
export const useManageAttendanceModal = (
  onRefresh?: () => void
): UseManageAttendanceModalReturn => {
  const cancellationModal = useCancellationModal();
  const closeModal = useCloseModal();
  const setCancellationLoading = useSetCancellationLoading();
  const { showToast } = useToast();
  const fetchAttendancePatientId = useFetchAttendancePatientId();
  const bulkCancelMutation = useBulkCancelAttendances();
  const bulkPostponeMutation = useBulkPostponeAttendances();
  const recomputeReturnMutation = useRecomputeReturnForEpisode();
  const updatePatientMutation = useUpdatePatient();

  const [action, setAction] = useState<AttendanceActionType>(null);
  const [reason, setReason] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [postponeMode, setPostponeMode] = useState<PostponeMode>("next_available");
  const [error, setError] = useState<string>("");
  const [selectedAttendanceIds, setSelectedAttendanceIds] = useState<number[]>(
    [],
  );
  const [cancelAllOpenAttendances, setCancelAllOpenAttendances] = useState<boolean>(false);
  const [cancelAllNewStatus, setCancelAllNewStatus] = useState<
    PatientStatus.DISCHARGED | PatientStatus.CONSECUTIVE_NO_SHOWS
  >(PatientStatus.CONSECUTIVE_NO_SHOWS);
  const [postponeFeedback, setPostponeFeedback] =
    useState<PostponeFeedbackData | null>(null);

  const { treatmentsWithSessionRows, isLoading: loadingSessions } =
    useTreatmentsWithSessionRows(
      cancellationModal.isOpen && cancellationModal.attendanceIds?.length
        ? cancellationModal.attendanceIds
        : null,
    );

  const {
    data: nextAvailableDatesRaw = {},
    isLoading: loadingNextAvailable,
  } = useNextAvailableDate(
    action === "postpone" && postponeMode === "next_available" && selectedAttendanceIds.length > 0
      ? selectedAttendanceIds
      : null,
  );

  const nextAvailableDates = useMemo(() => {
    const out: Record<string, string | null> = {};
    for (const [id, date] of Object.entries(nextAvailableDatesRaw)) {
      out[String(id)] = date;
    }
    return out;
  }, [nextAvailableDatesRaw]);

  useEffect(() => {
    if (cancellationModal.attendanceIds) {
      setSelectedAttendanceIds(cancellationModal.attendanceIds);
    }
    if (!cancellationModal.isOpen) {
      setAction(null);
    }
  }, [cancellationModal.attendanceIds, cancellationModal.isOpen]);

  const resetState = useCallback(() => {
    setAction(null);
    setReason("");
    setSelectedDate("");
    setPostponeMode("next_available");
    setError("");
    setSelectedAttendanceIds([]);
    setCancelAllOpenAttendances(false);
    setCancelAllNewStatus(PatientStatus.CONSECUTIVE_NO_SHOWS);
    setPostponeFeedback(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    closeModal("cancellation");
  }, [closeModal, resetState]);

  const handleBackToSelection = useCallback(() => {
    setAction(null);
    setError("");
  }, []);

  const toggleSelection = useCallback((attendanceId: number) => {
    setSelectedAttendanceIds((previous) =>
      previous.includes(attendanceId)
        ? previous.filter((id) => id !== attendanceId)
        : [...previous, attendanceId],
    );
  }, []);

  const hasAnyWithoutDate = useMemo(
    () =>
      selectedAttendanceIds.some(
        (id) => nextAvailableDates[String(id)] == null
      ),
    [selectedAttendanceIds, nextAvailableDates],
  );

  const handleConfirmCancellation = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (selectedAttendanceIds.length === 0) {
        const msg = "Select at least one attendance to cancel.";
        setError(msg);
        showToast(msg, "error", 5000);
        return;
      }

      setCancellationLoading(true);
      setError("");

      try {
        const trimmedReason = reason.trim();

        if (cancelAllOpenAttendances) {
          if (!trimmedReason) {
            const msg = "Provide a cancellation reason when cancelling all attendances.";
            setError(msg);
            showToast(msg, "error", 5000);
            return;
          }

          let patientId: number;
          try {
            const result = await fetchAttendancePatientId(selectedAttendanceIds[0]);
            patientId = result.patientId;
          } catch (fetchError) {
            const msg =
              fetchError instanceof Error
                ? fetchError.message
                : "Failed to load selected attendance data.";
            setError(msg);
            showToast(msg, "error", 7000);
            return;
          }

          await updatePatientMutation.mutateAsync({
            patientId: String(patientId),
            data: {
              patientStatus: cancelAllNewStatus,
              cancellationReason: trimmedReason,
            },
          });

          showToast("All attendances canceled successfully.", "success");
          handleClose();
          if (onRefresh) onRefresh();
        } else {
          const result = await bulkCancelMutation.mutateAsync({
            attendanceIds: selectedAttendanceIds,
            cancellationReason: trimmedReason || undefined,
          });

          if (result && result.failureCount > 0) {
            const failureMessages = result.failures
              .map((failure) => `ID ${failure.attendanceId}: ${failure.error}`)
              .join(", ");
            const errorMsg = `${result.successCount} cancelled, ${result.failureCount} failed: ${failureMessages}`;
            setError(errorMsg);
            showToast(errorMsg, "error", 7000);
            if (onRefresh) onRefresh();
          } else {
            showToast("Cancellation completed successfully.", "success");
            handleClose();
            if (onRefresh) onRefresh();
          }
        }
      } catch (mutationError) {
        console.error("Error cancelling attendances:", mutationError);
        const errorMsg =
          mutationError instanceof Error
            ? mutationError.message
            : "Error cancelling attendances. Please try again.";
        setError(errorMsg);
        showToast(errorMsg, "error", 7000);
      } finally {
        setCancellationLoading(false);
      }
    },
    [
      bulkCancelMutation,
      handleClose,
      onRefresh,
      fetchAttendancePatientId,
      reason,
      selectedAttendanceIds,
      setCancellationLoading,
      showToast,
      cancelAllOpenAttendances,
      cancelAllNewStatus,
      updatePatientMutation,
    ],
  );

  const handleConfirmPostpone = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (selectedAttendanceIds.length === 0) {
        const msg = "Select at least one attendance to reschedule.";
        setError(msg);
        showToast(msg, "error", 5000);
        return;
      }

      if (postponeMode === "by_date" && !selectedDate) {
        const msg = "Select a valid date.";
        setError(msg);
        showToast(msg, "error", 5000);
        return;
      }

      if (
        postponeMode === "next_available" &&
        (loadingNextAvailable || hasAnyWithoutDate)
      ) {
        if (hasAnyWithoutDate) {
          const msg =
            "One or more attendances have no available date within 52 weeks. Choose another option.";
          setError(msg);
          showToast(msg, "error", 5000);
        }
        return;
      }

      setCancellationLoading(true);
      setError("");

      try {
        const successes: Array<{ attendanceId: number; newDate: string }> = [];
        const failures: Array<{ attendanceId: number; error: string }> = [];
        const autoRescheduledReturns: Array<{
          attendanceId: number;
          patientId: number;
          patientName: string;
          oldDate: string;
          newDate: string;
        }> = [];
        const failedReturnReschedules: Array<{
          attendanceId: number;
          error: string;
        }> = [];

        if (postponeMode === "next_available") {
          // Group by target date so each unique date is one API call.
          // rescheduleReturnAssessment is intentionally false here: return date logic runs
          // once after ALL postpones via recomputeReturnForEpisode, so it sees the true
          // max session date across all treatment plans (avoids ping-pong when plans go to
          // different dates and each call would overwrite the return with a stale anchor).
          const byDate = new Map<string, number[]>();
          for (const id of selectedAttendanceIds) {
            const date = nextAvailableDates[String(id)];
            if (date != null) {
              const list = byDate.get(date) ?? [];
              list.push(id);
              byDate.set(date, list);
            }
          }
          let anySuccessfulTreatmentAttendanceId: number | null = null;
          for (const [date, ids] of byDate) {
            const result = await bulkPostponeMutation.mutateAsync({
              attendanceIds: ids,
              newDate: date,
              rescheduleReturnAssessment: false,
            });
            successes.push(...(result?.successes ?? []));
            failures.push(...(result?.failures ?? []));
            if ((result?.successes?.length ?? 0) > 0 && anySuccessfulTreatmentAttendanceId === null) {
              anySuccessfulTreatmentAttendanceId = result?.successes?.[0]?.attendanceId ?? null;
            }
          }
          // After all postpones are committed, recompute the return date once from DB state.
          if (anySuccessfulTreatmentAttendanceId !== null) {
            try {
              const recomputeResult = await recomputeReturnMutation.mutateAsync(
                anySuccessfulTreatmentAttendanceId,
              );
              if (recomputeResult.rescheduled && recomputeResult.attendanceId != null) {
                autoRescheduledReturns.push({
                  attendanceId: recomputeResult.attendanceId,
                  patientId: recomputeResult.patientId ?? 0,
                  patientName: recomputeResult.patientName ?? "Patient",
                  oldDate: recomputeResult.oldDate ?? "",
                  newDate: recomputeResult.newDate ?? "",
                });
              }
            } catch {
              // Non-fatal: treatment dates were moved correctly; return date recompute failed.
              // User can retry or update manually.
            }
          }
        } else {
          const result = await bulkPostponeMutation.mutateAsync({
            attendanceIds: selectedAttendanceIds,
            newDate: selectedDate,
            rescheduleReturnAssessment: false,
          });
          successes.push(...(result?.successes ?? []));
          failures.push(...(result?.failures ?? []));
          autoRescheduledReturns.push(...(result?.autoRescheduledReturns ?? []));
          failedReturnReschedules.push(
            ...(result?.failedReturnReschedules ?? []),
          );
        }

        setPostponeFeedback({
          mode: postponeMode,
          successes,
          failures,
          autoRescheduledReturns,
          failedReturnReschedules,
        });
      } catch (mutationError) {
        console.error("Error rescheduling attendances:", mutationError);
        const errorMsg =
          mutationError instanceof Error
            ? mutationError.message
            : "Error rescheduling attendances. Please try again.";
        setError(errorMsg);
        showToast(errorMsg, "error", 7000);
      } finally {
        setCancellationLoading(false);
      }
    },
    [
      bulkPostponeMutation,
      recomputeReturnMutation,
      hasAnyWithoutDate,
      loadingNextAvailable,
      nextAvailableDates,
      postponeMode,
      selectedAttendanceIds,
      selectedDate,
      setCancellationLoading,
      showToast,
    ],
  );

  const handleSetPostponeMode = useCallback((mode: PostponeMode) => {
    setPostponeMode(mode);
    if (mode === "by_date") {
      setSelectedDate("");
    }
  }, []);

  const handleAcknowledgePostponeFeedback = useCallback(() => {
    handleClose();
    if (onRefresh) onRefresh();
  }, [handleClose, onRefresh]);

  return {
    state: {
      isOpen: cancellationModal.isOpen,
      patientName: cancellationModal.patientName,
      action,
      error,
      isSubmitting: Boolean(cancellationModal.isLoading),
      loadingSessions,
      treatmentsWithSessionRows,
      selectedAttendanceIds,
      selectedDate,
      postponeMode,
      reason,
      cancelAllOpenAttendances,
      cancelAllNewStatus,
      nextAvailableDates,
      loadingNextAvailable,
      postponeFeedback,
      attendanceDate: cancellationModal.attendanceDate,
    },
    handlers: {
      setAction,
      handleBackToSelection,
      handleClose,
      toggleSelection,
      setReason,
      setSelectedDate,
      setPostponeMode: handleSetPostponeMode,
      setCancelAllOpenAttendances,
      setCancelAllNewStatus,
      handleConfirmCancellation,
      handleConfirmPostpone,
      handleAcknowledgePostponeFeedback,
    },
  };
};
