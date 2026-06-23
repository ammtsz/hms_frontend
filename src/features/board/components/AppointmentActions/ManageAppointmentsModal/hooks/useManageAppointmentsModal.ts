import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  useCancellationModal,
  useCloseModal,
  useSetCancellationLoading,
} from "@/stores/modalStore";
import { useTreatmentsWithSessionRows } from "@/api/query/hooks/useTreatmentsWithSessionRows";
import {
  useBulkCancelAppointments,
  useBulkPostponeAppointments,
  useNextAvailableDate,
  useFetchAppointmentPatientId,
  useRecomputeReturnForEpisode,
} from "@/api/query/hooks/useAppointmentQueries";
import { useToast } from "@/contexts/ToastContext";
import { useUpdatePatient } from "@/api/query/hooks/usePatientQueries";
import { PatientStatus } from "@/api/types";

export type AppointmentActionType = "cancel" | "postpone" | null;

export type PostponeMode = "next_available" | "by_date";

interface PostponeFeedbackData {
  mode: PostponeMode;
  successes: Array<{ appointmentId: number; newDate: string }>;
  failures: Array<{ appointmentId: number; error: string }>;
  autoRescheduledReturns: Array<{
    appointmentId: number;
    patientId: number;
    patientName: string;
    oldDate: string;
    newDate: string;
  }>;
  failedReturnReschedules: Array<{ appointmentId: number; error: string }>;
}

interface UseManageAppointmentsModalState {
  isOpen: boolean;
  patientName?: string;
  action: AppointmentActionType;
  error: string;
  isSubmitting: boolean;
  loadingSessions: boolean;
  treatmentsWithSessionRows: ReturnType<typeof useTreatmentsWithSessionRows>["treatmentsWithSessionRows"];
  selectedAppointmentIds: number[];
  selectedDate: string;
  postponeMode: PostponeMode;
  reason: string;
  cancelAllOpenAppointments: boolean;
  cancelAllNewStatus: PatientStatus.DISCHARGED | PatientStatus.CONSECUTIVE_NO_SHOWS;
  nextAvailableDates: Record<string, string | null>;
  loadingNextAvailable: boolean;
  appointmentDate?: string;
  postponeFeedback: PostponeFeedbackData | null;
}

interface UseManageAppointmentsModalHandlers {
  setAction: (action: AppointmentActionType) => void;
  handleBackToSelection: () => void;
  handleClose: () => void;
  toggleSelection: (appointmentId: number) => void;
  setReason: (reason: string) => void;
  setSelectedDate: (date: string) => void;
  setPostponeMode: (mode: PostponeMode) => void;
  setCancelAllOpenAppointments: (value: boolean) => void;
  setCancelAllNewStatus: (
    value: PatientStatus.DISCHARGED | PatientStatus.CONSECUTIVE_NO_SHOWS,
  ) => void;
  handleConfirmCancellation: (event: FormEvent) => Promise<void>;
  handleConfirmPostpone: (event: FormEvent) => Promise<void>;
  handleAcknowledgePostponeFeedback: () => void;
}

export interface UseManageAppointmentsModalReturn {
  state: UseManageAppointmentsModalState;
  handlers: UseManageAppointmentsModalHandlers;
}

/**
 * Hook for managing appointment cancellation and reschedule modal
 * @param onRefresh - Optional callback to refresh data after successful operations
 */
export const useManageAppointmentsModal = (
  onRefresh?: () => void
): UseManageAppointmentsModalReturn => {
  const cancellationModal = useCancellationModal();
  const closeModal = useCloseModal();
  const setCancellationLoading = useSetCancellationLoading();
  const { showToast } = useToast();
  const fetchAppointmentPatientId = useFetchAppointmentPatientId();
  const bulkCancelMutation = useBulkCancelAppointments();
  const bulkPostponeMutation = useBulkPostponeAppointments();
  const recomputeReturnMutation = useRecomputeReturnForEpisode();
  const updatePatientMutation = useUpdatePatient();

  const [action, setAction] = useState<AppointmentActionType>(null);
  const [reason, setReason] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [postponeMode, setPostponeMode] = useState<PostponeMode>("next_available");
  const [error, setError] = useState<string>("");
  const [selectedAppointmentIds, setSelectedAppointmentIds] = useState<number[]>(
    [],
  );
  const [cancelAllOpenAppointments, setCancelAllOpenAppointments] = useState<boolean>(false);
  const [cancelAllNewStatus, setCancelAllNewStatus] = useState<
    PatientStatus.DISCHARGED | PatientStatus.CONSECUTIVE_NO_SHOWS
  >(PatientStatus.CONSECUTIVE_NO_SHOWS);
  const [postponeFeedback, setPostponeFeedback] =
    useState<PostponeFeedbackData | null>(null);

  const { treatmentsWithSessionRows, isLoading: loadingSessions } =
    useTreatmentsWithSessionRows(
      cancellationModal.isOpen && cancellationModal.appointmentIds?.length
        ? cancellationModal.appointmentIds
        : null,
    );

  const {
    data: nextAvailableDatesRaw = {},
    isLoading: loadingNextAvailable,
  } = useNextAvailableDate(
    action === "postpone" && postponeMode === "next_available" && selectedAppointmentIds.length > 0
      ? selectedAppointmentIds
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
    if (cancellationModal.appointmentIds) {
      setSelectedAppointmentIds(cancellationModal.appointmentIds);
    }
    if (!cancellationModal.isOpen) {
      setAction(null);
    }
  }, [cancellationModal.appointmentIds, cancellationModal.isOpen]);

  const resetState = useCallback(() => {
    setAction(null);
    setReason("");
    setSelectedDate("");
    setPostponeMode("next_available");
    setError("");
    setSelectedAppointmentIds([]);
    setCancelAllOpenAppointments(false);
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

  const toggleSelection = useCallback((appointmentId: number) => {
    setSelectedAppointmentIds((previous) =>
      previous.includes(appointmentId)
        ? previous.filter((id) => id !== appointmentId)
        : [...previous, appointmentId],
    );
  }, []);

  const hasAnyWithoutDate = useMemo(
    () =>
      selectedAppointmentIds.some(
        (id) => nextAvailableDates[String(id)] == null
      ),
    [selectedAppointmentIds, nextAvailableDates],
  );

  const handleConfirmCancellation = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (selectedAppointmentIds.length === 0) {
        const msg = "Select at least one appointment to cancel.";
        setError(msg);
        showToast(msg, "error", 5000);
        return;
      }

      setCancellationLoading(true);
      setError("");

      try {
        const trimmedReason = reason.trim();

        if (cancelAllOpenAppointments) {
          if (!trimmedReason) {
            const msg = "Provide a cancellation reason when cancelling all appointments.";
            setError(msg);
            showToast(msg, "error", 5000);
            return;
          }

          let patientId: number;
          try {
            const result = await fetchAppointmentPatientId(selectedAppointmentIds[0]);
            patientId = result.patientId;
          } catch (fetchError) {
            const msg =
              fetchError instanceof Error
                ? fetchError.message
                : "Failed to load selected appointment data.";
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

          showToast("All appointments canceled successfully.", "success");
          handleClose();
          if (onRefresh) onRefresh();
        } else {
          const result = await bulkCancelMutation.mutateAsync({
            appointmentIds: selectedAppointmentIds,
            cancellationReason: trimmedReason || undefined,
          });

          if (result && result.failureCount > 0) {
            const failureMessages = result.failures
              .map((failure) => `ID ${failure.appointmentId}: ${failure.error}`)
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
        console.error("Error cancelling appointments:", mutationError);
        const errorMsg =
          mutationError instanceof Error
            ? mutationError.message
            : "Error cancelling appointments. Please try again.";
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
      fetchAppointmentPatientId,
      reason,
      selectedAppointmentIds,
      setCancellationLoading,
      showToast,
      cancelAllOpenAppointments,
      cancelAllNewStatus,
      updatePatientMutation,
    ],
  );

  const handleConfirmPostpone = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (selectedAppointmentIds.length === 0) {
        const msg = "Select at least one appointment to reschedule.";
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
            "One or more appointments have no available date within 52 weeks. Choose another option.";
          setError(msg);
          showToast(msg, "error", 5000);
        }
        return;
      }

      setCancellationLoading(true);
      setError("");

      try {
        const successes: Array<{ appointmentId: number; newDate: string }> = [];
        const failures: Array<{ appointmentId: number; error: string }> = [];
        const autoRescheduledReturns: Array<{
          appointmentId: number;
          patientId: number;
          patientName: string;
          oldDate: string;
          newDate: string;
        }> = [];
        const failedReturnReschedules: Array<{
          appointmentId: number;
          error: string;
        }> = [];

        if (postponeMode === "next_available") {
          // Group by target date so each unique date is one API call.
          // rescheduleReturnAssessment is intentionally false here: return date logic runs
          // once after ALL postpones via recomputeReturnForEpisode, so it sees the true
          // max session date across all treatment plans (avoids ping-pong when plans go to
          // different dates and each call would overwrite the return with a stale anchor).
          const byDate = new Map<string, number[]>();
          for (const id of selectedAppointmentIds) {
            const date = nextAvailableDates[String(id)];
            if (date != null) {
              const list = byDate.get(date) ?? [];
              list.push(id);
              byDate.set(date, list);
            }
          }
          let anySuccessfulTreatmentAppointmentId: number | null = null;
          for (const [date, ids] of byDate) {
            const result = await bulkPostponeMutation.mutateAsync({
              appointmentIds: ids,
              newDate: date,
              rescheduleReturnAssessment: false,
            });
            successes.push(...(result?.successes ?? []));
            failures.push(...(result?.failures ?? []));
            if ((result?.successes?.length ?? 0) > 0 && anySuccessfulTreatmentAppointmentId === null) {
              anySuccessfulTreatmentAppointmentId = result?.successes?.[0]?.appointmentId ?? null;
            }
          }
          // After all postpones are committed, recompute the return date once from DB state.
          if (anySuccessfulTreatmentAppointmentId !== null) {
            try {
              const recomputeResult = await recomputeReturnMutation.mutateAsync(
                anySuccessfulTreatmentAppointmentId,
              );
              if (recomputeResult.rescheduled && recomputeResult.appointmentId != null) {
                autoRescheduledReturns.push({
                  appointmentId: recomputeResult.appointmentId,
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
            appointmentIds: selectedAppointmentIds,
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
        console.error("Error rescheduling appointments:", mutationError);
        const errorMsg =
          mutationError instanceof Error
            ? mutationError.message
            : "Error rescheduling appointments. Please try again.";
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
      selectedAppointmentIds,
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
      selectedAppointmentIds,
      selectedDate,
      postponeMode,
      reason,
      cancelAllOpenAppointments,
      cancelAllNewStatus,
      nextAvailableDates,
      loadingNextAvailable,
      postponeFeedback,
      appointmentDate: cancellationModal.appointmentDate,
    },
    handlers: {
      setAction,
      handleBackToSelection,
      handleClose,
      toggleSelection,
      setReason,
      setSelectedDate,
      setPostponeMode: handleSetPostponeMode,
      setCancelAllOpenAppointments,
      setCancelAllNewStatus,
      handleConfirmCancellation,
      handleConfirmPostpone,
      handleAcknowledgePostponeFeedback,
    },
  };
};
